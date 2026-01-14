import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

const ExaminerDashboard = () => {
  const [results, setResults] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/examiner/results').then(res => setResults(res.data));
  }, []);

  return (
    <div>
      <h2>Examiner Dashboard</h2>

      <button onClick={() => navigate('/examiner/create-manual')}>
        Create Manual Exam
      </button>
      <button onClick={() => navigate('/examiner/create-ai')}>
        Create AI Exam
      </button>

      <h3>Results</h3>
      <ul>
        {results.map(r => (
          <li key={r.attempt_id}>
            {r.student_name} — {r.score}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ExaminerDashboard;
