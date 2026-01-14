import React, { useState } from 'react';
import api from '../api/api';
import { dbg } from '../utils/debugger';
import { useNavigate } from 'react-router-dom';

const CreateExamManual = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();

  const [exam, setExam] = useState({
    title: '',
    description: '',
    isPublic: true,
    totalQuestions: 0
  });

  const [questions, setQuestions] = useState([]);
  const [q, setQ] = useState({
    question_text: '',
    option_a: '',
    option_b: '',
    option_c: '',
    option_d: '',
    correct_option: 'A'
  });

  const addQuestion = () => {
    setQuestions([...questions, q]);
    setQ({
      question_text: '',
      option_a: '',
      option_b: '',
      option_c: '',
      option_d: '',
      correct_option: 'A'
    });
  };

  const submit = async () => {
    const res = await api.post('/exam', {
      ...exam,
      examinerId: user.user_id
    });

    const examId = res.data.examId;

    await api.post(`/exam/${examId}/questions`, { questions });

    dbg.log('Manual exam created');
    navigate('/examiner');
  };

  return (
    <div>
      <h2>Create Exam (Manual)</h2>

      <input placeholder="Title"
        onChange={e => setExam({ ...exam, title: e.target.value })} />

      <textarea placeholder="Description"
        onChange={e => setExam({ ...exam, description: e.target.value })} />

      <label>
        Public:
        <input type="checkbox" checked={exam.isPublic}
          onChange={e => setExam({ ...exam, isPublic: e.target.checked })} />
      </label>

      <h3>Add Question</h3>
      <textarea placeholder="Question"
        value={q.question_text}
        onChange={e => setQ({ ...q, question_text: e.target.value })} />

      {['a','b','c','d'].map(opt => (
        <input key={opt} placeholder={`Option ${opt.toUpperCase()}`}
          value={q[`option_${opt}`]}
          onChange={e => setQ({ ...q, [`option_${opt}`]: e.target.value })} />
      ))}

      <select
        value={q.correct_option}
        onChange={e => setQ({ ...q, correct_option: e.target.value })}
      >
        <option>A</option><option>B</option><option>C</option><option>D</option>
      </select>

      <button onClick={addQuestion}>Add Question</button>
      <button onClick={submit}>Save Exam</button>
    </div>
  );
};

export default CreateExamManual;
