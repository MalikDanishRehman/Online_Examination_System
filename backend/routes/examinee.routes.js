const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../db');
const { authenticate, allowRoles } = require('../middleware/auth');

router.use(authenticate, allowRoles('examinee'));

/* =========================================================
   AVAILABLE EXAMS
   ========================================================= */
router.get('/exams', async (req, res) => {
    const pool = await getPool();
    const result = await pool.request()
        .input('id', sql.Int, req.user.user_id)
        .query(`
            SELECT * FROM exams
            WHERE is_public=1
            OR exam_id IN (
                SELECT exam_id FROM exam_visibility WHERE examinee_id=@id
            )
        `);

    res.json(result.recordset);
});

/* =========================================================
   ATTEMPT HISTORY
   ========================================================= */
router.get('/attempts', async (req, res) => {
    const pool = await getPool();
    const result = await pool.request()
        .input('id', sql.Int, req.user.user_id)
        .query(`
            SELECT * FROM vw_student_attempts
            WHERE attempt_id IN (
                SELECT attempt_id FROM attempts WHERE examinee_id=@id
            )
        `);

    res.json(result.recordset);
});

/* =========================================================
   REQUEST DELETE
   ========================================================= */
router.post('/request-delete', async (req, res) => {
    const { attemptId, reason } = req.body;

    const pool = await getPool();
    await pool.request()
        .input('a', sql.Int, attemptId)
        .input('u', sql.Int, req.user.user_id)
        .input('r', sql.VarChar, reason)
        .query(`
            INSERT INTO attempt_deletion_requests
            (attempt_id,requested_by,request_reason)
            VALUES (@a,@u,@r)
        `);

    res.json({ success: true });
});

module.exports = router;
