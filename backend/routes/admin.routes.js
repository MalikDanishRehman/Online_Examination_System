const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { sql, getPool } = require('../db');
const { authenticate, allowRoles } = require('../middleware/auth');

/* =========================================================
   ADMIN AUTH GUARD
   ========================================================= */
router.use(authenticate, allowRoles('admin'));

/* =========================================================
   USERS
   ========================================================= */
router.get('/users', async (_, res) => {
  const pool = await getPool();
  const r = await pool.request().query(`
    SELECT user_id, name, email, role
    FROM users
    ORDER BY user_id
  `);
  res.json(r.recordset);
});

router.post('/create-user', async (req, res) => {
  const { name, email, password, role } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'All fields required' });
  }

  const hash = await bcrypt.hash(password, 10);
  const pool = await getPool();

  await pool.request()
    .input('n', sql.NVarChar, name)
    .input('e', sql.NVarChar, email)
    .input('p', sql.NVarChar, hash)
    .input('r', sql.VarChar, role)
    .query(`
      INSERT INTO users (name, email, password_hash, role)
      VALUES (@n,@e,@p,@r)
    `);

  res.json({ success: true });
});

/* =========================================================
   CREATE EXAM (EMPTY)
   ========================================================= */
router.post('/exam', async (req, res) => {
  const { title, description = '', is_public = true } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });

  const pool = await getPool();
  await pool.request()
    .input('t', sql.NVarChar, title)
    .input('d', sql.NVarChar, description)
    .input('u', sql.Int, req.user.user_id)
    .input('p', sql.Bit, is_public)
    .query(`
      INSERT INTO exams (title, description, created_by, is_public, total_questions)
      VALUES (@t,@d,@u,@p,0)
    `);

  res.json({ success: true });
});

/* =========================================================
   AI – CREATE EXAM + RETURN QUESTIONS
   ========================================================= */
router.post('/exam/ai', async (req, res) => {
  try {
    const { topic, count = 5 } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topic required' });
    }

    if (!process.env.GOOGLE_API_KEY) {
      return res.status(500).json({
        error: 'GOOGLE_API_KEY missing on server'
      });
    }

    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

    const prompt = `
Return ONLY a JSON array.
No markdown.
No explanation.

Each item format:
{
  "question": "string",
  "A": "string",
  "B": "string",
  "C": "string",
  "D": "string",
  "correct": "A"
}

Topic: ${topic}
Number of questions: ${count}
`;

    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
    });

    const result = await model.generateContent(prompt);
    let text = result.response.text();

    // Clean Gemini garbage
    text = text
      .replace(/```json/gi, '')
      .replace(/```/g, '')
      .trim();

    let questions;
    try {
      questions = JSON.parse(text);
    } catch (parseErr) {
      console.error('JSON PARSE FAILED');
      console.error(text);

      return res.status(500).json({
        error: 'Gemini returned invalid JSON',
        raw: text
      });
    }

    const pool = await getPool();
    const r = await pool.request()
      .input('t', sql.NVarChar, `${topic} Exam`)
      .input('d', sql.NVarChar, `AI generated exam on ${topic}`)
      .input('u', sql.Int, req.user.user_id)
      .query(`
        INSERT INTO exams
        (title, description, created_by, is_public, total_questions)
        OUTPUT INSERTED.exam_id
        VALUES (@t,@d,@u,1,0)
      `);

    res.json({
      success: true,
      exam_id: r.recordset[0].exam_id,
      suggested_questions: questions
    });

  } catch (err) {
    console.error('AI GENERATION ERROR');
    console.error(err);

    res.status(500).json({
      error: 'AI generation failed',
      details: err.message
    });
  }
});



/* =========================================================
   EXAMS (WITH ATTEMPTS COUNT)
   ========================================================= */
router.get('/exams', async (_, res) => {
  const pool = await getPool();
  const r = await pool.request().query(`
    SELECT 
      e.exam_id,
      e.title,
      e.description,
      e.is_public,
      u.name AS creator_name,
      (SELECT COUNT(*) FROM attempts a WHERE a.exam_id=e.exam_id) AS attempts
    FROM exams e
    JOIN users u ON e.created_by = u.user_id
    ORDER BY e.exam_id
  `);
  res.json(r.recordset);
});

/* =========================================================
   QUESTIONS (LOCKED AFTER ATTEMPT)
   ========================================================= */
router.get('/exam/:id/questions', async (req, res) => {
  const pool = await getPool();
  const r = await pool.request()
    .input('id', sql.Int, req.params.id)
    .query(`
      SELECT question_id, question_text,
             option_a, option_b, option_c, option_d, correct_option
      FROM questions
      WHERE exam_id=@id
      ORDER BY question_id
    `);
  res.json(r.recordset);
});

