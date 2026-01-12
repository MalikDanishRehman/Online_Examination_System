import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './../App.css'; // Styling use karne ke liye

const CreateExamManual = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [examId, setExamId] = useState(null);
    
    // Header Details
    const [examDetails, setExamDetails] = useState({
        title: '', subject: '', passingMarks: 40
    });

    // Question Details
    const [currentQ, setCurrentQ] = useState({
        questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A'
    });
    const [questionsList, setQuestionsList] = useState([]);

    // Step 1: Create Exam Header
    const handleCreateExam = async () => {
        const user = JSON.parse(localStorage.getItem('user'));
        try {
            const res = await axios.post('http://localhost:5000/api/createExam', {
                ...examDetails,
                teacherId: user.UserID // Fixed: Using UserID
            });
            if (res.data.success) {
                setExamId(res.data.examId);
                setStep(2); // Move to add questions
            }
        } catch (err) { alert("Error creating exam"); }
    };

    // Step 2: Add Question to List
    const handleAddQuestion = () => {
        setQuestionsList([...questionsList, currentQ]);
        setCurrentQ({ questionText: '', optionA: '', optionB: '', optionC: '', optionD: '', correctAnswer: 'A' });
    };

    // Step 3: Save All to DB
    const handleFinalSubmit = async () => {
        try {
            await axios.post('http://localhost:5000/api/addQuestionsToExam', {
                examId: examId,
                questions: questionsList
            });
            await axios.post('http://localhost:5000/api/publishExam', { examId });
            alert("Exam Created Successfully!");
            navigate('/teacher');
        } catch (err) { alert("Error saving questions"); }
    };

    return (
        <div className="dashboard-container" style={{justifyContent:'center', alignItems:'center'}}>
            <div className="card" style={{width: '600px', padding: '40px'}}>
                <h2>📝 Create Manual Exam</h2>
                
                {step === 1 ? (
                    <div style={{display:'flex', flexDirection:'column', gap:'15px'}}>
                        <input placeholder="Exam Title" className="input-field" 
                            onChange={(e) => setExamDetails({...examDetails, title: e.target.value})} />
                        <input placeholder="Subject" className="input-field" 
                            onChange={(e) => setExamDetails({...examDetails, subject: e.target.value})} />
                        <input placeholder="Passing Marks" type="number" className="input-field" 
                            onChange={(e) => setExamDetails({...examDetails, passingMarks: e.target.value})} />
                        
                        <button className="create-btn" onClick={handleCreateExam}>Next: Add Questions</button>
                    </div>
                ) : (
                    <div style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                        <h4>Question {questionsList.length + 1}</h4>
                        <textarea placeholder="Question Text" className="input-field" value={currentQ.questionText}
                            onChange={(e) => setCurrentQ({...currentQ, questionText: e.target.value})} />
                        
                        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px'}}>
                            <input placeholder="Option A" className="input-field" value={currentQ.optionA} onChange={(e)=>setCurrentQ({...currentQ, optionA: e.target.value})} />
                            <input placeholder="Option B" className="input-field" value={currentQ.optionB} onChange={(e)=>setCurrentQ({...currentQ, optionB: e.target.value})} />
                            <input placeholder="Option C" className="input-field" value={currentQ.optionC} onChange={(e)=>setCurrentQ({...currentQ, optionC: e.target.value})} />
                            <input placeholder="Option D" className="input-field" value={currentQ.optionD} onChange={(e)=>setCurrentQ({...currentQ, optionD: e.target.value})} />
                        </div>

                        <label>Correct Answer: 
                            <select value={currentQ.correctAnswer} onChange={(e)=>setCurrentQ({...currentQ, correctAnswer: e.target.value})}>
                                <option value="A">A</option>
                                <option value="B">B</option>
                                <option value="C">C</option>
                                <option value="D">D</option>
                            </select>
                        </label>

                        <button className="sm-btn" onClick={handleAddQuestion}>Add Question</button>
                        <hr />
                        <div style={{marginTop: '20px'}}>
                            <p>Total Questions Added: {questionsList.length}</p>
                            <button className="create-btn" onClick={handleFinalSubmit}>Finish & Publish Exam</button>
                        </div>
                    </div>
                )}
            </div>
             {/* Temporary Inline CSS for inputs */}
             <style>{`
                .input-field { padding: 10px; border: 1px solid #ddd; border-radius: 5px; width: 100%; box-sizing: border-box; }
                .sm-btn { background: #64748b; color: white; padding: 8px; border:none; border-radius: 4px; cursor: pointer;}
            `}</style>
        </div>
    );
};

export default CreateExamManual;