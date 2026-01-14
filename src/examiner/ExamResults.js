import React, { useEffect, useState } from 'react';
import api from '../api/api';

const ExamResults = ({ examId }) => {
  const [results, setResults] = useState([]);

  useEffect(() => {
    api.get(`/examiner/results/${examId}`)
      .then(res => setResults(res.data));
  }, [examId]);

  return (
    <div>
      <h3>Exam Results</h3>
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

export default ExamResults;
