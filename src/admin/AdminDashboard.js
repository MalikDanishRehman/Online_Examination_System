import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../api/api";
import "../styles/admin.css";

export default function AdminDashboard() {
  /* =========================
     STATE
     ========================= */
  const [users, setUsers] = useState([]);
  const [exams, setExams] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [selectedExam, setSelectedExam] = useState(null);
  const [selectedExamAttempts, setSelectedExamAttempts] = useState(0);

  const [toast, setToast] = useState(null);
  const [userSearch, setUserSearch] = useState("");
  const [examSearch, setExamSearch] = useState("");

  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "examiner",
  });

  const [examForm, setExamForm] = useState({
    title: "",
    description: "",
    is_public: true,
  });

  const [aiTopic, setAiTopic] = useState("");
  const [aiCount, setAiCount] = useState(5);

  const [questionForm, setQuestionForm] = useState({
    question_text: "",
    option_a: "",
    option_b: "",
    option_c: "",
    option_d: "",
    correct_option: "A",
  });

  /* =========================
     LOAD DATA
     ========================= */
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [u, e] = await Promise.all([
      api.get("/admin/users"),
      api.get("/admin/exams"),
    ]);
    setUsers(u.data);
    setExams(e.data);
  };

  /* =========================
     TOAST
     ========================= */
  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  /* =========================
     SEARCH
     ========================= */
  const searchUsers = async () => {
    if (!userSearch) return loadData();
    const res = await api.get(`/admin/users/search?q=${userSearch}`);
    setUsers(res.data);
  };

  const searchExams = async () => {
    if (!examSearch) return loadData();
    const res = await api.get(`/admin/exams/search?q=${examSearch}`);
    setExams(res.data);
  };

  /* =========================
     USER CRUD
     ========================= */
  const createUser = async (e) => {
    e.preventDefault();
    if (!userForm.name || !userForm.email || !userForm.password) {
      return showToast("All user fields required", "error");
    }

    await api.post("/admin/create-user", userForm);
    showToast("User created");
    setUserForm({ name: "", email: "", password: "", role: "examiner" });
    loadData();
  };

  /* =========================
     EXAM CRUD
     ========================= */
  const createExam = async (e) => {
    e.preventDefault();
    if (!examForm.title) return showToast("Exam title required", "error");

    await api.post("/admin/exam", examForm);
    showToast("Empty exam created");
    setExamForm({ title: "", description: "", is_public: true });
    loadData();
  };

  const createExamAI = async (e) => {
    e.preventDefault();
    if (!aiTopic) return showToast("Topic required", "error");

    try {
      const res = await api.post("/admin/exam/ai", {
        topic: aiTopic,
        count: aiCount,
      });

      showToast("AI exam created");
      setAiTopic("");
      await loadData();

      const created = {
        exam_id: res.data.exam_id,
        title: `${aiTopic} Exam`,
        attempts: 0,
      };

      openQuestions(created);
    } catch (err) {
      showToast("AI generation failed", "error");
    }
  };

  const deleteExam = async (id) => {
  if (!window.confirm("Delete this exam permanently?")) return;

  try {
    await api.delete(`/admin/exam/${id}`);
    showToast("Exam deleted");
    loadData();
    setSelectedExam(null);
  } catch (error) {
    console.error("Error deleting exam:", error);
    showToast("Failed to delete exam", "error");
  }
};


  /* =========================
     QUESTIONS
     ========================= */
  const openQuestions = async (exam) => {
    setSelectedExam(exam);
    setSelectedExamAttempts(exam.attempts || 0);

    const res = await api.get(`/admin/exam/${exam.exam_id}/questions`);
    setQuestions(res.data);
  };

  const addQuestion = async (e) => {
    e.preventDefault();
    if (selectedExamAttempts > 0) {
      return showToast("Exam already attempted. Editing locked.", "error");
    }

    const q = questionForm;
    if (!q.question_text || !q.option_a || !q.option_b || !q.option_c || !q.option_d) {
      return showToast("All question fields required", "error");
    }

    await api.post(`/admin/exam/${selectedExam.exam_id}/questions`, q);
    showToast("Question added");

    setQuestionForm({
      question_text: "",
      option_a: "",
      option_b: "",
      option_c: "",
      option_d: "",
      correct_option: "A",
    });

    openQuestions(selectedExam);
  };

  const deleteQuestion = async (qid) => {
    if (selectedExamAttempts > 0) {
      return showToast("Exam already attempted. Editing locked.", "error");
    }

    await api.delete(`/admin/exam/${selectedExam.exam_id}/questions/${qid}`);
    openQuestions(selectedExam);
  };

  /* =========================
     RENDER
     ========================= */
  return (
    <>
      <Navbar />
      <div className="admin-page">
        <h1>Admin Dashboard</h1>

        {toast && <div className={`toast ${toast.type}`}>{toast.msg}</div>}

        {/* CREATE USER */}
        <section className="card">
          <h2>Create User</h2>
          <form onSubmit={createUser} className="admin-form">
            <input placeholder="Name" value={userForm.name}
              onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />
            <input placeholder="Email" value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
            <input type="password" placeholder="Password" value={userForm.password}
              onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
            <button>Create User</button>
          </form>
        </section>

        {/* CREATE EXAM */}
        <section className="card">
          <h2>Create Exam</h2>
          <form onSubmit={createExam} className="admin-form">
            <input placeholder="Title" value={examForm.title}
              onChange={(e) => setExamForm({ ...examForm, title: e.target.value })} />
            <textarea placeholder="Description" value={examForm.description}
              onChange={(e) => setExamForm({ ...examForm, description: e.target.value })} />
            <button>Create Exam</button>
          </form>
        </section>

        {/* CREATE EXAM AI */}
        <section className="card">
          <h2>Create Exam (AI)</h2>
          <form onSubmit={createExamAI} className="admin-form">
            <input placeholder="Topic" value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)} />
            <input type="number" min="1" value={aiCount}
              onChange={(e) => setAiCount(Number(e.target.value))} />
            <button>Generate Exam</button>
          </form>
        </section>

