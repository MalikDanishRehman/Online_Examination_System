const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../db');
const { authenticate } = require('../middleware/auth');

/* GET QUESTIONS */
router.get('/:examId/questions', authenticate, async (req, res) => {
    const pool = await getPool();
    const result = await pool.request()
        .input('id', sql.Int, req.params.examId)
        .query('SELECT * FROM questions WHERE exam_id=@id');

    res.json(result.recordset);
});

/* SUBMIT EXAM */
router.post('/:examId/submit', authenticate, async (req, res) => {
    const { score } = req.body;

    const pool = await getPool();
    await pool.request()
        .input('exam', sql.Int, req.params.examId)
        .input('user', sql.Int, req.user.user_id)
        .input('score', sql.Int, score)
        .query(`
            INSERT INTO attempts (exam_id, examinee_id, score)
            VALUES (@exam, @user, @score)
        `);

    res.json({ success: true });
});

module.exports = router;
