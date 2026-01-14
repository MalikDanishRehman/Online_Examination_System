import React, { useEffect, useState } from 'react';
import api from '../api/api';

const AttemptHistory = () => {
  const [attempts, setAttempts] = useState([]);

  useEffect(() => {
    api.get('/examinee/attempts').then(res => setAttempts(res.data));
  }, []);

  const requestDelete = id => {
    api.post('/examinee/request-delete', { attemptId: id, reason: 'Student request' });
  };

  return (
    <ul>
      {attempts.map(a => (
        <li key={a.attempt_id}>
          {a.score}
          <button onClick={() => requestDelete(a.attempt_id)}>Request Delete</button>
        </li>
      ))}
    </ul>
  );
};

export default AttemptHistory;
