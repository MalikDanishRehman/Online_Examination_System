// backend/server.js
const { GoogleGenerativeAI } = require("@google/generative-ai"); 
const express = require('express');
const sql = require('mssql/msnodesqlv8'); 
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// --- DATABASE CONFIGURATION ---
const dbConfig = {
    connectionString: 'Driver={ODBC Driver 17 for SQL Server};Server=DESKTOP-CT4MT8O\\SQLEXPRESS01;Database=ExamSystemDB;Trusted_Connection=yes;TrustServerCertificate=yes;'
};

// --- AI CONFIGURATION (API KEY) ---
const genAI = new GoogleGenerativeAI("AIzaSyC3y2OwxenI83eJgefRa9kApN6We4yyWLc"); 


// ================= API ROUTES =================

// 1. LOGIN API
app.post('/api/login', async (req, res) => {
    const { rollNo, password } = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('RollNo', sql.VarChar, rollNo)
            .input('Password', sql.VarChar, password)
            .query('SELECT * FROM Users WHERE RollNo = @RollNo AND Password = @Password');

        if (result.recordset.length > 0) {
            res.json({ success: true, message: "Login Successful", user: result.recordset[0] });
        } else {
            res.json({ success: false, message: "Invalid Credentials" });
        }
    } catch (err) {
        console.log(err);
        res.status(500).send("Server Error");
    }
});

// 2. ADD USER API
app.post('/api/addUser', async (req, res) => {
    const { fullName, rollNo, password, role } = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        try {
            await pool.request()
                .input('FullName', sql.VarChar, fullName)
                .input('RollNo', sql.VarChar, rollNo)
                .input('Password', sql.VarChar, password)
                .input('Role', sql.VarChar, role)
                .query('INSERT INTO Users (FullName, RollNo, Password, Role) VALUES (@FullName, @RollNo, @Password, @Role)');
                
            res.json({ success: true, message: "User Added Successfully!" });
        } catch (insertError) {
            if(insertError.number === 2627) {
                res.json({ success: false, message: "Ye ID pehle se registered hai!" });
            } else {
                throw insertError;
            }
        }
    } catch (err) {
        console.log(err);
        res.json({ success: false, message: "Error adding user" });
    }
});

// 3. GET QUESTIONS API (Student)
app.get('/api/questions', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query('SELECT * FROM Questions');
        res.json(result.recordset);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error fetching questions");
    }
});

// 4. SAVE EXAM RESULT API
app.post('/api/saveResult', async (req, res) => {
    const { rollNo, score, totalQuestions } = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('RollNo', sql.VarChar, rollNo)
            .input('Score', sql.Int, score)
            .input('Total', sql.Int, totalQuestions)
            .query('INSERT INTO ExamResults (RollNo, Score, TotalQuestions) VALUES (@RollNo, @Score, @Total)');
            
        res.json({ success: true, message: "Result Saved Successfully!" });
    } catch (err) {
        console.log(err);
        res.status(500).json({ success: false, message: "Error saving result" });
    }
});

// 5. GET ALL EXAM RESULTS API (For Admin)
app.get('/api/results', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query('SELECT * FROM ExamResults ORDER BY ExamDate DESC');
        res.json(result.recordset);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error fetching results");
    }
});

// --- TEACHER APIS ---

// 6. CREATE EXAM HEADER
app.post('/api/createExam', async (req, res) => {
    const { title, subject, teacherId, passingMarks } = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('Title', sql.VarChar, title)
            .input('Subject', sql.VarChar, subject)
            .input('TID', sql.Int, teacherId)
            .input('Pass', sql.Int, passingMarks)
            .query(`INSERT INTO Exams (ExamTitle, Subject, TeacherID, PassingMarks, IsPublished) 
                    OUTPUT INSERTED.ExamID
                    VALUES (@Title, @Subject, @TID, @Pass, 0)`);
        
        res.json({ success: true, examId: result.recordset[0].ExamID });
    } catch (err) { console.log(err); res.status(500).send("Error creating exam"); }
});

