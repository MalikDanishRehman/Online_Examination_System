// src/components/StudentExam.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './../App.css'; // Styles import

const StudentExam = () => {
    const navigate = useNavigate();
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [score, setScore] = useState(null);
    
    const currentUser = JSON.parse(localStorage.getItem('user')); 

    useEffect(() => {
        // 1. Check Login
        if (!currentUser) {
            alert("Please Login First!");
            navigate('/');
            return;
        }

        // 2. Fetch Questions
        axios.get('http://localhost:5000/api/questions')
            .then(res => setQuestions(res.data))
            .catch(err => console.error("Error fetching questions.", err));
            
    }, [currentUser, navigate]);

    const handleOptionChange = (qID, selectedOption) => {
        setAnswers({ ...answers, [qID]: selectedOption });
    };

    const handleSubmit = async () => {
        // Calculate Score
        let tempScore = 0;
        questions.forEach(q => {
            if (answers[q.QID] === q.CorrectAnswer) tempScore++;
        });
        setScore(tempScore);

        // Save to Database
        try {
            await axios.post('http://localhost:5000/api/saveResult', {
                rollNo: currentUser.RollNo,
                score: tempScore,
                totalQuestions: questions.length
            });
        } catch (error) {
            console.error("Save Error", error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/');
    };

    return (
        <div className="exam-container">
            {/* Header */}
            <header className="exam-header">
                <div className="logo">
                    <h2>📝 ExamPortal <span className="student-badge">Student</span></h2>
                </div>
                <div className="user-info">
                    <span>{currentUser?.FullName}</span>
                    <button onClick={handleLogout} className="logout-btn-sm">Logout</button>
                </div>
            </header>

            <main className="exam-content">
                {score !== null ? (
                    // RESULT CARD
                    <div className="result-card fade-in">
                        <div className="result-icon">🏆</div>
                        <h2>Exam Completed!</h2>
                        <p>Your performance summary</p>
                        
                        <div className="score-box">
                            <span className="score-number">{score}</span>
                            <span className="score-total">/ {questions.length}</span>
                        </div>

                        <div className="percentage-bar">
                            <div 
                                className="fill" 
                                style={{width: `${(score/questions.length)*100}%`}}
                            ></div>
                        </div>
                        <p className="percentage-text">
                            {((score/questions.length)*100).toFixed(1)}% Score
                        </p>

                        <button onClick={() => window.location.reload()} className="retry-btn">
                            Retake Exam
                        </button>
                    </div>
                ) : (
                    // QUESTIONS LIST
                    <div className="questions-wrapper">
                        {questions.length === 0 ? (
                            <p className="loading-text">Loading Questions...</p>
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