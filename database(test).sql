/* =========================================
   DATABASE
========================================= */
IF DB_ID('ExamSystemDB') IS NULL
    CREATE DATABASE ExamSystemDB;
GO

USE ExamSystemDB;
GO

/* =========================================
   USERS TABLE
========================================= */
CREATE TABLE dbo.Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    FullName VARCHAR(100),
    RollNo VARCHAR(50) NOT NULL UNIQUE,
    Password VARCHAR(50) NOT NULL,
    Role VARCHAR(20) CHECK (Role IN ('Admin','Teacher','Student'))
);

/* =========================================
   EXAMS TABLE
========================================= */
CREATE TABLE dbo.Exams (
    ExamID INT IDENTITY(1,1) PRIMARY KEY,
    ExamTitle VARCHAR(100),
    Subject VARCHAR(100),
    TeacherID INT,
    TotalQuestions INT,
    PassingMarks INT,
    IsPublished BIT DEFAULT 0
);

/* =========================================
   QUESTIONS TABLE
========================================= */
CREATE TABLE dbo.Questions (
    QID INT IDENTITY(1,1) PRIMARY KEY,
    QuestionText NVARCHAR(MAX),
    OptionA VARCHAR(255),
    OptionB VARCHAR(255),
    OptionC VARCHAR(255),
    OptionD VARCHAR(255),
    CorrectAnswer VARCHAR(10),
    ExamID INT,
    CONSTRAINT FK_Exam FOREIGN KEY (ExamID)
        REFERENCES dbo.Exams (ExamID)
);

/* =========================================
   EXAM RESULTS TABLE
========================================= */
CREATE TABLE dbo.ExamResults (
    ResultID INT IDENTITY(1,1) PRIMARY KEY,
    RollNo VARCHAR(50),
    Score INT,
    TotalQuestions INT,
    ExamDate DATETIME DEFAULT GETDATE(),
    ExamID INT
);

/* =========================================
   SAMPLE USERS
========================================= */
INSERT INTO dbo.Users (FullName, RollNo, Password, Role)
VALUES
('System Admin', 'admin@exam.com', '1234', 'Admin'),
('Sir Zubair', 'teacher01', '1234', 'Teacher'),
('Ali Student', 'student01', '1234', 'Student');

/* =========================================
   SAMPLE EXAM
========================================= */
INSERT INTO dbo.Exams (ExamTitle, Subject, TeacherID, TotalQuestions, PassingMarks, IsPublished)
VALUES
('DBMS Midterm', 'DBMS', 2, 5, 50, 1);

/* =========================================
   SAMPLE QUESTIONS
========================================= */
INSERT INTO dbo.Questions
(QuestionText, OptionA, OptionB, OptionC, OptionD, CorrectAnswer, ExamID)
VALUES
('What does DBMS stand for?', 
 'Database Management System', 
 'Data Backup Main System',
 'Dynamic Base Management',
 'None of these',
 'A',
 1);

/* =========================================
   SAMPLE RESULT
========================================= */
INSERT INTO dbo.ExamResults
(RollNo, Score, TotalQuestions, ExamID)
VALUES
('student01', 1, 1, 1);
