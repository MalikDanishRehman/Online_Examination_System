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
    total_questions INT NOT NULL,
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_exam_creator FOREIGN KEY (created_by)
        REFERENCES users(user_id)
);
GO

/* =========================================================
   QUESTIONS
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
   EXAM VISIBILITY
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
   ATTEMPTS
   ========================================================= */
CREATE TABLE attempts (
    attempt_id INT IDENTITY PRIMARY KEY,
    exam_id INT NOT NULL,
    examinee_id INT NOT NULL,
    score INT,
    attempted_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_attempt_exam FOREIGN KEY (exam_id)
        REFERENCES exams(exam_id) ON DELETE CASCADE,
    CONSTRAINT FK_attempt_user FOREIGN KEY (examinee_id)
        REFERENCES users(user_id)
);
GO

/* =========================================================
   ATTEMPT ANSWERS
   ========================================================= */
CREATE TABLE attempt_answers (
    answer_id INT IDENTITY PRIMARY KEY,
    attempt_id INT NOT NULL,
    question_id INT NOT NULL,
    selected_option CHAR(1),
    is_correct BIT,
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
CREATE INDEX IDX_exams_creator ON exams(created_by);
CREATE INDEX IDX_attempts_exam ON attempts(exam_id);
CREATE INDEX IDX_attempts_user ON attempts(examinee_id);
GO

/* =========================================================
   SEED USERS
   ========================================================= */
INSERT INTO users (name, email, password_hash, role)
VALUES
('admin','admin','@dm3z','admin'),
('examiner','ex','ex','examiner'),
('examinee1','ee1','ee1','examinee'),
('examinee2','ee2','ee2','examinee');
GO

/* =========================================================
   SEED EXAMS
   ========================================================= */
INSERT INTO exams (title, description, created_by, is_public, total_questions)
VALUES
('SQL Basics','Intro to SQL',2,1,3),
('Web Development','HTML CSS JS',2,0,3),
('Data Structures','DS Basics',2,1,3);
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
   EXAM VISIBILITY
   ========================================================= */
INSERT INTO exam_visibility (exam_id, examinee_id)
VALUES (2,4);
GO

/* =========================================================
   ATTEMPTS + ANSWERS (IDENTITY SAFE)
   ========================================================= */
DECLARE @a1 INT, @a2 INT, @a3 INT;

INSERT INTO attempts (exam_id, examinee_id, score)
VALUES (1,4,3);
SET @a1 = SCOPE_IDENTITY();

INSERT INTO attempts (exam_id, examinee_id, score)
VALUES (1,3,2);
SET @a2 = SCOPE_IDENTITY();

INSERT INTO attempts (exam_id, examinee_id, score)
VALUES (2,4,3);
SET @a3 = SCOPE_IDENTITY();

INSERT INTO attempt_answers VALUES
(@a1,1,'A',1),(@a1,2,'C',1),(@a1,3,'B',1),
(@a2,1,'A',1),(@a2,2,'B',0),(@a2,3,'B',1),
(@a3,4,'A',1),(@a3,5,'B',1),(@a3,6,'C',1);
GO

/* =========================================================
   ATTEMPT DELETION REQUESTS
   ========================================================= */
INSERT INTO attempt_deletion_requests
(attempt_id, requested_by, request_reason, status, reviewed_by, reviewed_at)
VALUES
(@a2,3,'Accidental submission','pending',NULL,NULL),
(@a3,4,'Wrong device','approved',1,GETDATE());
GO

/* =========================================================
   VIEWS
   ========================================================= */
CREATE VIEW vw_exam_results AS
SELECT a.attempt_id, e.title, u.name, a.score, a.attempted_at
FROM attempts a
JOIN exams e ON a.exam_id = e.exam_id
JOIN users u ON a.examinee_id = u.user_id;
GO

CREATE VIEW vw_student_attempts AS
SELECT a.attempt_id, e.title, a.score, a.attempted_at
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
    UPDATE attempts SET score = @new_score
    WHERE attempt_id = @attempt_id;
END;
GO
