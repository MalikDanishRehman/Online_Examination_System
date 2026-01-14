import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import api from "../api/api";
import { dbg } from "../utils/debugger";
import { showPopup } from "../utils/popup";

export default function TakeExam() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});

  useEffect(() => {
    dbg.log("TakeExam mounted:", id);
    loadQuestions();
  }, [id]);

  const loadQuestions = async () => {
    try {
      const res = await api.get(`/exam/${id}/questions`);
      setQuestions(res.data);
      dbg.log("Questions loaded:", res.data.length);
    } catch (err) {
      dbg.log("Failed to load questions:", err);
    }
  };

  const submitExam = async () => {
    dbg.log("Submitting exam answers:", answers);

    let score = 0;

    questions.forEach((q, i) => {
      const correctIndex = { A: 0, B: 1, C: 2, D: 3 }[q.correct_option];
      if (answers[i] === correctIndex) score++;
    });

    try {
      await api.post(`/exam/${id}/submit`, { score });

      showPopup({
        type: "modal",
        title: "Exam Result",
        message:
          `Score: ${score}\n` +
          `Total Questions: ${questions.length}`,
      });

      navigate("/examinee");
    } catch (err) {
      dbg.log("Exam submission failed:", err);
    }
  };

  return (
    <>
      <Navbar />
      <div className="page">
        <h1>Exam</h1>

        {questions.map((q, qi) => (
          <div key={q.question_id} className="card">
            <strong>{q.question_text}</strong>

            {["A", "B", "C", "D"].map((opt, oi) => (
              <label key={opt}>
                <input
                  type="radio"
                  name={`q-${qi}`}
                  checked={answers[qi] === oi}
                  onChange={() =>
                    setAnswers({ ...answers, [qi]: oi })
                  }
                />
                {q[`option_${opt.toLowerCase()}`]}
              </label>
            ))}
          </div>
        ))}

        <button onClick={submitExam}>Submit Exam</button>
      </div>
    </>
  );
}
