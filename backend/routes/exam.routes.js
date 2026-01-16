const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../db');
const { authenticate } = require('../middleware/auth');

/* =========================================================
   GET QUESTIONS (NO ANSWERS FOR STUDENTS)
   ========================================================= */
router.get('/:examId/questions', authenticate, async (req, res) => {
    const pool = await getPool();

    const result = await pool.request()
        .input('id', sql.Int, req.params.examId)
        .query(`
            SELECT
              question_id,
              question_text,
              option_a,
              option_b,
              option_c,
              option_d
            FROM questions
            WHERE exam_id=@id
            ORDER BY question_id
        `);

    res.json(result.recordset);
});

/* =========================================================
   SUBMIT EXAM (AUTO SCORE + SAVE ANSWERS)
   ========================================================= */
router.post('/:examId/submit', authenticate, async (req, res) => {
    const { answers } = req.body;
    const examId = +req.params.examId;
    const userId = req.user.user_id;

    if (!Array.isArray(answers) || !answers.length) {
        return res.status(400).json({ error: 'Answers required' });
    }

    const pool = await getPool();

    /* Prevent reattempt */
    const already = await pool.request()
        .input('e', sql.Int, examId)
        .input('u', sql.Int, userId)
        .query(`
            SELECT 1 FROM attempts
            WHERE exam_id=@e AND examinee_id=@u
        `);

    if (already.recordset.length) {
        return res.status(403).json({ error: 'Exam already attempted' });
    }

    /* Fetch correct answers */
    const qRes = await pool.request()
        .input('e', sql.Int, examId)
        .query(`
            SELECT question_id, correct_option
            FROM questions
            WHERE exam_id=@e
        `);

    let score = 0;
    const correctMap = {};
    qRes.recordset.forEach(q => correctMap[q.question_id] = q.correct_option);

    /* Create attempt */
    const attemptRes = await pool.request()
        .input('e', sql.Int, examId)
        .input('u', sql.Int, userId)
        .query(`
            INSERT INTO attempts (exam_id, examinee_id, score)
            OUTPUT INSERTED.attempt_id
            VALUES (@e,@u,0)
        `);

    const attemptId = attemptRes.recordset[0].attempt_id;

    /* Save answers */
    for (const a of answers) {
        const isCorrect = correctMap[a.question_id] === a.selected_option;
        if (isCorrect) score++;

        await pool.request()
            .input('aid', sql.Int, attemptId)
            .input('qid', sql.Int, a.question_id)
            .input('opt', sql.Char, a.selected_option)
            .input('ok', sql.Bit, isCorrect)
            .query(`
                INSERT INTO attempt_answers
                (attempt_id, question_id, selected_option, is_correct)
                VALUES (@aid,@qid,@opt,@ok)
            `);
    }

    /* Update final score */
    await pool.request()
        .input('s', sql.Int, score)
        .input('id', sql.Int, attemptId)
        .query(`UPDATE attempts SET score=@s WHERE attempt_id=@id`);

    res.json({ success: true, score });
});

module.exports = router;
