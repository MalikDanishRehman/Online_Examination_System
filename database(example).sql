/* =========================================================
   RESET DATABASE (SAFE)
   ========================================================= */
IF DB_ID('ExamSystemDB') IS NOT NULL
BEGIN
    ALTER DATABASE ExamSystemDB SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
    DROP DATABASE ExamSystemDB;
END
GO

CREATE DATABASE ExamSystemDB;
GO

USE ExamSystemDB;
GO

/* =========================================================
   USERS
   ========================================================= */
CREATE TABLE users (
    user_id INT IDENTITY PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    email NVARCHAR(150) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin','examiner','examinee')) NOT NULL,
    created_at DATETIME DEFAULT GETDATE()
);
GO

/* =========================================================
   EXAMS
   ========================================================= */
CREATE TABLE exams (
    exam_id INT IDENTITY PRIMARY KEY,
    title NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX),
    created_by INT NOT NULL,
    is_public BIT DEFAULT 1,
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_exam_creator FOREIGN KEY (created_by)
        REFERENCES users(user_id)
);
GO

/* =========================================================
   QUESTIONS (ANSWER KEY LIVES HERE)
   ========================================================= */
CREATE TABLE questions (
    question_id INT IDENTITY PRIMARY KEY,
    exam_id INT NOT NULL,
    question_text NVARCHAR(MAX) NOT NULL,
    option_a NVARCHAR(255) NOT NULL,
    option_b NVARCHAR(255) NOT NULL,
    option_c NVARCHAR(255) NOT NULL,
    option_d NVARCHAR(255) NOT NULL,
    correct_option CHAR(1) CHECK (correct_option IN ('A','B','C','D')),
    CONSTRAINT FK_question_exam FOREIGN KEY (exam_id)
        REFERENCES exams(exam_id) ON DELETE CASCADE
);
GO

/* =========================================================
   EXAM VISIBILITY (PRIVATE EXAMS)
   ========================================================= */
CREATE TABLE exam_visibility (
    visibility_id INT IDENTITY PRIMARY KEY,
    exam_id INT NOT NULL,
    examinee_id INT NOT NULL,
    CONSTRAINT FK_visibility_exam FOREIGN KEY (exam_id)
        REFERENCES exams(exam_id) ON DELETE CASCADE,
    CONSTRAINT FK_visibility_user FOREIGN KEY (examinee_id)
        REFERENCES users(user_id)
);
GO

/* =========================================================
   ATTEMPTS (NO SCORE STORED)
   ========================================================= */
CREATE TABLE attempts (
    attempt_id INT IDENTITY PRIMARY KEY,
    exam_id INT NOT NULL,
    examinee_id INT NOT NULL,
    attempted_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_attempt_exam FOREIGN KEY (exam_id)
        REFERENCES exams(exam_id) ON DELETE CASCADE,
    CONSTRAINT FK_attempt_user FOREIGN KEY (examinee_id)
        REFERENCES users(user_id)
);
GO

/* =========================================================
   ATTEMPT ANSWERS (STUDENT CHOICE ONLY)
   ========================================================= */
CREATE TABLE attempt_answers (
    answer_id INT IDENTITY PRIMARY KEY,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_option CHAR(1),
    CONSTRAINT FK_answer_attempt FOREIGN KEY (attempt_id)
        REFERENCES attempts(attempt_id) ON DELETE CASCADE,
    CONSTRAINT FK_answer_question FOREIGN KEY (question_id)
        REFERENCES questions(question_id)
);
GO

/* =========================================================
   ATTEMPT DELETION REQUESTS
   ========================================================= */
