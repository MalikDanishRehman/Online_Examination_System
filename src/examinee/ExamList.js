import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

const ExamList = () => {
  const [exams, setExams] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/examinee/exams').then(res => setExams(res.data));
  }, []);

  return (
    <ul>
      {exams.map(e => (
        <li key={e.exam_id}>
          {e.title}
          <button onClick={() => navigate(`/examinee/exam/${e.exam_id}`)}>
            Start
          </button>
        </li>
      ))}
    </ul>
  );
};

export default ExamList;
