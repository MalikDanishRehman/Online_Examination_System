import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './../App.css'; 

const StudentExam = () => {
    const navigate = useNavigate();
    const [exams, setExams] = useState([]); // List of available exams
    const [selectedExam, setSelectedExam] = useState(null); // The chosen exam object
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [score, setScore] = useState(null);
    
    const currentUser = JSON.parse(localStorage.getItem('user')); 

    useEffect(() => {
        if (!currentUser) {
            alert("Please Login First!");
            navigate('/');
            return;
        }
        // Fetch available published exams first
        fetchExams();
    }, [currentUser, navigate]);

    const fetchExams = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/publishedExams');
            setExams(res.data);
        } catch (err) {
            console.error("Error fetching exams", err);
        }
    };

    const startExam = async (exam) => {
        try {
            const res = await axios.get(`http://localhost:5000/api/questions/${exam.ExamID}`);
            setQuestions(res.data);
            setSelectedExam(exam);
        } catch (err) {
            alert("Could not load questions for this exam.");
        }
    };

    const handleOptionChange = (qID, selectedOption) => {
        setAnswers({ ...answers, [qID]: selectedOption });
    };

    const handleSubmit = async () => {
        let tempScore = 0;
        questions.forEach(q => {
            if (answers[q.QID] === q.CorrectAnswer) tempScore++;
        });
        setScore(tempScore);

        try {
            await axios.post('http://localhost:5000/api/saveResult', {
                rollNo: currentUser.RollNo,
                score: tempScore,
                totalQuestions: questions.length,
                examId: selectedExam.ExamID // Passing the specific ID
            });
        } catch (error) {
            console.error("Save Error", error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/');
    };

    const resetExam = () => {
        setSelectedExam(null);
        setQuestions([]);
        setAnswers({});
        setScore(null);
        fetchExams();
    };

    return (
        <div className="exam-container">
            <header className="exam-header">
                <div className="logo-section">
                {/* 64x64 Logo integrated here */}
                {/* <img 
                    src="/logo.png" 
                    alt="ExaMe Logo" 
                    className="header-logo-img" 
                /> */}
                <div className="logo-text">
                    <h2>ExaMe <span className="student-badge">Student</span></h2>
                </div>
            </div>
                <div className="user-info">
                    <span>{currentUser?.FullName}</span>
                    <button onClick={handleLogout} className="logout-btn-sm">Logout</button>
                </div>
            </header>

            <main className="exam-content">
                {/* STEP 1: SELECT EXAM */}
                {!selectedExam && (
                    <div className="exam-selection-wrapper fade-in">
                        <h2>Available Exams</h2>
                        <div className="exam-grid">
                            {exams.map(exam => (
                                <div key={exam.ExamID} className="exam-card">
                                    <h3>{exam.ExamTitle}</h3>
                                    <p>Subject: {exam.Subject}</p>
                                    <p>Questions: {exam.TotalQuestions}</p>
                                    <button onClick={() => startExam(exam)} className="start-btn">
                                        Start Exam
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* STEP 2: SHOW RESULT */}
                {selectedExam && score !== null && (
                    <div className="result-card fade-in">
                        <div className="result-icon">🏆</div>
                        <h2>{selectedExam.ExamTitle} - Completed!</h2>
                        <div className="score-box">
                            <span className="score-number">{score}</span>
                            <span className="score-total">/ {questions.length}</span>
                        </div>
                        <button onClick={resetExam} className="retry-btn">
                            Back to Exams
                        </button>
                    </div>
                )}

                {/* STEP 3: SHOW QUESTIONS */}
                {selectedExam && score === null && (
                    <div className="questions-wrapper">
                        <div className="exam-info-bar">
                            <h3>Currently Taking: {selectedExam.ExamTitle}</h3>
                        </div>
                        {questions.length === 0 ? (
                            <p className="loading-text">No questions available for this exam.</p>
                        ) : (
                            questions.map((q, index) => (
                                <div key={q.QID} className="question-card fade-in">
                                    <div className="question-header">
                                        <span className="q-number">Q{index + 1}</span>
                                        <h3 className="q-text">{q.QuestionText}</h3>
                                    </div>
                                    <div className="options-grid">
                                        {['A', 'B', 'C', 'D'].map((opt) => (
                                            <label 
                                                key={opt} 
                                                className={`option-box ${answers[q.QID] === opt ? 'selected' : ''}`}
                                            >
                                                <input
                                                    type="radio"
                                                    name={`question-${q.QID}`}
                                                    value={opt}
                                                    onChange={() => handleOptionChange(q.QID, opt)}
                                                    className="hidden-radio"
                                                />
                                                <span className="opt-letter">{opt}</span>
                                                <span className="opt-text">{q[`Option${opt}`]}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                        {questions.length > 0 && (
                            <button onClick={handleSubmit} className="submit-exam-btn">
                                Submit Final Exam
                            </button>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default StudentExam;