router.post('/exam/:id/questions', async (req, res) => {
  const pool = await getPool();

  const attempts = await pool.request()
    .input('id', sql.Int, req.params.id)
    .query(`SELECT COUNT(*) c FROM attempts WHERE exam_id=@id`);

  if (attempts.recordset[0].c > 0) {
    return res.status(403).json({ error: 'Exam already attempted' });
  }

  const q = req.body;
  await pool.request()
    .input('e', sql.Int, req.params.id)
    .input('q', sql.NVarChar, q.question_text)
    .input('a', sql.NVarChar, q.option_a)
    .input('b', sql.NVarChar, q.option_b)
    .input('c', sql.NVarChar, q.option_c)
    .input('d', sql.NVarChar, q.option_d)
    .input('o', sql.Char, q.correct_option)
    .query(`
      INSERT INTO questions
      (exam_id, question_text, option_a, option_b, option_c, option_d, correct_option)
      VALUES (@e,@q,@a,@b,@c,@d,@o)
    `);

  await pool.request()
    .input('id', sql.Int, req.params.id)
    .query(`
      UPDATE exams
      SET total_questions = (SELECT COUNT(*) FROM questions WHERE exam_id=@id)
      WHERE exam_id=@id
    `);

  res.json({ success: true });
});

router.delete('/exam/:examId/questions/:qid', async (req, res) => {
  const pool = await getPool();

  const attempts = await pool.request()
    .input('id', sql.Int, req.params.examId)
    .query(`SELECT COUNT(*) c FROM attempts WHERE exam_id=@id`);

  if (attempts.recordset[0].c > 0) {
    return res.status(403).json({ error: 'Exam already attempted' });
  }

  await pool.request()
    .input('q', sql.Int, req.params.qid)
    .query(`DELETE FROM questions WHERE question_id=@q`);

  res.json({ success: true });
});

/* =========================================================
   ATTEMPTS (ADMIN VIEW)
   ========================================================= */
router.get('/exam/:id/attempts', async (req, res) => {
  const pool = await getPool();
  const r = await pool.request()
    .input('id', sql.Int, req.params.id)
    .query(`
      SELECT 
        a.attempt_id,
        u.name AS student_name,
        u.email AS student_email,
        a.score,
        e.total_questions
      FROM attempts a
      JOIN users u ON a.examinee_id = u.user_id
      JOIN exams e ON a.exam_id = e.exam_id
      WHERE a.exam_id=@id
      ORDER BY a.attempt_id
    `);

  res.json(r.recordset);
});

/* =========================================================
   DELETE EXAM (ALWAYS ALLOWED)
   ========================================================= */
router.delete('/exam/:id', async (req, res) => {
  const pool = await getPool();

  // Ensure the exam exists before proceeding
  const exists = await pool.request()
    .input('id', sql.Int, req.params.id)
    .query(`SELECT 1 FROM exams WHERE exam_id=@id`);

  if (!exists.recordset.length) {
    return res.status(404).json({ error: 'Exam not found' });
  }

  // Delete attempts, questions, and then the exam
  await pool.request().input('id', sql.Int, req.params.id)
    .query(`DELETE FROM attempts WHERE exam_id=@id`);

  await pool.request().input('id', sql.Int, req.params.id)
    .query(`DELETE FROM questions WHERE exam_id=@id`);

  await pool.request().input('id', sql.Int, req.params.id)
    .query(`DELETE FROM exams WHERE exam_id=@id`);

  res.json({ success: true });
});


/* =========================================================
   DELETE USER
   ========================================================= */
router.delete('/user/:id', async (req, res) => {
  if (+req.params.id === 1) {
    return res.status(403).json({ error: 'Admin cannot be deleted' });
  }

  const pool = await getPool();
  await pool.request()
    .input('id', sql.Int, req.params.id)
    .query(`DELETE FROM users WHERE user_id=@id`);

  res.json({ success: true });
});

router.get('/users/search', async (req, res) => {
  const q = req.query.q || '';
  const pool = await getPool();

  const r = await pool.request()
    .input('q', sql.NVarChar, `%${q}%`)
    .query(`
      SELECT user_id, name, email, role
      FROM users
      WHERE name LIKE @q OR email LIKE @q
      ORDER BY user_id
    `);

  res.json(r.recordset);
});

router.get('/exams/search', async (req, res) => {
  const q = req.query.q || '';
  const pool = await getPool();

  const r = await pool.request()
    .input('q', sql.NVarChar, `%${q}%`)
    .query(`
      SELECT 
        e.exam_id,
        e.title,
        e.description,
        e.is_public,
        u.name AS creator_name,
        (SELECT COUNT(*) FROM attempts a WHERE a.exam_id=e.exam_id) AS attempts
      FROM exams e
      JOIN users u ON e.created_by = u.user_id
      WHERE e.title LIKE @q
      ORDER BY e.exam_id
    `);

  res.json(r.recordset);
});


module.exports = router;
