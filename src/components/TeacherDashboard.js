// src/components/TeacherDashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const TeacherDashboard = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [exams, setExams] = useState([]);
    const [results, setResults] = useState([]); // Results store karne ke liye
    const [activeTab, setActiveTab] = useState('dashboard'); 
    const [showCreateOptions, setShowCreateOptions] = useState(false);

    // --- 1. Load User & Fetch Data ---
    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            const userData = JSON.parse(storedUser);
            setUser(userData);
            
            // ✅ FIX: UserID use kar rahe hain (Console data ke mutabiq)
            if (userData.UserID) {
                fetchExams(userData.UserID);
            }
        } else {
            navigate('/'); 
        }
    }, []);

    // Tab change hone par agar Results wala tab hai to data laye
    useEffect(() => {
        if (activeTab === 'results') {
            fetchResults();
        }
    }, [activeTab]);

    const fetchExams = async (teacherId) => {
        try {
            const response = await axios.get(`http://localhost:5000/api/teacherExams/${teacherId}`);
            setExams(response.data);
        } catch (error) {
            console.error("Error fetching exams:", error);
        }
    };

    const fetchResults = async () => {
        try {
            const response = await axios.get('http://localhost:5000/api/results');
            setResults(response.data);
        } catch (error) {
            console.error("Error fetching results:", error);
        }
    };

    // --- 2. Handlers ---
    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/');
    };

    return (
        <div className="dashboard-container">
            {/* --- SIDEBAR --- */}
            <aside className="sidebar">
                <div className="logo-section">
                    <h2>🎓 ExamPortal</h2>
                    <p className="welcome-text">Welcome, {user?.FullName}</p>
                </div>
                
                <nav className="nav-links">
                    <button 
                        className={activeTab === 'dashboard' ? 'active' : ''} 
                        onClick={() => setActiveTab('dashboard')}
                    >
                        📊 Dashboard
                    </button>
                    <button 
                        className={activeTab === 'results' ? 'active' : ''} 
                        onClick={() => setActiveTab('results')}
                    >
                        🏆 View Results
                    </button>
                </nav>

                <button className="logout-btn" onClick={handleLogout}>LOGOUT</button>
            </aside>

            {/* --- MAIN CONTENT --- */}
            <main className="main-content">
                
                {/* Header */}
                <header className="top-bar">
                    <h1>{activeTab === 'dashboard' ? 'Dashboard Overview' : 'Student Performance'}</h1>
                    {activeTab === 'dashboard' && (
                        <div className="action-buttons">
                            <button 
                                className="create-btn" 
                                onClick={() => setShowCreateOptions(!showCreateOptions)}
                            >
                                + Create New Exam
                            </button>
                            
                            {showCreateOptions && (
                                <div className="dropdown-menu">
                                    <div className="dropdown-item" onClick={() => navigate('/create-exam-ai')}>
                                        🤖 Create with AI
                                    </div>
                                    <div className="dropdown-item" onClick={() => navigate('/create-exam-manual')}>
                                        📝 Create Manually
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </header>

                {/* Content Area */}
                <div className="content-area">
                    {activeTab === 'dashboard' ? (
                        <>
                          
                            {/* Exams Table */}
                            <div className="card table-card">
                                <h3>Your Created Exams</h3>
                                {exams.length === 0 ? (
                                    <div className="empty-state">
                                        <p>No exams found. Create your first exam!</p>
                                    </div>
                                ) : (
                                    <table className="modern-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Title</th>
                                                <th>Subject</th>
                                                <th>Questions</th>
                                                <th>Action</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {exams.map((exam) => (
                                                <tr key={exam.ExamID}>
                                                    <td>#{exam.ExamID}</td>
                                                    <td>{exam.ExamTitle}</td>
                                                    <td>{exam.Subject}</td>
                                                    <td>{exam.TotalQuestions}</td>
                                                    <td>
                                                        --
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </>
                    ) : (
                        // ✅ RESULTS TAB AB DATA DIKHAYEGA
                        <div className="card table-card">
                            <h3>All Student Results</h3>
                            {results.length === 0 ? (
                                <p style={{padding: '20px', color: '#666'}}>No results declared yet.</p>
                            ) : (
                                <table className="modern-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Student Roll No</th>
                                            <th>Score</th>
                                            <th>Total</th>
                                            <th>Percentage</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.map((res, index) => (
                                            <tr key={index}>
                                                <td>{new Date(res.ExamDate).toLocaleDateString()}</td>
                                                <td>{res.RollNo}</td>
                                                <td style={{fontWeight:'bold', color: '#2563eb'}}>{res.Score}</td>
                                                <td>{res.TotalQuestions}</td>
                                                <td>
                                                    {((res.Score / res.TotalQuestions) * 100).toFixed(1)}%
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default TeacherDashboard;