CREATE TABLE attempt_deletion_requests (
    request_id INT IDENTITY PRIMARY KEY,
    attempt_id INT NOT NULL,
    requested_by INT NOT NULL,
    request_reason NVARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending','approved','rejected')),
    requested_at DATETIME DEFAULT GETDATE(),
    reviewed_by INT NULL,
    reviewed_at DATETIME NULL,
    CONSTRAINT FK_request_attempt FOREIGN KEY (attempt_id)
        REFERENCES attempts(attempt_id) ON DELETE CASCADE,
    CONSTRAINT FK_request_user FOREIGN KEY (requested_by)
        REFERENCES users(user_id),
    CONSTRAINT FK_reviewed_by FOREIGN KEY (reviewed_by)
        REFERENCES users(user_id)
);
GO

/* =========================================================
   INDEXES
   ========================================================= */
CREATE INDEX IDX_users_role ON users(role);
CREATE INDEX IDX_attempts_exam ON attempts(exam_id);
CREATE INDEX IDX_attempts_user ON attempts(examinee_id);
CREATE INDEX IDX_answers_attempt ON attempt_answers(attempt_id);
GO

/* =========================================================
   SEED USERS
   ========================================================= */
INSERT INTO users (name,email,password_hash,role)
VALUES
('admin','admin','@dm3z','admin'),
('examiner','ex','ex','examiner'),
('examinee1','ee1','ee1','examinee'),
('examinee2','ee2','ee2','examinee');
GO

/* =========================================================
   SEED EXAMS
   ========================================================= */
INSERT INTO exams (title,description,created_by,is_public)
VALUES
('SQL Basics','Intro to SQL',2,1),
('Web Development','HTML CSS JS',2,0),
('Data Structures','DS Basics',2,1);
GO

/* =========================================================
   SEED QUESTIONS
   ========================================================= */
INSERT INTO questions VALUES
(1,'SQL stands for?','Structured Query Language','Simple Query','System Query','None','A'),
(1,'Retrieve data?','INSERT','DELETE','SELECT','UPDATE','C'),
(1,'Primary key?','Index','Primary Key','Foreign','None','B'),

(2,'HTML full form?','HyperText Markup Language','HighText','None','Other','A'),
(2,'CSS used for?','Logic','Styling','DB','API','B'),
(2,'JS framework?','Laravel','Django','React','Flask','C'),

(3,'Stack follows?','FIFO','LIFO','LILO','FILO','B'),
(3,'Uses nodes?','Array','Stack','Linked List','Queue','C'),
(3,'Binary search needs?','Any','Sorted','Unsorted','Graph','B');
GO

/* =========================================================
   SEED ATTEMPTS + ANSWERS
   ========================================================= */
DECLARE @a1 INT, @a2 INT;

INSERT INTO attempts (exam_id,examinee_id) VALUES (1,4);
SET @a1 = SCOPE_IDENTITY();

INSERT INTO attempts (exam_id,examinee_id) VALUES (1,3);
SET @a2 = SCOPE_IDENTITY();

INSERT INTO attempt_answers VALUES
(@a1,1,'A'),(@a1,2,'C'),(@a1,3,'B'),
(@a2,1,'A'),(@a2,2,'B'),(@a2,3,'B');
GO

/* =========================================================
   VIEWS – MAGIC HAPPENS HERE
   ========================================================= */

-- Per-question correctness (REAL-TIME)
CREATE VIEW vw_attempt_answers_detailed AS
SELECT
    aa.attempt_id,
    aa.question_id,
    aa.selected_option,
    q.correct_option,
    CASE WHEN aa.selected_option = q.correct_option THEN 1 ELSE 0 END AS is_correct
FROM attempt_answers aa
JOIN questions q ON aa.question_id = q.question_id;
GO

-- Final score per attempt (AUTO-UPDATED)
CREATE VIEW vw_attempt_scores AS
SELECT
    a.attempt_id,
    a.exam_id,
    a.examinee_id,
    COUNT(v.is_correct) AS total_questions,
    SUM(v.is_correct) AS score,
    a.attempted_at
FROM attempts a
JOIN vw_attempt_answers_detailed v ON a.attempt_id = v.attempt_id
GROUP BY a.attempt_id,a.exam_id,a.examinee_id,a.attempted_at;
GO
