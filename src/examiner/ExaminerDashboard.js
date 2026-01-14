import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/api";
import "../styles/examiner.css";

export default function ExaminerDashboard() {
  const [exams, setExams] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
  try {
    const res = await api.get("/examiner/exams");
    console.log("Examiner exams:", res.data);
    setExams(res.data);
  } catch (err) {
    console.error(err);
    alert("Failed to load exams");
  }
};


  const deleteExam = async (id) => {
    if (!window.confirm("Delete this exam permanently?")) return;

    try {
      await api.delete(`/examiner/exams/${id}`);
      fetchExams();
    } catch (err) {
      alert("Delete failed");
      console.error(err);
    }
  };

  return (
    <>
      <Navbar />
      <div className="page">
        <h1>Examiner Dashboard</h1>

        <div className="actions">
          <button onClick={() => navigate("/examiner/create")}>
            + Manual Exam
          </button>
          <button onClick={() => navigate("/examiner/create-ai")}>
            + AI Exam
          </button>
        </div>

        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Questions</th>
              <th>Visibility</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {exams.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center" }}>
                  No exams created yet
                </td>
              </tr>
            ) : (
              exams.map((e) => (
                <tr key={e.id}>
                  <td>{e.title}</td>
                  <td>{e.questionCount}</td>
                  <td>{e.isPublic ? "Public" : "Private"}</td>
                  <td>
                    <button onClick={() => navigate(`/examiner/edit/${e.id}`)}>
                      Edit
                    </button>
                    <button onClick={() => navigate(`/examiner/results/${e.id}`)}>
                      Results
                    </button>
                    <button onClick={() => deleteExam(e.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
