const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../db');

/* AVAILABLE EXAMS */
router.get('/exams/:id', async (req, res) => {
    const pool = await getPool();
    const result = await pool.request()
        .input('id', sql.Int, req.params.id)
        .query(`
            SELECT * FROM exams
            WHERE is_public=1
            OR exam_id IN (
                SELECT exam_id FROM exam_visibility WHERE examinee_id=@id
            )
        `);

    res.json(result.recordset);
});

/* REQUEST ATTEMPT DELETE */
router.post('/request-delete', async (req, res) => {
    const { attemptId, userId, reason } = req.body;

    const pool = await getPool();
    await pool.request()
        .input('a', sql.Int, attemptId)
        .input('u', sql.Int, userId)
        .input('r', sql.VarChar, reason)
        .query(`
            INSERT INTO attempt_deletion_requests
            (attempt_id,requested_by,request_reason)
            VALUES (@a,@u,@r)
        `);

    res.json({ success: true });
});

module.exports = router;
