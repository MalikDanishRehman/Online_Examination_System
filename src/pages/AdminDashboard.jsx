import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/api";
import { showPopup } from "../popup/popup";
import { dbg } from "../utils/debugger";
import "../styles/dashboard.css";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("users");
  const [users, setUsers] = useState([]);
  const [exams, setExams] = useState([]);
  const [deletionRequests, setDeletionRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "examinee",
  });

  useEffect(() => {
    if (activeTab === "users") {
      fetchUsers();
    } else if (activeTab === "exams") {
      fetchExams();
    } else if (activeTab === "requests") {
      fetchDeletionRequests();
    }
  }, [activeTab]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
      dbg.log("Fetched users:", res.data);
    } catch (err) {
      dbg.log("Failed to fetch users:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExams = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/exams");
      setExams(res.data);
      dbg.log("Fetched exams:", res.data);
    } catch (err) {
      dbg.log("Failed to fetch exams:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDeletionRequests = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/attempt-deletion-requests");
      setDeletionRequests(res.data);
      dbg.log("Fetched deletion requests:", res.data);
    } catch (err) {
      dbg.log("Failed to fetch deletion requests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    setUserForm({ name: "", email: "", password: "", role: "examinee" });
    setShowUserModal(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      name: user.name,
      email: user.email,
      password: "",
      role: user.role,
    });
    setShowUserModal(true);
  };

  const handleSubmitUser = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingUser) {
        await api.put(`/admin/update-user/${editingUser.user_id}`, userForm);
        showPopup({
          type: "topright",
          title: "Success",
          message: "User updated successfully",
        });
      } else {
        await api.post("/admin/create-user", userForm);
        showPopup({
          type: "topright",
          title: "Success",
          message: "User created successfully",
        });
      }
      setShowUserModal(false);
      fetchUsers();
    } catch (err) {
      dbg.log("Failed to submit user:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;

    setLoading(true);
    try {
      await api.delete(`/admin/delete-user/${userId}`);
      showPopup({
        type: "topright",
        title: "Success",
        message: "User deleted successfully",
      });
      fetchUsers();
    } catch (err) {
      dbg.log("Failed to delete user:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteExam = async (examId) => {
    if (!window.confirm("Are you sure you want to delete this exam?")) return;

    setLoading(true);
    try {
      await api.delete(`/admin/delete-exam/${examId}`);
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

  const handleDeletionRequest = async (requestId, action) => {
    setLoading(true);
    try {
      await api.post(`/admin/attempt-deletion/${requestId}`, { action });
      showPopup({
        type: "topright",
        title: "Success",
        message: `Request ${action} successfully`,
      });
      fetchDeletionRequests();
    } catch (err) {
      dbg.log("Failed to handle deletion request:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredExams = exams.filter((exam) =>
    exam.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-container">
      <Navbar />

      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <h1 className="dashboard-title">Admin Dashboard</h1>
          <p className="dashboard-subtitle">
            Manage users, exams, and system settings
          </p>
        </div>
      </div>

      <div className="dashboard-content">
        <div className="dashboard-tabs">
          <button
            className={`tab-button ${activeTab === "users" ? "active" : ""}`}
            onClick={() => setActiveTab("users")}
          >
            Users
          </button>
          <button
            className={`tab-button ${activeTab === "exams" ? "active" : ""}`}
            onClick={() => setActiveTab("exams")}
          >
            Exams
          </button>
          <button
            className={`tab-button ${activeTab === "requests" ? "active" : ""}`}
            onClick={() => setActiveTab("requests")}
          >
            Deletion Requests
          </button>
        </div>

        {activeTab === "users" && (
          <div>
            <div className="section-header">
              <h2 className="section-title">User Management</h2>
              <button className="btn-create" onClick={handleCreateUser}>
                + Create User
              </button>
            </div>

            <div className="search-bar">
              <input
                type="text"
                className="search-input"
                placeholder="Search users by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="loading-spinner">Loading users...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">👥</div>
                <h3>No users found</h3>
                <p>Create your first user to get started</p>
              </div>
            ) : (
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.user_id}>
                        <td>{user.user_id}</td>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`role-badge ${user.role}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-edit"
                              onClick={() => handleEditUser(user)}
                            >
                              Edit
                            </button>
                            <button
                              className="btn-delete"
                              onClick={() => handleDeleteUser(user.user_id)}
                              disabled={user.user_id === 1}
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

        {activeTab === "exams" && (
          <div>
            <div className="section-header">
              <h2 className="section-title">Exam Management</h2>
            </div>

            <div className="search-bar">
              <input
                type="text"
                className="search-input"
                placeholder="Search exams by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="loading-spinner">Loading exams...</div>
            ) : filteredExams.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📝</div>
                <h3>No exams found</h3>
                <p>Exams will appear here once created</p>
              </div>
            ) : (
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Title</th>
                      <th>Creator</th>
                      <th>Visibility</th>
                      <th>Attempts</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExams.map((exam) => (
                      <tr key={exam.exam_id}>
                        <td>{exam.exam_id}</td>
                        <td>{exam.title}</td>
                        <td>{exam.creator_name}</td>
                        <td>
                          {exam.is_public ? (
                            <span className="role-badge examinee">Public</span>
                          ) : (
                            <span className="role-badge examiner">Private</span>
                          )}
                        </td>
                        <td>{exam.attempts}</td>
                        <td>
                          <div className="action-buttons">
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

        {activeTab === "requests" && (
          <div>
            <div className="section-header">
              <h2 className="section-title">Attempt Deletion Requests</h2>
            </div>

            {loading ? (
              <div className="loading-spinner">Loading requests...</div>
            ) : deletionRequests.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">📋</div>
                <h3>No pending requests</h3>
                <p>Deletion requests will appear here</p>
              </div>
            ) : (
              <div className="data-table">
                <table>
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Attempt ID</th>
                      <th>Student</th>
                      <th>Reason</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deletionRequests.map((req) => (
                      <tr key={req.request_id}>
                        <td>{req.request_id}</td>
                        <td>{req.attempt_id}</td>
                        <td>
                          {req.student_name}
                          <br />
                          <small style={{ color: "#9ca3af" }}>
                            {req.student_email}
                          </small>
                        </td>
                        <td>{req.request_reason}</td>
                        <td>
                          {new Date(req.requested_at).toLocaleDateString()}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="btn-approve"
                              onClick={() =>
                                handleDeletionRequest(
                                  req.request_id,
                                  "approved"
                                )
                              }
                            >
                              Approve
                            </button>
                            <button
                              className="btn-reject"
                              onClick={() =>
                                handleDeletionRequest(
                                  req.request_id,
                                  "rejected"
                                )
                              }
                            >
                              Reject
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
      </div>

      {showUserModal && (
        <div className="modal-overlay" onClick={() => setShowUserModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingUser ? "Edit User" : "Create User"}
              </h2>
            </div>

            <form onSubmit={handleSubmitUser}>
              <div className="form-group">
                <label className="form-label">Name</label>
                <input
                  type="text"
                  className="form-input"
                  value={userForm.name}
                  onChange={(e) =>
                    setUserForm({ ...userForm, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  type="email"
                  className="form-input"
                  value={userForm.email}
                  onChange={(e) =>
                    setUserForm({ ...userForm, email: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">
                  Password {editingUser && "(leave blank to keep current)"}
                </label>
                <input
                  type="password"
                  className="form-input"
                  value={userForm.password}
                  onChange={(e) =>
                    setUserForm({ ...userForm, password: e.target.value })
                  }
                  required={!editingUser}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Role</label>
                <select
                  className="form-select"
                  value={userForm.role}
                  onChange={(e) =>
                    setUserForm({ ...userForm, role: e.target.value })
                  }
                  required
                >
                  <option value="examinee">Examinee</option>
                  <option value="examiner">Examiner</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={() => setShowUserModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-submit"
                  disabled={loading}
                >
                  {loading
                    ? "Saving..."
                    : editingUser
                    ? "Update User"
                    : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}