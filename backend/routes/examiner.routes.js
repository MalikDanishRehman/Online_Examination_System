const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../db');
const { authenticate, allowRoles } = require('../middleware/auth');

router.use(authenticate, allowRoles('examiner'));

/* =========================================================
   GET MY EXAMS
   ========================================================= */
router.get('/exams', async (req, res) => {
  const pool = await getPool();

  const result = await pool.request()
    .input('uid', sql.Int, req.user.user_id)
    .query(`
      SELECT
        e.exam_id AS id,
        e.title,
        e.total_questions AS questionCount,
        e.is_public AS isPublic
      FROM exams e
      WHERE e.created_by = @uid
      ORDER BY e.exam_id DESC
    `);

  res.json(result.recordset);
});


/* =========================================================
   CREATE EXAM
   ========================================================= */
router.post('/exam', async (req, res) => {
  const { title, description = '', isPublic = true, totalQuestions = 0 } = req.body;

  if (!title) return res.status(400).json({ error: 'Title required' });

  const pool = await getPool();
  const result = await pool.request()
    .input('t', sql.NVarChar, title)
    .input('d', sql.NVarChar, description)
    .input('c', sql.Int, req.user.user_id)
    .input('p', sql.Bit, isPublic)
    .input('q', sql.Int, totalQuestions)
    .query(`
      INSERT INTO exams (title, description, created_by, is_public, total_questions)
      OUTPUT INSERTED.exam_id
      VALUES (@t,@d,@c,@p,@q)
    `);

  res.json({ examId: result.recordset[0].exam_id });
});

/* =========================================================
   DELETE EXAM (ONLY OWNED)
   ========================================================= */
router.delete('/exams/:id', async (req, res) => {
  const pool = await getPool();

  // ownership check
  const check = await pool.request()
    .input('id', sql.Int, req.params.id)
    .input('uid', sql.Int, req.user.user_id)
    .query(`
      SELECT exam_id FROM exams
      WHERE exam_id=@id AND created_by=@uid
    `);

  if (!check.recordset.length) {
    return res.status(403).json({ error: 'Not your exam' });
  }

  await pool.request()
    .input('id', sql.Int, req.params.id)
    .query(`DELETE FROM attempts WHERE exam_id=@id`);

  await pool.request()
    .input('id', sql.Int, req.params.id)
    .query(`DELETE FROM questions WHERE exam_id=@id`);

  await pool.request()
    .input('id', sql.Int, req.params.id)
    .query(`DELETE FROM exams WHERE exam_id=@id`);

  res.json({ success: true });
});

/* =========================================================
   ADD QUESTIONS (OWN EXAM ONLY)
   ========================================================= */
router.post('/exam/:examId/questions', async (req, res) => {
  const { examId } = req.params;
  const questions = req.body;

  const pool = await getPool();

  const examCheck = await pool.request()
    .input('examId', sql.Int, examId)
    .input('uid', sql.Int, req.user.user_id)
    .query(`
      SELECT exam_id FROM exams
      WHERE exam_id=@examId AND created_by=@uid
    `);

  if (!examCheck.recordset.length) {
    return res.status(403).json({ error: 'Not your exam' });
  }

  for (const q of questions) {
    await pool.request()
      .input('exam', sql.Int, examId)
      .input('qt', sql.NVarChar, q.question_text)
      .input('a', sql.NVarChar, q.option_a)
      .input('b', sql.NVarChar, q.option_b)
      .input('c', sql.NVarChar, q.option_c)
      .input('d', sql.NVarChar, q.option_d)
      .input('ca', sql.Char, q.correct_option)
      .query(`
        INSERT INTO questions
        (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option)
        VALUES (@exam,@qt,@a,@b,@c,@d,@ca)
      `);
  }

  res.json({ success: true });
});

/* =========================================================
   VIEW RESULTS
   ========================================================= */
router.get('/results', async (req, res) => {
  const pool = await getPool();
  const result = await pool.request()
    .input('id', sql.Int, req.user.user_id)
    .query(`
      SELECT * FROM vw_exam_results
      WHERE exam_title IN (
        SELECT title FROM exams WHERE created_by=@id
      )
    `);

  res.json(result.recordset);
});

module.exports = router;
