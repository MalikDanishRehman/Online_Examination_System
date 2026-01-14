import React, { useState } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

const CreateExamAI = () => {
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(5);
  const [questions, setQuestions] = useState([]);
  const navigate = useNavigate();

  const generate = async () => {
    const res = await api.post('/ai/generate', { topic, count });
    setQuestions(res.data);
  };

  const save = async () => {
    const exam = await api.post('/examiner/exam', {
      title: `AI Exam: ${topic}`,
      description: 'AI generated',
      isPublic: true,
      totalQuestions: questions.length
    });

    await api.post(`/exam/${exam.data.examId}/questions`, { questions });
    navigate('/examiner');
  };

  return (
    <div>
      <input placeholder="Topic" onChange={e=>setTopic(e.target.value)} />
      <button onClick={generate}>Generate</button>
      {questions.length > 0 && <button onClick={save}>Save Exam</button>}
    </div>
  );
};

export default CreateExamAI;