// 7. ADD QUESTIONS TO EXAM
app.post('/api/addQuestionsToExam', async (req, res) => {
    const { examId, questions } = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        for (const q of questions) {
            await pool.request()
                .input('EID', sql.Int, examId)
                .input('QText', sql.NVarChar, q.questionText)
                .input('OpA', sql.VarChar, q.optionA)
                .input('OpB', sql.VarChar, q.optionB)
                .input('OpC', sql.VarChar, q.optionC)
                .input('OpD', sql.VarChar, q.optionD)
                .input('Correct', sql.VarChar, q.correctAnswer)
                .query(`INSERT INTO Questions (ExamID, QuestionText, OptionA, OptionB, OptionC, OptionD, CorrectAnswer)
                        VALUES (@EID, @QText, @OpA, @OpB, @OpC, @OpD, @Correct)`);
        }
        await pool.request().query(`UPDATE Exams SET TotalQuestions = ${questions.length} WHERE ExamID = ${examId}`);
        res.json({ success: true });
    } catch (err) { console.log(err); res.status(500).send("Error adding questions"); }
});

// 8. PUBLISH EXAM
app.post('/api/publishExam', async (req, res) => {
    const { examId } = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        await pool.request().query(`UPDATE Exams SET IsPublished = 1 WHERE ExamID = ${examId}`);
        res.json({ success: true });
    } catch (err) { res.status(500).send("Error"); }
});

// 9. GET TEACHER EXAMS
app.get('/api/teacherExams/:teacherId', async (req, res) => {
    const { teacherId } = req.params;
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('TID', sql.Int, teacherId)
            .query('SELECT * FROM Exams WHERE TeacherID = @TID ORDER BY ExamID DESC');
        res.json(result.recordset);
    } catch (err) { res.status(500).send("Error"); }
});

// --- ADMIN PANEL NEW APIS (FIXED) ---

// 10. GET ALL USERS (Fixed: used dbConfig instead of config)
app.get('/api/users', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig); // ✅ Fixed here
        const result = await pool.request().query("SELECT * FROM Users");
        res.json(result.recordset);
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// 11. DELETE USER (Fixed: used dbConfig instead of config)
app.delete('/api/deleteUser/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pool = await sql.connect(dbConfig); // ✅ Fixed here
        
        const result = await pool.request()
            .input('id', sql.Int, id)
            .query("DELETE FROM Users WHERE UserID = @id");

        if (result.rowsAffected[0] > 0) {
            res.json({ success: true, message: "User deleted" });
        } else {
            res.json({ success: false, message: "User not found" });
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Server Error");
    }
});

// ================= 🤖 AI MAGIC ROUTE (Model Kept Same) =================

app.post('/api/generateQuestions', async (req, res) => {
    const { topic, count, difficulty } = req.body;
    console.log(`🤖 AI Request: ${count} questions on "${topic}" (${difficulty})`);

    const prompt = `
        Create ${count} multiple-choice questions on the topic "${topic}".
        Difficulty level: ${difficulty || 'Medium'}.
        Format: Strictly return a JSON Array ONLY. 
        Do NOT include markdown formatting (like \`\`\`json).
        
        JSON Structure Example:
        [
            {
                "questionText": "Question?",
                "optionA": "A", "optionB": "B", "optionC": "C", "optionD": "D",
                "correctAnswer": "A" 
            }
        ]
    `;

    // --- Helper Function to Clean and Parse ---
    const cleanAndParse = (text) => {
        text = text.replace(/```json/g, "").replace(/```/g, "").trim();
        const firstBracket = text.indexOf('[');
        const lastBracket = text.lastIndexOf(']');
        if (firstBracket !== -1 && lastBracket !== -1) {
            return JSON.parse(text.substring(firstBracket, lastBracket + 1));
        }
        throw new Error("Invalid JSON structure");
    };

    try {
        // ✅ Using 'gemini-2.5-flash' as requested
        console.log("👉 Attempting with 'gemini-2.5-flash'..."); 
        
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const questions = cleanAndParse(response.text());
        
        console.log("✅ Success with Gemini 2.5 Flash!");
        res.json(questions);

    } catch (err) {
        console.error("❌ AI Failed:", err.message);
        
        res.status(500).json({ 
            error: "AI Generation Failed.",
            details: err.message
        });
    }
});


// Server Start
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});