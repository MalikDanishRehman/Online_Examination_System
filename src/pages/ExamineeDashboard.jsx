import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/api";
import { showPopup } from "../popup/popup";
import { dbg } from "../utils/debugger";
import "../styles/dashboard.css";

export default function ExamineeDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("available");
  const [availableExams, setAvailableExams] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showDeletionModal, setShowDeletionModal] = useState(false);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [deletionReason, setDeletionReason] = useState("");

  useEffect(() => {
    if (activeTab === "available") {
      fetchAvailableExams();
    } else if (activeTab === "attempts") {
      fetchAttempts();
    }
  }, [activeTab]);

  const fetchAvailableExams = async () => {
    setLoading(true);
    try {
      const res = await api.get("/examinee/exams");
      setAvailableExams(res.data);
      dbg.log("Fetched available exams:", res.data);
    } catch (err) {
      dbg.log("Failed to fetch available exams:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttempts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/examinee/attempts");
      setAttempts(res.data);
      dbg.log("Fetched attempts:", res.data);
    } catch (err) {
      dbg.log("Failed to fetch attempts:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTakeExam = (examId) => {
    navigate(`/take-exam/${examId}`);
  };

  const handleRequestDeletion = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.post("/examinee/request-delete", {
        attemptId: selectedAttempt.attempt_id,
        reason: deletionReason,
      });
      showPopup({
        type: "topright",
        title: "Success",
        message: "Deletion request submitted successfully",
      });
      setShowDeletionModal(false);
      setDeletionReason("");
    } catch (err) {
      dbg.log("Failed to request deletion:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredExams = availableExams.filter((exam) => {
    const query = searchQuery.toLowerCase();
    return (
      exam.title.toLowerCase().includes(query) ||
      (exam.creator_name && exam.creator_name.toLowerCase().includes(query))
    );
  });

  return (
    <div className="dashboard-container">
      <Navbar />

      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <h1 className="dashboard-title">Student Dashboard</h1>
          <p className="dashboard-subtitle">
            Take exams and view your results
          </p>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-tabs">
          <button
            className={`tab-button ${
              activeTab === "available" ? "active" : ""
            }`}
            onClick={() => setActiveTab("available")}
          >
            Available Exams
          </button>
          <button
            className={`tab-button ${activeTab === "attempts" ? "active" : ""}`}
            onClick={() => setActiveTab("attempts")}
          >
            My Attempts
          </button>
        </div>

        {activeTab === "available" && (
          <div>
            <div className="section-header">
              <h2 className="section-title">Available Exams</h2>
            </div>

            <div className="search-bar">
              <input
                type="text"
                className="search-input"
                placeholder="Search by exam name or examiner..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="loading-spinner">Loading exams...</div>
            ) : filteredExams.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📝</div>
                <h3>No exams available</h3>
                <p>Check back later for new exams</p>
              </div>
            ) : (
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Exam Title</th>
                      <th>Description</th>
                      <th>Questions</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExams.map((exam) => (
                      <tr key={exam.exam_id}>
                        <td>{exam.title}</td>
                        <td>{exam.description || "No description"}</td>
                        <td>{exam.total_questions || 0}</td>
                        <td>
                          <button
                            className="btn-view"
                            onClick={() => handleTakeExam(exam.exam_id)}
                          >
                            Take Exam
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "attempts" && (
          <div>
            <div className="section-header">
              <h2 className="section-title">My Attempts</h2>
            </div>

            {loading ? (
              <div className="loading-spinner">Loading attempts...</div>
            ) : attempts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📊</div>
                <h3>No attempts yet</h3>
                <p>Take an exam to see your results here</p>
              </div>
            ) : (
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Exam Title</th>
                      <th>Score</th>
                      <th>Total Questions</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((attempt) => (
                      <tr key={attempt.attempt_id}>
                        <td>{attempt.title}</td>
                        <td>
                          <strong style={{ color: "#10b981" }}>
                            {attempt.score}
                          </strong>
                        </td>
                        <td>{attempt.total_questions}</td>
                        <td>
                          {new Date(attempt.attempted_at).toLocaleDateString()}
                        </td>
                        <td>
                          <button
                            className="btn-delete"
                            onClick={() => {
                              setSelectedAttempt(attempt);
                              setShowDeletionModal(true);
                            }}
                          >
                            Request Deletion
                          </button>
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

      {showDeletionModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeletionModal(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Request Attempt Deletion</h2>
            </div>

            <form onSubmit={handleRequestDeletion}>
              <div className="form-group">
                <label className="form-label">
                  Reason for deletion request
                </label>
                <textarea
                  className="form-textarea"
                  value={deletionReason}
                  onChange={(e) => setDeletionReason(e.target.value)}
                  placeholder="Please explain why you want to delete this attempt..."
                  required
                />
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowDeletionModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}