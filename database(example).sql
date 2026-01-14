/* =========================================================
   DATABASE CREATION
   ========================================================= */
CREATE DATABASE ExamSystemDB;
GO

USE ExamSystemDB;
GO

/* =========================================================
   USERS TABLE
   ========================================================= */
CREATE TABLE users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(100) NOT NULL,
    email NVARCHAR(150) NOT NULL UNIQUE,
    password_hash NVARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'examiner', 'examinee')) NOT NULL,
    created_at DATETIME DEFAULT GETDATE()
);
GO

/* =========================================================
   EXAMS TABLE
   ========================================================= */
CREATE TABLE exams (
    exam_id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(200) NOT NULL,
    description NVARCHAR(MAX),
    created_by INT NOT NULL,
    is_public BIT DEFAULT 1,
    total_questions INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_exam_creator FOREIGN KEY (created_by)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);
GO

/* =========================================================
   QUESTIONS TABLE
   ========================================================= */
CREATE TABLE questions (
    question_id INT IDENTITY(1,1) PRIMARY KEY,
    exam_id INT NOT NULL,
    question_text NVARCHAR(MAX) NOT NULL,
    option_a NVARCHAR(255) NOT NULL,
    option_b NVARCHAR(255) NOT NULL,
    option_c NVARCHAR(255) NOT NULL,
    option_d NVARCHAR(255) NOT NULL,
    correct_option CHAR(1) CHECK (correct_option IN ('A','B','C','D')),
    CONSTRAINT FK_question_exam FOREIGN KEY (exam_id)
        REFERENCES exams(exam_id)
        ON DELETE CASCADE
);
GO

/* =========================================================
   EXAM VISIBILITY (PRIVATE EXAMS)
   ========================================================= */
CREATE TABLE exam_visibility (
    visibility_id INT IDENTITY(1,1) PRIMARY KEY,
    exam_id INT NOT NULL,
    examinee_id INT NOT NULL,
    CONSTRAINT FK_visibility_exam FOREIGN KEY (exam_id)
        REFERENCES exams(exam_id)
        ON DELETE CASCADE,
    CONSTRAINT FK_visibility_user FOREIGN KEY (examinee_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);
GO

/* =========================================================
   ATTEMPTS TABLE
   ========================================================= */
CREATE TABLE attempts (
    attempt_id INT IDENTITY(1,1) PRIMARY KEY,
    exam_id INT NOT NULL,
    examinee_id INT NOT NULL,
    score INT,
    attempted_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_attempt_exam FOREIGN KEY (exam_id)
        REFERENCES exams(exam_id)
        ON DELETE CASCADE,
    CONSTRAINT FK_attempt_user FOREIGN KEY (examinee_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
);
GO

/* =========================================================
   ATTEMPT ANSWERS
   ========================================================= */
CREATE TABLE attempt_answers (
    answer_id INT IDENTITY(1,1) PRIMARY KEY,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_option CHAR(1),
    is_correct BIT,
    CONSTRAINT FK_answer_attempt FOREIGN KEY (attempt_id)
        REFERENCES attempts(attempt_id)
        ON DELETE CASCADE,
    CONSTRAINT FK_answer_question FOREIGN KEY (question_id)
        REFERENCES questions(question_id)
        ON DELETE CASCADE
);
GO

/* =========================================================
   ATTEMPT DELETION REQUESTS
   ========================================================= */
CREATE TABLE attempt_deletion_requests (
    request_id INT IDENTITY(1,1) PRIMARY KEY,
    attempt_id INT NOT NULL,
    requested_by INT NOT NULL,
    request_reason NVARCHAR(500),
    status VARCHAR(20) DEFAULT 'pending'
        CHECK (status IN ('pending','approved','rejected')),
    requested_at DATETIME DEFAULT GETDATE(),
    reviewed_by INT NULL,
    reviewed_at DATETIME NULL,
    CONSTRAINT FK_request_attempt FOREIGN KEY (attempt_id)
        REFERENCES attempts(attempt_id)
        ON DELETE CASCADE,
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
GO
CREATE INDEX IDX_exams_creator ON exams(created_by);
GO
CREATE INDEX IDX_attempts_exam ON attempts(exam_id);
GO
CREATE INDEX IDX_attempts_user ON attempts(examinee_id);
GO

/* =========================================================
   SEED ADMIN, SEED DUMMIES
   ========================================================= */
INSERT INTO users (name, email, password_hash, role)
VALUES
('admin', 'admin@admin.com', '@dm3z', 'admin'),
('examiner', 'examiner@examiner.com', 'examiner', 'examiner'),
('examinee', 'examinee@examinee.com', 'examinee', 'examinee');
GO

/* =========================================================
   VIEWS
   ========================================================= */

CREATE VIEW vw_exam_results
AS
SELECT
    a.attempt_id,
    e.title AS exam_title,
    u.name AS student_name,
    a.score,
    a.attempted_at
FROM attempts a
JOIN exams e ON a.exam_id = e.exam_id
JOIN users u ON a.examinee_id = u.user_id;
GO

CREATE VIEW vw_student_attempts
AS
SELECT
    a.attempt_id,
    e.title,
    a.score,
    a.attempted_at
FROM attempts a
JOIN exams e ON a.exam_id = e.exam_id;
GO

/* =========================================================
   STORED PROCEDURES
   ========================================================= */

CREATE PROCEDURE sp_delete_attempt
    @attempt_id INT
AS
BEGIN
    DELETE FROM attempts WHERE attempt_id = @attempt_id;
END;
GO

CREATE PROCEDURE sp_update_attempt_score
    @attempt_id INT,
    @new_score INT
AS
BEGIN
    UPDATE attempts
    SET score = @new_score
    WHERE attempt_id = @attempt_id;
END;
GO
