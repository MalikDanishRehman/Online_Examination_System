import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import api from "../api/api";
import { dbg } from "../utils/debugger";
import { showPopup } from "../utils/popup";

export default function CreateExam() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [questions, setQuestions] = useState([
    { question: "", options: ["", "", "", ""], answer: 0 },
  ]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { question: "", options: ["", "", "", ""], answer: 0 },
    ]);
  };

  const submit = async () => {
    dbg.log("Creating exam (metadata only)");

    try {
      // 1️⃣ Create exam
      const examRes = await api.post("/examiner/exam", {
        title,
        description,
        isPublic,
        totalQuestions: questions.length,
      });

      const examId = examRes.data.examId;
      dbg.log("Exam created:", examId);

      // 2️⃣ Save questions
      await api.post(`/examiner/exam/${examId}/questions`,
        questions.map(q => ({
          question_text: q.question,
          option_a: q.options[0],
          option_b: q.options[1],
          option_c: q.options[2],
          option_d: q.options[3],
          correct_option: ["A","B","C","D"][q.answer]
        }))
      );

      showPopup({
        type: "topright",
        title: "Exam Created",
        message: "Manual exam created successfully.",
      });

      navigate("/examiner");
    } catch (err) {
      dbg.log("Manual exam creation failed:", err);
      showPopup({
        type: "topright",
        title: "Exam Creation Failed",
        message: "Check logs for details.",
      });
    }
  };

  return (
    <>
      <Navbar />
      <div className="page">
        <h1>Create Manual Exam</h1>

        <input
          placeholder="Exam title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <label>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          Public Exam
        </label>

        {questions.map((q, qi) => (
          <div key={qi} className="card">
            <input
              placeholder="Question"
              value={q.question}
              onChange={(e) => {
                const copy = [...questions];
                copy[qi].question = e.target.value;
                setQuestions(copy);
              }}
            />

            {q.options.map((opt, oi) => (
              <input
                key={oi}
                placeholder={`Option ${oi + 1}`}
                value={opt}
                onChange={(e) => {
                  const copy = [...questions];
                  copy[qi].options[oi] = e.target.value;
                  setQuestions(copy);
                }}
              />
            ))}
          </div>
        ))}

        <button onClick={addQuestion}>+ Add Question</button>
        <button onClick={submit}>Create Exam</button>
      </div>
    </>
  );
}
