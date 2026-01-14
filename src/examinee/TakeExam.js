import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { useParams } from 'react-router-dom';

const TakeExam = () => {
  const { examId } = useParams();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    api.get(`/exam/${examId}/questions`)
      .then(res => setQuestions(res.data));
  }, [examId]);

  const submit = async () => {
    let score = 0;
    questions.forEach(q => {
      if (answers[q.question_id] === q.correct_option) score++;
    });

    await api.post(`/exam/${examId}/submit`, { score });
    alert(`Score: ${score}`);
  };

  return (
    <div>
      {questions.map(q => (
        <div key={q.question_id}>
          <p>{q.question_text}</p>
          {['A','B','C','D'].map(o => (
            <label key={o}>
              <input type="radio" name={q.question_id}
                     onChange={() => setAnswers({...answers,[q.question_id]:o})}/>
              {q[`option_${o.toLowerCase()}`]}
            </label>
          ))}
        </div>
      ))}
      <button onClick={submit}>Submit</button>
    </div>
  );
};

export default TakeExam;
