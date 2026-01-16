const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../db');
const { authenticate, allowRoles } = require('../middleware/auth');

router.use(authenticate, allowRoles('examiner'));

/* =========================================================
   GET MY EXAMS
   ========================================================= */
router.get('/exams', async (_, res) => {
  const pool = await getPool();
  try {
    const r = await pool.request().query(`
      SELECT 
        e.exam_id,
        e.title,
        e.description,
        e.is_public,
        u.name AS creator_name,
        (SELECT COUNT(*) FROM attempts a WHERE a.exam_id = e.exam_id) AS total_attempts -- Replaced total_questions with total_attempts
      FROM exams e
      JOIN users u ON e.created_by = u.user_id
      ORDER BY e.exam_id
    `);
    res.json(r.recordset);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching exams' });
  }
});


/* =========================================================
   CREATE EXAM (MANUAL OR AI-SHELL)
   ========================================================= */
router.post('/exam', async (req, res) => {
  const { title, description = '', isPublic = true } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title required' });
  }

  const pool = await getPool();
  const r = await pool.request()
    .input('t', sql.NVarChar, title)
    .input('d', sql.NVarChar, description)
    .input('u', sql.Int, req.user.user_id)
    .input('p', sql.Bit, isPublic)
    .query(`
      INSERT INTO exams
      (title, description, created_by, is_public, total_questions)
      OUTPUT INSERTED.exam_id
      VALUES (@t,@d,@u,@p,0)
    `);

  res.json({ exam_id: r.recordset[0].exam_id });
});

/* =========================================================
   GET QUESTIONS (OWN EXAM)
   ========================================================= */
router.post('/exam', async (req, res) => {
  const { title, description = '', isPublic = true } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title required' });
  }

  const pool = await getPool();
  try {
    const r = await pool.request()
      .input('t', sql.NVarChar, title)
      .input('d', sql.NVarChar, description)
      .input('u', sql.Int, req.user.user_id)
      .input('p', sql.Bit, isPublic)
      .query(`
        INSERT INTO exams
        (title, description, created_by, is_public)
        OUTPUT INSERTED.exam_id
        VALUES (@t, @d, @u, @p)
      `);

    res.json({ exam_id: r.recordset[0].exam_id });
  } catch (err) {
    console.error('Error creating exam:', err);
    res.status(500).json({ message: 'Error creating exam' });
  }
});


/* =========================================================
   ADD / REPLACE QUESTIONS (OWN EXAM)
   ========================================================= */
router.post('/exam/:id/questions', async (req, res) => {
  const questions = req.body;
  const pool = await getPool();

  const own = await pool.request()
    .input('id', sql.Int, req.params.id)
    .input('u', sql.Int, req.user.user_id)
    .query(`
      SELECT 1 FROM exams
      WHERE exam_id=@id AND created_by=@u
    `);

  if (!own.recordset.length) {
    return res.status(403).json({ error: 'Not your exam' });
  }

  // Lock editing if exam already attempted
  const attempts = await pool.request()
    .input('id', sql.Int, req.params.id)
    .query(`SELECT COUNT(*) c FROM attempts WHERE exam_id=@id`);

  if (attempts.recordset[0].c > 0) {
    return res.status(403).json({ error: 'Exam already attempted' });
  }

  // Clear old questions for AI regen or manual edits
  await pool.request()
    .input('id', sql.Int, req.params.id)
    .query(`DELETE FROM questions WHERE exam_id=@id`);

  for (const q of questions) {
    await pool.request()
      .input('e', sql.Int, req.params.id)
      .input('qt', sql.NVarChar, q.question_text)
      .input('a', sql.NVarChar, q.option_a)
      .input('b', sql.NVarChar, q.option_b)
      .input('c', sql.NVarChar, q.option_c)
      .input('d', sql.NVarChar, q.option_d)
      .input('o', sql.Char, q.correct_option)
      .query(`
        INSERT INTO questions
        (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option)
        VALUES (@e,@qt,@a,@b,@c,@d,@o)
      `);
  }

  await pool.request()
    .input('id', sql.Int, req.params.id)
    .query(`
      UPDATE exams
      SET total_questions = (
        SELECT COUNT(*) FROM questions WHERE exam_id=@id
      )
      WHERE exam_id=@id
    `);

  res.json({ success: true });
});

/* =========================================================
   DELETE OWN EXAM
   ========================================================= */
router.delete('/exam/:id', async (req, res) => {
  const pool = await getPool();

  const own = await pool.request()
    .input('id', sql.Int, req.params.id)
    .input('u', sql.Int, req.user.user_id)
    .query(`
      SELECT 1 FROM exams
      WHERE exam_id=@id AND created_by=@u
    `);

  if (!own.recordset.length) {
    return res.status(403).json({ error: 'Not your exam' });
  }

  await pool.request().input('id', sql.Int, req.params.id)
    .query(`DELETE FROM attempts WHERE exam_id=@id`);
  await pool.request().input('id', sql.Int, req.params.id)
    .query(`DELETE FROM questions WHERE exam_id=@id`);
  await pool.request().input('id', sql.Int, req.params.id)
    .query(`DELETE FROM exams WHERE exam_id=@id`);

  res.json({ success: true });
});

/* =========================================================
   VIEW RESULTS (ONLY OWN EXAMS)
   ========================================================= */
router.get('/results', async (req, res) => {
  const pool = await getPool();

  const r = await pool.request()
    .input('u', sql.Int, req.user.user_id)
    .query(`
      SELECT
        r.attempt_id,
        r.exam_id,
        r.title,
        r.name AS student_name,
        r.score,
        r.attempted_at
      FROM vw_exam_results r
      WHERE r.exam_id IN (
        SELECT exam_id FROM exams WHERE created_by=@u
      )
      ORDER BY r.attempted_at DESC
    `);

  res.json(r.recordset);
});

module.exports = router;
