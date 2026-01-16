import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../api/api";
import { showPopup } from "../popup/popup";
import { dbg } from "../utils/debugger";
import "../styles/dashboard.css";

export default function ExaminerDashboard() {
  const [activeTab, setActiveTab] = useState("exams");
  const [exams, setExams] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showExamModal, setShowExamModal] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showAIModal, setShowAIModal] = useState(false);
  const [selectedExam, setSelectedExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [examinees, setExaminees] = useState([]);

  const [examForm, setExamForm] = useState({
    title: "",
    description: "",
    isPublic: true,
  });

  const [questionForm, setQuestionForm] = useState({
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_option: "A",
  });

  const [aiForm, setAIForm] = useState({
    topic: "",
    count: 5,
  });

  useEffect(() => {
    if (activeTab === "exams") {
      fetchExams();
    } else if (activeTab === "results") {
      fetchResults();
    }
  }, [activeTab]);

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await api.get("/examiner/exams");
      setExams(res.data);
      dbg.log("Fetched exams:", res.data);
    } catch (err) {
      dbg.log("Failed to fetch exams:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchResults = async () => {
    setLoading(true);
    try {
      const res = await api.get("/examiner/results");
      setResults(res.data);
      dbg.log("Fetched results:", res.data);
    } catch (err) {
      dbg.log("Failed to fetch results:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExam = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/examiner/exam", examForm);
      showPopup({
        type: "topright",
        title: "Success",
        message: "Exam created successfully",
      });
      setShowExamModal(false);
      setExamForm({ title: "", description: "", isPublic: true });
      fetchExams();
    } catch (err) {
      dbg.log("Failed to create exam:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm("Are you sure you want to delete this exam?")) return;

    setLoading(true);
    try {
      await api.delete(`/examiner/exam/${examId}`);
      showPopup({
        type: "topright",
        title: "Success",
        message: "Exam deleted successfully",
      });
      fetchExams();
    } catch (err) {
      dbg.log("Failed to delete exam:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleManageQuestions = async (exam) => {
    setSelectedExam(exam);
    setLoading(true);
    try {
      const res = await api.get(`/examiner/exam/${exam.exam_id}/questions`);
      setQuestions(res.data);
      setShowQuestionModal(true);
    } catch (err) {
      dbg.log("Failed to fetch questions:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    const updatedQuestions = [...questions, questionForm];
    
    setLoading(true);
    try {
      await api.post(`/examiner/exam/${selectedExam.exam_id}/questions`, updatedQuestions);
      setQuestions(updatedQuestions);
      setQuestionForm({
        question_text: "",
        option_a: "",
        option_b: "",
        option_c: "",
        option_d: "",
        correct_option: "A",
      });
      showPopup({
        type: "topright",
        title: "Success",
        message: "Question added successfully",
      });
    } catch (err) {
      dbg.log("Failed to add question:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuestion = async (index) => {
    const updatedQuestions = questions.filter((_, i) => i !== index);
    
    setLoading(true);
    try {
      await api.post(`/examiner/exam/${selectedExam.exam_id}/questions`, updatedQuestions);
      setQuestions(updatedQuestions);
      showPopup({
        type: "topright",
        title: "Success",
        message: "Question deleted successfully",
      });
    } catch (err) {
      dbg.log("Failed to delete question:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAI = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/ai/generate", aiForm);
      const aiQuestions = res.data.map((q) => ({
        question_text: q.question,
        option_a: q.A,
        option_b: q.B,
        option_c: q.C,
        option_d: q.D,
        correct_option: q.correct,
      }));

      await api.post(`/examiner/exam/${selectedExam.exam_id}/questions`, aiQuestions);
      setQuestions(aiQuestions);
      setShowAIModal(false);
      showPopup({
        type: "topright",
        title: "Success",
        message: `Generated ${aiQuestions.length} questions with AI`,
      });
    } catch (err) {
      dbg.log("Failed to generate AI questions:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <Navbar />

      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <h1 className="dashboard-title">Examiner Dashboard</h1>
          <p className="dashboard-subtitle">
            Create and manage your exams
          </p>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-tabs">
          <button
            className={`tab-button ${activeTab === "exams" ? "active" : ""}`}
            onClick={() => setActiveTab("exams")}
          >
            My Exams
          </button>
          <button
            className={`tab-button ${activeTab === "results" ? "active" : ""}`}
            onClick={() => setActiveTab("results")}
          >
            Results
          </button>
        </div>

        {activeTab === "exams" && (
          <div>
            <div className="section-header">
              <h2 className="section-title">My Exams</h2>
              <button
                className="btn-create"
                onClick={() => setShowExamModal(true)}
              >
                + Create Exam
              </button>
            </div>

            {loading ? (
              <div className="loading-spinner">Loading exams...</div>
            ) : exams.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📝</div>
                <h3>No exams yet</h3>
                <p>Create your first exam to get started</p>
              </div>
            ) : (
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Questions</th>
                      <th>Visibility</th>
                      <th>Created</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exams.map((exam) => (
                      <tr key={exam.exam_id}>
                        <td>{exam.exam_id}</td>
                        <td>{exam.title}</td>
                        <td>{exam.total_questions || 0}</td>
                        <td>
                          {exam.is_public ? (
                            <span className="role-badge examinee">Public</span>
                          ) : (
                            <span className="role-badge examiner">Private</span>
                          )}
                        </td>
                        <td>
                          {new Date(exam.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-edit"
                              onClick={() => handleManageQuestions(exam)}
                            >
                              Questions
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => handleDeleteExam(exam.exam_id)}
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "results" && (
          <div>
            <div className="section-header">
              <h2 className="section-title">Exam Results</h2>
            </div>

            {loading ? (
              <div className="loading-spinner">Loading results...</div>
            ) : results.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <h3>No results yet</h3>
                <p>Results will appear once students take your exams</p>
              </div>
            ) : (
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Attempt ID</th>
                      <th>Exam</th>
                      <th>Student</th>
                      <th>Score</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((result) => (
                      <tr key={result.attempt_id}>
                        <td>{result.attempt_id}</td>
                        <td>{result.title}</td>
                        <td>{result.student_name}</td>
                        <td>
                          <strong>{result.score}</strong>
                        </td>
                        <td>
                          {new Date(result.attempted_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {showExamModal && (
        <div className="modal-overlay" onClick={() => setShowExamModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Create New Exam</h2>
            </div>

            <form onSubmit={handleCreateExam}>
              <div className="form-group">
                <label className="form-label">Exam Title</label>
                <input
                  type="text"
                  className="form-input"
                  value={examForm.title}
                  onChange={(e) =>
                    setExamForm({ ...examForm, title: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-textarea"
                  value={examForm.description}
                  onChange={(e) =>
                    setExamForm({ ...examForm, description: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <div className="form-checkbox-group">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={examForm.isPublic}
                    onChange={(e) =>
                      setExamForm({ ...examForm, isPublic: e.target.checked })
                    }
                  />
                  <label className="form-label">Make exam public</label>
                </div>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowExamModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading ? "Creating..." : "Create Exam"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQuestionModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowQuestionModal(false)}
        >
          <div
            className="modal-content"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "800px" }}
          >
            <div className="modal-header">
              <h2 className="modal-title">
                Manage Questions - {selectedExam?.title}
              </h2>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <button
                className="btn-create"
                onClick={() => setShowAIModal(true)}
                style={{ marginRight: "12px" }}
              >
                🤖 Generate with AI
              </button>
              <span style={{ color: "#9ca3af", fontSize: "14px" }}>
                {questions.length} question(s)
              </span>
            </div>

            {questions.map((q, index) => (
              <div
                key={index}
                style={{
                  background: "#0a0a0a",
                  padding: "16px",
                  borderRadius: "8px",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <strong style={{ color: "#fff" }}>
                    Question {index + 1}
                  </strong>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteQuestion(index)}
                  >
                    Delete
                  </button>
                </div>
                <p style={{ color: "#fff", marginBottom: "8px" }}>
                  {q.question_text}
                </p>
                <div style={{ color: "#9ca3af", fontSize: "14px" }}>
                  <div>A) {q.option_a}</div>
                  <div>B) {q.option_b}</div>
                  <div>C) {q.option_c}</div>
                  <div>D) {q.option_d}</div>
                  <div style={{ marginTop: "8px", color: "#10b981" }}>
                    ✓ Correct: {q.correct_option}
                  </div>
                </div>
              </div>
            ))}

            <form onSubmit={handleAddQuestion}>
              <div className="form-group">
                <label className="form-label">Question Text</label>
                <textarea
                  className="form-textarea"
                  value={questionForm.question_text}
                  onChange={(e) =>
                    setQuestionForm({
                      ...questionForm,
                      question_text: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Option A</label>
                <input
                  type="text"
                  className="form-input"
                  value={questionForm.option_a}
                  onChange={(e) =>
                    setQuestionForm({
                      ...questionForm,
                      option_a: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Option B</label>
                <input
                  type="text"
                  className="form-input"
                  value={questionForm.option_b}
                  onChange={(e) =>
                    setQuestionForm({
                      ...questionForm,
                      option_b: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Option C</label>
                <input
                  type="text"
                  className="form-input"
                  value={questionForm.option_c}
                  onChange={(e) =>
                    setQuestionForm({
                      ...questionForm,
                      option_c: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Option D</label>
                <input
                  type="text"
                  className="form-input"
                  value={questionForm.option_d}
                  onChange={(e) =>
                    setQuestionForm({
                      ...questionForm,
                      option_d: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Correct Answer</label>
                <select
                  className="form-select"
                  value={questionForm.correct_option}
                  onChange={(e) =>
                    setQuestionForm({
                      ...questionForm,
                      correct_option: e.target.value,
                    })
                  }
                  required
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowQuestionModal(false)}
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading ? "Adding..." : "Add Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAIModal && (
        <div className="modal-overlay" onClick={() => setShowAIModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Generate Questions with AI</h2>
            </div>

            <form onSubmit={handleGenerateAI}>
              <div className="form-group">
                <label className="form-label">Topic</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g., JavaScript Basics, World History"
                  value={aiForm.topic}
                  onChange={(e) =>
                    setAIForm({ ...aiForm, topic: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Number of Questions</label>
                <input
                  type="number"
                  className="form-input"
                  min="1"
                  max="20"
                  value={aiForm.count}
                  onChange={(e) =>
                    setAIForm({ ...aiForm, count: parseInt(e.target.value) })
                  }
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowAIModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading ? "Generating..." : "Generate Questions"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}