import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Navbar from "../components/Navbar";
import api from "../api/api";
import { dbg } from "../utils/debugger";
import { showPopup } from "../utils/popup";

export default function CreateExamAI() {
  const navigate = useNavigate();

  const [topic, setTopic] = useState("");
  const [count, setCount] = useState(5);
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    dbg.log("AI exam creation started", { topic, count, isPublic });
    setLoading(true);

    try {
      // 1️⃣ Create exam metadata
      const examRes = await api.post("/examiner/exam", {
        title: topic,
        description: "AI Generated Exam",
        isPublic,
        totalQuestions: count,
      });

      const examId = examRes.data.examId;
      dbg.log("AI exam created:", examId);

      // 2️⃣ Generate questions via AI
      const aiRes = await api.post("/ai/generate", {
        topic,
        count,
      });

      dbg.log("AI questions received:", aiRes.data.length);

      // 3️⃣ Save questions to DB
      await api.post(`/examiner/exam/${examId}/questions`,
        aiRes.data.map(q => ({
          question_text: q.question,
          option_a: q.options[0],
          option_b: q.options[1],
          option_c: q.options[2],
          option_d: q.options[3],
          correct_option: q.correct // must be A/B/C/D
        }))
      );

      showPopup({
        type: "topright",
        title: "AI Exam Created",
        message: "AI-generated exam created successfully.",
      });

      navigate("/examiner");
    } catch (err) {
      dbg.log("AI exam creation failed:", err);
      showPopup({
        type: "topright",
        title: "AI Exam Failed",
        message: "Check logs for details.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="page">
        <h1>Create AI Exam</h1>

        <input
          placeholder="Topic (e.g. JavaScript)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
        />

        <input
          type="number"
          min="1"
          value={count}
          onChange={(e) => setCount(Number(e.target.value))}
        />

        <label>
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          Public Exam
        </label>

        <button disabled={loading} onClick={submit}>
          {loading ? "Generating..." : "Generate Exam"}
        </button>
      </div>
    </>
  );
}
