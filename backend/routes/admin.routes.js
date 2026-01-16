const express = require('express');
const bcrypt = require('bcrypt');
const router = express.Router();
const { sql, getPool } = require('../db');
const { authenticate, allowRoles } = require('../middleware/auth');

// =========================================================
// ADMIN AUTH GUARD
// =========================================================
router.use(authenticate, allowRoles('admin'));

// =========================================================
// USERS
// =========================================================
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
  if (!name || !email || !password || !role) {
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

router.put('/update-user/:id', async (req, res) => {
  const { name, email, password, role } = req.body;
  const userId = req.params.id;

  const updates = [];
  if (name) updates.push('name = @name');
  if (email) updates.push('email = @email');
  if (password) updates.push('password_hash = @password_hash');
  if (role) updates.push('role = @role');

  if (updates.length === 0) return res.status(400).json({ error: 'No valid fields to update' });

  const pool = await getPool();
  await pool.request()
    .input('name', sql.NVarChar, name)
    .input('email', sql.NVarChar, email)
    .input('password_hash', sql.NVarChar, await bcrypt.hash(password, 10))
    .input('role', sql.VarChar, role)
    .input('user_id', sql.Int, userId)
    .query(`
      UPDATE users
      SET ${updates.join(', ')}
      WHERE user_id = @user_id
    `);

  res.json({ success: true });
});

router.delete('/delete-user/:id', async (req, res) => {
  if (+req.params.id === 1) {
    return res.status(403).json({ error: 'Admin cannot be deleted' });
  }

  const pool = await getPool();
  await pool.request()
    .input('id', sql.Int, req.params.id)
    .query(`DELETE FROM users WHERE user_id=@id`);

  res.json({ success: true });
});

// =========================================================
// EXAMS
// =========================================================
router.get('/exams', async (_, res) => {
  const pool = await getPool();
  const r = await pool.request().query(`
    SELECT 
      e.exam_id,
      e.title,
      e.description,
      e.is_public,
      u.name AS creator_name,
      (SELECT COUNT(*) FROM attempts a WHERE a.exam_id = e.exam_id) AS attempts
    FROM exams e
    JOIN users u ON e.created_by = u.user_id
    ORDER BY e.exam_id
  `);
  res.json(r.recordset);
});

router.post('/create-exam', async (req, res) => {
  const { title, description = '', is_public = true } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });

  const pool = await getPool();
  const r = await pool.request()
    .input('t', sql.NVarChar, title)
    .input('d', sql.NVarChar, description)
    .input('u', sql.Int, req.user.user_id)
    .input('p', sql.Bit, is_public)
    .query(`
      INSERT INTO exams (title, description, created_by, is_public)
      OUTPUT INSERTED.exam_id
      VALUES (@t, @d, @u, @p)
    `);

  res.json({ success: true, exam_id: r.recordset[0].exam_id });
});

router.put('/update-exam/:id', async (req, res) => {
  const { title, description, is_public } = req.body;
  const examId = req.params.id;

  const pool = await getPool();
  await pool.request()
    .input('t', sql.NVarChar, title)
    .input('d', sql.NVarChar, description)
    .input('p', sql.Bit, is_public)
    .input('id', sql.Int, examId)
    .query(`
      UPDATE exams
      SET title = @t, description = @d, is_public = @p
      WHERE exam_id = @id
    `);

  res.json({ success: true });
});

router.delete('/delete-exam/:id', async (req, res) => {
  const pool = await getPool();

  // Delete attempts and questions before deleting exam
  await pool.request().input('id', sql.Int, req.params.id)
    .query(`DELETE FROM attempts WHERE exam_id = @id`);
  await pool.request().input('id', sql.Int, req.params.id)
    .query(`DELETE FROM questions WHERE exam_id = @id`);

  await pool.request().input('id', sql.Int, req.params.id)
    .query(`DELETE FROM exams WHERE exam_id = @id`);

  res.json({ success: true });
});

// =========================================================
// ATTEMPT DELETION REQUESTS
// =========================================================
router.get('/attempt-deletion-requests', async (_, res) => {
  const pool = await getPool();

  const r = await pool.request().query(`
    SELECT
      adr.request_id,
      adr.attempt_id,
      adr.request_reason,
      adr.status,
      adr.requested_at,
      u.name AS student_name,
      u.email AS student_email
    FROM attempt_deletion_requests adr
    JOIN users u ON adr.requested_by = u.user_id
    WHERE adr.status = 'pending'
    ORDER BY adr.requested_at DESC
  `);

  res.json(r.recordset);
});

router.post('/attempt-deletion/:id', async (req, res) => {
  const { action } = req.body; // approve | reject
  const id = +req.params.id;

  if (!['approved', 'rejected'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action' });
  }

  const pool = await getPool();

  if (action === 'approved') {
    await pool.request()
      .input('id', sql.Int, id)
      .query(`
        DELETE FROM attempts
        WHERE attempt_id = (
          SELECT attempt_id FROM attempt_deletion_requests
          WHERE request_id = @id
        )
      `);
  }

  await pool.request()
    .input('id', sql.Int, id)
    .input('u', sql.Int, req.user.user_id)
    .input('s', sql.VarChar, action)
    .query(`
      UPDATE attempt_deletion_requests
      SET status = @s, reviewed_by = @u, reviewed_at = GETDATE()
      WHERE request_id = @id
    `);

  res.json({ success: true });
});

// =========================================================
// SEARCH USERS AND EXAMS
// =========================================================
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
        (SELECT COUNT(*) FROM attempts a WHERE a.exam_id = e.exam_id) AS attempts
      FROM exams e
      JOIN users u ON e.created_by = u.user_id
      WHERE e.title LIKE @q
      ORDER BY e.exam_id
    `);

  res.json(r.recordset);
});

module.exports = router;
