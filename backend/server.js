require('dotenv').config();

const express = require('express');
const sql = require('mssql/msnodesqlv8');
const cors = require('cors');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(bodyParser.json());

/* ================= DATABASE ================= */

function buildConfig(server) {
    return {
        connectionString:
            `Driver={${process.env.DB_DRIVER}};` +
            `Server=${server};` +
            `Database=${process.env.DB_NAME};` +
            `Trusted_Connection=${process.env.DB_TRUSTED_CONNECTION};` +
            `TrustServerCertificate=${process.env.DB_TRUST_CERT};`
    };
}

const dbLocal = buildConfig(process.env.DB_SERVER_LOCAL);
const dbFriend = buildConfig(process.env.DB_SERVER_FRIEND);

async function connectDb() {
    try {
        console.log("Connecting to A's DB");
        return await sql.connect(dbLocal);
    } catch {
        console.log("Connecting to D's DB");
        return await sql.connect(dbFriend);
    }
}

/* ================= AI ================= */
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);




/* ================= AUTH ================= */

const { generateToken } = require('./auth/jwt');  // Import the JWT utilities

app.post('/api/login', async (req, res) => {
    const { rollNo, password } = req.body;

    try {
        const pool = await connectDb();
        const result = await pool.request()
            .input('RollNo', sql.VarChar, rollNo)
            .query('SELECT * FROM Users WHERE RollNo=@RollNo');

        if (result.recordset.length > 0) {
            const user = result.recordset[0];

            // Simple password comparison (no bcrypt as per user request)
            if (password === user.Password) {
                // Generate a JWT token
                const token = generateToken(user);

                // Send the token along with user data in the response
                res.json({
                    success: true,
                    token: token,
                    user: {
                        FullName: user.FullName,
                        RollNo: user.RollNo,
                        Role: user.Role,
                        UserID: user.UserID
                    }
                });
            } else {
                res.json({ success: false, message: 'Invalid credentials' });
            }
        } else {
            res.json({ success: false, message: 'Invalid credentials' });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send('Login failed');
    }
});

/* ================= USERS ================= */

app.post('/api/addUser', async (req, res) => {
    const { fullName, rollNo, password, role } = req.body;
    try {
        const pool = await connectDb();
        await pool.request()
            .input('FullName', sql.VarChar, fullName)
            .input('RollNo', sql.VarChar, rollNo)
            .input('Password', sql.VarChar, password)
            .input('Role', sql.VarChar, role)
            .query(
                'INSERT INTO Users (FullName,RollNo,Password,Role) VALUES (@FullName,@RollNo,@Password,@Role)'
            );

        res.json({ success: true });
    } catch (err) {
        if (err.number === 2627) {
            res.json({ success: false, message: "User already exists" });
        } else {
            console.error(err);
            res.status(500).send("Add user failed");
        }
    }
});

app.get('/api/users', async (req, res) => {
    try {
        const pool = await connectDb();
        const result = await pool.request().query('SELECT * FROM Users');
        res.json(result.recordset);
    } catch {
        res.status(500).send("Fetch users failed");
    }
});

app.delete('/api/deleteUser/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await connectDb();
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query('DELETE FROM Users WHERE UserID=@id');

        res.json({
            success: result.rowsAffected[0] > 0
        });
    } catch {
        res.status(500).send("Delete failed");
    }
});

/* ================= QUESTIONS ================= */

app.get('/api/questions', async (req, res) => {
    try {
        const pool = await connectDb();
        const result = await pool.request().query('SELECT * FROM Questions');
        res.json(result.recordset);
    } catch {
        res.status(500).send("Fetch questions failed");
    }
});

app.get('/api/questions/:examId', async (req, res) => {
    const { examId } = req.params;
    try {
        const pool = await connectDb();
        const result = await pool.request()
            .input('ExamID', sql.Int, examId)
            .query('SELECT * FROM Questions WHERE ExamID=@ExamID');
        res.json(result.recordset);
    } catch {
        res.status(500).send("Fetch questions failed");
    }
});

/* ================= RESULTS ================= */

app.post('/api/saveResult', async (req, res) => {
    const { rollNo, score, totalQuestions, examId } = req.body;
    try {
        const pool = await connectDb();
        await pool.request()
            .input('RollNo', sql.VarChar, rollNo)
            .input('Score', sql.Int, score)
            .input('TotalQuestions', sql.Int, totalQuestions)
            .input('ExamID', sql.Int, examId)
            .query(
                'INSERT INTO ExamResults (RollNo,Score,TotalQuestions,ExamID) VALUES (@RollNo,@Score,@TotalQuestions,@ExamID)'
            );

        res.json({ success: true });
    } catch {
        res.status(500).send("Save result failed");
    }
});

app.get('/api/results', async (req, res) => {
    try {
        const pool = await connectDb();
        const result = await pool.request()
            .query('SELECT * FROM ExamResults ORDER BY ExamDate DESC');
        res.json(result.recordset);
    } catch {
        res.status(500).send("Fetch results failed");
    }
});

