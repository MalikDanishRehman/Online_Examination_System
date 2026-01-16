import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/api";
import { showPopup } from "../popup/popup";
import { dbg } from "../utils/debugger";
import "../styles/dashboard.css";

export default function TakeExam() {
  const { examId } = useParams();
  const navigate = useNavigate();
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchQuestions();
  }, [examId]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/exam/${examId}/questions`);
      setQuestions(res.data);
      dbg.log("Fetched questions:", res.data);
    } catch (err) {
      dbg.log("Failed to fetch questions:", err);
      showPopup({
        type: "topright",
        title: "Error",
        message: "Failed to load exam questions",
      });
      navigate("/examinee");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, option) => {
    setAnswers({
      ...answers,
      [questionId]: option,
    });
  };

  const handleSubmit = async () => {
    const answersArray = Object.entries(answers).map(([questionId, option]) => ({
      question_id: parseInt(questionId),
      selected_option: option,
    }));

    if (answersArray.length !== questions.length) {
      showPopup({
        type: "topright",
        title: "Incomplete",
        message: "Please answer all questions before submitting",
      });
      return;
    }

    if (!window.confirm("Are you sure you want to submit this exam?")) return;

    setSubmitting(true);
    try {
      const res = await api.post(`/exam/${examId}/submit`, {
        answers: answersArray,
      });
      showPopup({
        type: "topright",
        title: "Success",
        message: `Exam submitted! Your score: ${res.data.score}/${questions.length}`,
      });
      navigate("/examinee");
    } catch (err) {
      dbg.log("Failed to submit exam:", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="dashboard-container">
        <Navbar />
        <div className="loading-spinner">Loading exam...</div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <Navbar />

      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <h1 className="dashboard-title">Take Exam</h1>
          <p className="dashboard-subtitle">
            Answer all questions and submit when ready
          </p>
        </div>
      </div>

      <div className="dashboard-content">
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          {questions.map((question, index) => (
            <div
              key={question.question_id}
              style={{
                background: "#1a1a1a",
                border: "1px solid #333",
                borderRadius: "8px",
                padding: "24px",
                marginBottom: "24px",
              }}
            >
              <h3
                style={{
                  color: "#fff",
                  fontSize: "18px",
                  marginBottom: "16px",
                }}
              >
                Question {index + 1}
              </h3>
              <p
                style={{
                  color: "#fff",
                  fontSize: "16px",
                  marginBottom: "20px",
                  lineHeight: "1.6",
                }}
              >
                {question.question_text}
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {["A", "B", "C", "D"].map((option) => (
                  <label
                    key={option}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      padding: "12px 16px",
                      background:
                        answers[question.question_id] === option
                          ? "rgba(59, 130, 246, 0.2)"
                          : "#0a0a0a",
                      border:
                        answers[question.question_id] === option
                          ? "1px solid #3b82f6"
                          : "1px solid #333",
                      borderRadius: "6px",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    <input
                      type="radio"
                      name={`question-${question.question_id}`}
                      value={option}
                      checked={answers[question.question_id] === option}
                      onChange={() =>
                        handleAnswerChange(question.question_id, option)
                      }
                      style={{ cursor: "pointer" }}
                    />
                    <span style={{ color: "#fff", fontSize: "14px" }}>
                      {option}) {question[`option_${option.toLowerCase()}`]}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div
            style={{
              display: "flex",
              gap: "16px",
              justifyContent: "center",
              marginTop: "32px",
            }}
          >
            <button
              className="btn-cancel"
              onClick={() => navigate("/examinee")}
              style={{ padding: "12px 32px" }}
            >
              Cancel
            </button>
            <button
              className="btn-submit"
              onClick={handleSubmit}
              disabled={submitting}
              style={{ padding: "12px 32px" }}
            >
              {submitting ? "Submitting..." : "Submit Exam"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}