{/* USERS LIST */}
<section className="card">
  <h2>All Users</h2>

  <div className="search-row">
    <input
      placeholder="Search users by name or email..."
      value={userSearch}
      onChange={(e) => setUserSearch(e.target.value)}
    />
    <button onClick={searchUsers}>Search</button>
    <button onClick={loadData}>Reset</button>
  </div>

  <table>
    <thead>
      <tr>
        <th>ID</th>
        <th>Name</th>
        <th>Email</th>
        <th>Role</th>
      </tr>
    </thead>
    <tbody>
      {users.length === 0 ? (
        <tr>
          <td colSpan="4" style={{ textAlign: "center" }}>
            No users found
          </td>
        </tr>
      ) : (
        users.map((u) => (
          <tr key={u.user_id}>
            <td>{u.user_id}</td>
            <td>{u.name}</td>
            <td>{u.email}</td>
            <td>{u.role}</td>
          </tr>
        ))
      )}
    </tbody>
  </table>
</section>


        {/* EXAMS */}
        <section className="card">
          <h2>Exams</h2>
          <input placeholder="Search exams..."
            value={examSearch}
            onChange={(e) => setExamSearch(e.target.value)} />
          <button onClick={searchExams}>Search</button>

          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Creator</th>
                <th>Attempts</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {exams.map((e) => (
                <tr key={e.exam_id}>
                  <td>{e.exam_id}</td>
                  <td>{e.title}</td>
                  <td>{e.creator_name}</td>
                  <td>{e.attempts}</td>
                  <td>
                    <button onClick={() => openQuestions(e)}>📄</button>
                    <button onClick={() => deleteExam(e.exam_id)}>❌</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* QUESTIONS MODAL */}
        {selectedExam && (
          <div className="modal">
            <div className="modal-box">
              <h2>
                Questions: {selectedExam.title}
                {selectedExamAttempts > 0 && (
                  <span style={{ color: "red", marginLeft: 10 }}>
                    (Locked – Attempted)
                  </span>
                )}
              </h2>

              {questions.map((q) => (
                <div key={q.question_id} className="question-card">
                  <strong>{q.question_text}</strong>
                  <div>A. {q.option_a}</div>
                  <div>B. {q.option_b}</div>
                  <div>C. {q.option_c}</div>
                  <div>D. {q.option_d}</div>
                  <small>Correct: {q.correct_option}</small>

                  {selectedExamAttempts === 0 && (
                    <button onClick={() => deleteQuestion(q.question_id)}>❌</button>
                  )}
                  <hr />
                </div>
              ))}

              {selectedExamAttempts === 0 && (
                <form onSubmit={addQuestion}>
                  <input placeholder="Question" value={questionForm.question_text}
                    onChange={(e) => setQuestionForm({ ...questionForm, question_text: e.target.value })} />
                  <input placeholder="Option A" value={questionForm.option_a}
                    onChange={(e) => setQuestionForm({ ...questionForm, option_a: e.target.value })} />
                  <input placeholder="Option B" value={questionForm.option_b}
                    onChange={(e) => setQuestionForm({ ...questionForm, option_b: e.target.value })} />
                  <input placeholder="Option C" value={questionForm.option_c}
                    onChange={(e) => setQuestionForm({ ...questionForm, option_c: e.target.value })} />
                  <input placeholder="Option D" value={questionForm.option_d}
                    onChange={(e) => setQuestionForm({ ...questionForm, option_d: e.target.value })} />

                  <select value={questionForm.correct_option}
                    onChange={(e) => setQuestionForm({ ...questionForm, correct_option: e.target.value })}>
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                  </select>

                  <button>Add Question</button>
                </form>
              )}

              <button onClick={() => setSelectedExam(null)}>Close</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