/* ================= EXAMS ================= */
app.post('/api/createExam', async (req, res) => {
    const { title, subject, questions, isAICreated, teacherId } = req.body;
    let passingMarks = 50;
    let totalQuestions = questions.length;

    if (isAICreated) {
        passingMarks = 50;
    }

    try {
        const pool = await connectDb();

        const result = await pool.request()
            .input('Title', sql.VarChar, title)
            .input('Subject', sql.VarChar, subject)
            .input('TeacherID', sql.Int, isAICreated ? 2 : teacherId)  // Set TeacherID to 2 for AI-created exams
            .input('PassingMarks', sql.Int, passingMarks)
            .input('IsPublished', sql.Int, 1) // Mark as published if it's AI-generated
            .query(`
                INSERT INTO Exams (ExamTitle, Subject, TeacherID, PassingMarks, IsPublished)
                OUTPUT INSERTED.ExamID
                VALUES (@Title, @Subject, @TeacherID, @PassingMarks, @IsPublished)
            `);

        const examId = result.recordset[0].ExamID;

        // Insert each question into the database
        for (const q of questions) {
            console.log("Inserting Question:", q);

            // Ensure the correct answer is valid
            if (!['A', 'B', 'C', 'D'].includes(q.answer)) {
                q.answer = 'A'; // Default to 'A' if the correct answer is invalid
            }

            await pool.request()
                .input('ExamID', sql.Int, examId)
                .input('QuestionText', sql.NVarChar, q.question)
                .input('OptionA', sql.VarChar, q.options.A)
                .input('OptionB', sql.VarChar, q.options.B)
                .input('OptionC', sql.VarChar, q.options.C)
                .input('OptionD', sql.VarChar, q.options.D)
                .input('CorrectAnswer', sql.VarChar, q.answer)
                .query(`
                    INSERT INTO Questions
                    (ExamID, QuestionText, OptionA, OptionB, OptionC, OptionD, CorrectAnswer)
                    VALUES
                    (@ExamID, @QuestionText, @OptionA, @OptionB, @OptionC, @OptionD, @CorrectAnswer)
                `);
        }

        // Update the exam with the total questions count
        await pool.request()
            .input('ExamID', sql.Int, examId)
            .input('TotalQuestions', sql.Int, totalQuestions)
            .query(`
                UPDATE Exams SET TotalQuestions=@TotalQuestions WHERE ExamID=@ExamID
            `);

        res.json({ success: true, examId: examId });
    } catch (err) {
        console.error(err);
        res.status(500).send('Failed to create exam');
    }
});




app.post('/api/addQuestionsToExam', async (req, res) => {
    const { examId, questions } = req.body;
    try {
        const pool = await connectDb();
        for (const q of questions) {
            await pool.request()
                .input('ExamID', sql.Int, examId)
                .input('QuestionText', sql.NVarChar, q.questionText)
                .input('OptionA', sql.VarChar, q.optionA)
                .input('OptionB', sql.VarChar, q.optionB)
                .input('OptionC', sql.VarChar, q.optionC)
                .input('OptionD', sql.VarChar, q.optionD)
                .input('CorrectAnswer', sql.VarChar, q.correctAnswer)
                .query(`
                    INSERT INTO Questions
                    (ExamID,QuestionText,OptionA,OptionB,OptionC,OptionD,CorrectAnswer)
                    VALUES
                    (@ExamID,@QuestionText,@OptionA,@OptionB,@OptionC,@OptionD,@CorrectAnswer)
                `);
        }

        await pool.request()
            .input('ExamID', sql.Int, examId)
            .input('TotalQuestions', sql.Int, questions.length)
            .query(`UPDATE Exams SET TotalQuestions=@TotalQuestions WHERE ExamID=@ExamID`);

        res.json({ success: true });
    } catch {
        res.status(500).send("Add questions failed");
    }
});

app.post('/api/publishExam', async (req, res) => {
    const { examId } = req.body;
    try {
        const pool = await connectDb();
        await pool.request()
            .input('ExamID', sql.Int, examId)
            .query(`UPDATE Exams SET IsPublished=1 WHERE ExamID=@ExamID`);
        res.json({ success: true });
    } catch {
        res.status(500).send("Publish failed");
    }
});

app.get('/api/teacherExams/:teacherId', async (req, res) => {
    try {
        const pool = await connectDb();
        const result = await pool.request()
            .input('TeacherID', sql.Int, req.params.teacherId)
            .query('SELECT * FROM Exams WHERE TeacherID=@TeacherID ORDER BY ExamID DESC');
        res.json(result.recordset);
    } catch {
        res.status(500).send("Fetch teacher exams failed");
    }
});

app.get('/api/publishedExams', async (req, res) => {
    try {
        const pool = await connectDb();
        const result = await pool.request()
            .query('SELECT * FROM Exams WHERE IsPublished=1 ORDER BY ExamID DESC');
        res.json(result.recordset);
    } catch {
        res.status(500).send("Fetch published exams failed");
    }
});

/* ================= AI ================= */
// AI Generation Section
app.post('/api/generateQuestions', async (req, res) => {
    const { topic, count, difficulty } = req.body;

    const prompt = `
    Create ${count} multiple-choice questions on "${topic}"
    Difficulty: ${difficulty || 'Medium'}
    Return a JSON array with question text, options (A, B, C, D), and correct answer.
    `;

    const cleanAndParse = (text) => {
        try {
            text = text.replace(/```json|```/g, "").trim();
            const start = text.indexOf('[');
            const end = text.lastIndexOf(']');
            if (start !== -1 && end !== -1) {
                return JSON.parse(text.slice(start, end + 1));
            }
            throw new Error("Invalid JSON");
        } catch (error) {
            throw new Error("Error parsing the AI response: " + error.message);
        }
    };

    try {
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);

        const questions = cleanAndParse(result.response.text());

        // Fixing the answer assignment logic
        questions.forEach((q) => {
            if (!['A', 'B', 'C', 'D'].includes(q.answer)) {
                q.answer = 'A'; // Default to 'A' if the correct answer is invalid
            }
        });

        // Log the questions to check if the answer is set correctly
        console.log("Generated Questions:", questions);

        // Ensure we return the correct format with the correct answer
        if (Array.isArray(questions) && questions.length > 0) {
            res.json(questions);
        } else {
            res.status(400).send("Invalid AI response format.");
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send("AI generation failed");
    }
});



/* ================= SERVER ================= */

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});