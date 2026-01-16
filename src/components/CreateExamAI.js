import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CreateExamAI.css';

const CreateExamAI = () => {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5); // Default 5 questions
  const [difficulty, setDifficulty] = useState('Medium'); // Default difficulty
  const [questions, setQuestions] = useState([]);
  const [examTitle, setExamTitle] = useState('');
  const [loading, setLoading] = useState(false); // For loading state
 const navigate = useNavigate();
  const handleGenerateQuestions = async () => {
    setLoading(true); // Show loading message

    try {
      const response = await axios.post('http://localhost:5000/api/generateQuestions', {
        topic,
        count,
        difficulty
      });

      console.log("AI Generated Questions:", response.data); // Log the received data

      if (response.data && response.data.length > 0) {
        setQuestions(response.data);
      } else {
        alert('No questions were generated.');
      }
    } catch (error) {
      console.error("Error generating questions:", error);
      alert('There was an error generating the questions.');
    } finally {
      setLoading(false); // Hide loading message
    }
  };

  // Function to handle editing a question
  const handleEditQuestion = (index, field, value) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index][field] = value;
    setQuestions(updatedQuestions);
  };

  const handleCreateExam = async () => {
    try {
      const examData = {
        title: examTitle || `Exam on ${topic}`, // Default title if not provided
        subject: topic,
        questions: questions
      };console.log("Exam Data:", examData);

      const response = await axios.post('http://localhost:5000/api/createExam', examData);
      if (response.data.success) {
        alert("Exam created successfully!");
        setQuestions([]); // Reset questions after exam creation
        setExamTitle('');
      }
    } catch (error) {
      console.error("Error creating exam:", error);
      alert("There was an error creating the exam.");
    }
  };

  return (
    
    <div className="create-exam-ai">
        {/* Back to Home button */}
      <button 
        onClick={() => navigate('/teacher')} 
        className="back-home-btn"
      >
        Back to Home
      </button>
      <h2>Create Exam (AI Generated)</h2>
      
      <div className="form-group">
        <label>Exam Title:</label>
        <input
          type="text"
          value={examTitle}
          onChange={(e) => setExamTitle(e.target.value)}
          placeholder="Enter exam title"
          className="input-field"
        />
      </div>

      <div className="form-group">
        <label>Topic:</label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter exam topic"
          className="input-field"
        />
      </div>

      <div className="form-group">
        <label>Number of Questions:</label>
        <input
          type="number"
          value={count}
          onChange={(e) => setCount(e.target.value)}
          min="1"
          className="input-field"
        />
      </div>

      <div className="form-group">
        <label>Difficulty:</label>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          className="select-field"
        >
          <option value="Easy">Easy</option>
          <option value="Medium">Medium</option>
          <option value="Hard">Hard</option>
        </select>
      </div>

      <button 
        onClick={handleGenerateQuestions} 
        className="generate-btn"
        disabled={loading}
      >
        {loading ? 'Generating... Please Wait' : 'Generate Questions'}
      </button>

      {loading && <div className="loading-message">Generating questions, please wait...</div>}

      <div>
        <h3>Generated Questions:</h3>
        {questions.length > 0 && (
          <ul>
            {questions.map((q, index) => (
              <li key={index} className="question-item">
                <div className="question-edit">
                  <label>Question {index + 1}:</label>
                  <input
                    type="text"
                    value={q.question}
                    onChange={(e) => handleEditQuestion(index, 'question', e.target.value)}
                    className="input-field"
                  />
                </div>

                <div className="options">
                  <label>Options:</label>
                  {Object.entries(q.options).map(([key, value]) => (
                    <div key={key} className="option-group">
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => handleEditQuestion(index, `options.${key}`, e.target.value)}
                        className="option-field"
                        placeholder={`Option ${key}`}
                      />
                    </div>
                  ))}
                </div>

                <div className="form-group">
                  <label>Correct Answer:</label>
                  <select
                    value={q.answer}
                    onChange={(e) => handleEditQuestion(index, 'answer', e.target.value)}
                    className="select-field"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {questions.length > 0 && (
        <button onClick={handleCreateExam} className="create-exam-btn">
          Create Exam
        </button>
      )}
            
    </div>
  );
};

export default CreateExamAI;
