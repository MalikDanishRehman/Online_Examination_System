const express = require('express');
const router = express.Router();
const { sql, getPool } = require('../db');
const { authenticate, allowRoles } = require('../middleware/auth');

router.use(authenticate, allowRoles('examiner'));

/* CREATE EXAM */
router.post('/exam', async (req, res) => {
    const { title, description, isPublic, totalQuestions } = req.body;

    const pool = await getPool();
    const result = await pool.request()
        .input('t', sql.VarChar, title)
        .input('d', sql.VarChar, description)
        .input('c', sql.Int, req.user.user_id)
        .input('p', sql.Bit, isPublic)
        .input('q', sql.Int, totalQuestions)
        .query(`
            INSERT INTO exams (title,description,created_by,is_public,total_questions)
            OUTPUT INSERTED.exam_id
            VALUES (@t,@d,@c,@p,@q)
        `);

    res.json({ examId: result.recordset[0].exam_id });
});

/* VIEW RESULTS */
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
