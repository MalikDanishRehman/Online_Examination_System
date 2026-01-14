require('dotenv').config();
const express = require('express');
const sql = require('mssql/msnodesqlv8');
const cors = require('cors');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/admin', require('./routes/admin.routes'));
app.use('/api/examiner', require('./routes/examiner.routes'));
app.use('/api/examinee', require('./routes/examinee.routes'));
app.use('/api/ai', require('./routes/ai.routes'));


/* ================= DATABASE ================= */

const dbConfig = {
    connectionString:
        `Driver={${process.env.DB_DRIVER}};` +
        `Server=${process.env.DB_SERVER};` +
        `Database=${process.env.DB_NAME};` +
        `Trusted_Connection=${process.env.DB_TRUSTED_CONNECTION};` +
        `TrustServerCertificate=${process.env.DB_TRUST_CERT};`
};

async function getPool() {
    return await sql.connect(dbConfig);
}

/* ================= AI ================= */

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

/* ================= AUTH ================= */

/* LOGIN */
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('email', sql.VarChar, email)
            .query('SELECT * FROM users WHERE email=@email');

        if (!result.recordset.length)
            return res.json({ success: false, message: 'User not found' });

        const user = result.recordset[0];
        const match = await bcrypt.compare(password, user.password_hash);

        if (!match)
            return res.json({ success: false, message: 'Invalid credentials' });

        res.json({ success: true, user });
    } catch (err) {
        console.error(err);
        res.status(500).send("Login failed");
    }
});

/* REGISTER (STUDENT ONLY) */
app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const hash = await bcrypt.hash(password, 10);
        const pool = await getPool();

        await pool.request()
            .input('name', sql.VarChar, name)
            .input('email', sql.VarChar, email)
            .input('password', sql.VarChar, hash)
            .query(`
                INSERT INTO users (name,email,password_hash,role)
                VALUES (@name,@email,@password,'examinee')
            `);

        res.json({ success: true });
    } catch (err) {
        if (err.number === 2627)
            res.json({ success: false, message: 'Email already exists' });
        else {
            console.error(err);
            res.status(500).send("Register failed");
        }
    }
});

/* ================= ADMIN ================= */

/* CREATE USER (EXAMINER / EXAMINEE) */
app.post('/api/admin/create-user', async (req, res) => {
    const { name, email, password, role } = req.body;

    if (!['examiner', 'examinee'].includes(role))
        return res.status(400).send("Invalid role");

    try {
        const hash = await bcrypt.hash(password, 10);
        const pool = await getPool();

        await pool.request()
            .input('name', sql.VarChar, name)
            .input('email', sql.VarChar, email)
            .input('password', sql.VarChar, hash)
            .input('role', sql.VarChar, role)
            .query(`
                INSERT INTO users (name,email,password_hash,role)
                VALUES (@name,@email,@password,@role)
            `);

        res.json({ success: true });
    } catch {
        res.status(500).send("Create user failed");
    }
});

/* ================= EXAMINER ================= */

/* CREATE EXAM */
app.post('/api/exam', async (req, res) => {
    const { title, description, examinerId, isPublic, totalQuestions } = req.body;

    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('title', sql.VarChar, title)
            .input('desc', sql.VarChar, description)
            .input('creator', sql.Int, examinerId)
            .input('pub', sql.Bit, isPublic)
            .input('total', sql.Int, totalQuestions)
            .query(`
                INSERT INTO exams (title,description,created_by,is_public,total_questions)
                OUTPUT INSERTED.exam_id
                VALUES (@title,@desc,@creator,@pub,@total)
            `);

        res.json({ success: true, examId: result.recordset[0].exam_id });
    } catch {
        res.status(500).send("Create exam failed");
    }
});

/* ADD QUESTIONS */
app.post('/api/exam/:id/questions', async (req, res) => {
    const { questions } = req.body;

    try {
        const pool = await getPool();
        for (const q of questions) {
            await pool.request()
                .input('exam', sql.Int, req.params.id)
                .input('qt', sql.NVarChar, q.question_text)
                .input('a', sql.VarChar, q.option_a)
                .input('b', sql.VarChar, q.option_b)
                .input('c', sql.VarChar, q.option_c)
                .input('d', sql.VarChar, q.option_d)
                .input('ans', sql.Char, q.correct_option)
                .query(`
                    INSERT INTO questions
                    (exam_id,question_text,option_a,option_b,option_c,option_d,correct_option)
                    VALUES (@exam,@qt,@a,@b,@c,@d,@ans)
                `);
        }
        res.json({ success: true });
    } catch {
        res.status(500).send("Add questions failed");
    }
});

/* ================= EXAMINEE ================= */

/* AVAILABLE EXAMS */
app.get('/api/exams/available/:userId', async (req, res) => {
    try {
        const pool = await getPool();
        const result = await pool.request()
            .input('uid', sql.Int, req.params.userId)
            .query(`
                SELECT * FROM exams
                WHERE is_public = 1
                OR exam_id IN (
                    SELECT exam_id FROM exam_visibility WHERE examinee_id=@uid
                )
            `);
        res.json(result.recordset);
    } catch {
        res.status(500).send("Fetch exams failed");
    }
});

/* SUBMIT EXAM */
app.post('/api/exam/:id/submit', async (req, res) => {
    const { examineeId, score } = req.body;

    try {
        const pool = await getPool();
        await pool.request()
            .input('exam', sql.Int, req.params.id)
            .input('user', sql.Int, examineeId)
            .input('score', sql.Int, score)
            .query(`
                INSERT INTO attempts (exam_id,examinee_id,score)
                VALUES (@exam,@user,@score)
            `);

        res.json({ success: true });
    } catch {
        res.status(500).send("Submit failed");
    }
});

/* ================= ATTEMPT DELETION REQUEST ================= */

app.post('/api/attempt/request-delete', async (req, res) => {
    const { attemptId, userId, reason } = req.body;

    try {
        const pool = await getPool();
        await pool.request()
            .input('att', sql.Int, attemptId)
            .input('usr', sql.Int, userId)
            .input('reason', sql.VarChar, reason)
            .query(`
                INSERT INTO attempt_deletion_requests
                (attempt_id,requested_by,request_reason)
                VALUES (@att,@usr,@reason)
            `);

        res.json({ success: true });
    } catch {
        res.status(500).send("Request failed");
    }
});

/* ================= ADMIN / EXAMINER ================= */

app.delete('/api/attempt/:id', async (req, res) => {
    try {
        const pool = await getPool();
        await pool.request()
            .input('id', sql.Int, req.params.id)
            .query('DELETE FROM attempts WHERE attempt_id=@id');

        res.json({ success: true });
    } catch {
        res.status(500).send("Delete attempt failed");
    }
});

/* ================= AI ================= */

app.post('/api/ai/generate', async (req, res) => {
    const { topic, count } = req.body;

    const prompt = `Create ${count} MCQs on ${topic}. Return JSON only.`;

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const text = result.response.text()
            .replace(/```json|```/g, '');

        res.json(JSON.parse(text));
    } catch (err) {
        console.error(err);
        res.status(500).send("AI failed");
    }
});

/* ================= SERVER ================= */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
