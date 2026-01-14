import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/api";
import { dbg } from "../utils/debugger";
import { showPopup } from "../utils/popup";

export default function ExamineeDashboard() {
  const [exams, setExams] = useState([]);
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    dbg.log("ExamineeDashboard mounted");
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      dbg.log("Fetching available exams for examinee");
      const res = await api.get("/examinee/exams");
      setExams(res.data);
      dbg.log("Available exams loaded:", res.data.length);
    } catch (err) {
      dbg.log("Failed to fetch examinee exams:", err);
      showPopup({
        type: "topright",
        title: "Load Failed",
        message: "Unable to load exams. Check logs.",
      });
    }
  };

  const filtered = exams.filter((e) =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.examinerName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <Navbar />
      <div className="page">
        <h1>Available Exams</h1>

        <input
          className="search-box"
          placeholder="Search by exam or examiner"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <ul className="exam-list">
          {filtered.map((exam) => (
            <li key={exam.id} className="exam-item">
              <div>
                <strong>{exam.title}</strong>
                <div className="muted">
                  Examiner: {exam.examinerName}
                </div>
              </div>

              <button onClick={() => navigate(`/examinee/exam/${exam.id}`)}>
                Start Exam
              </button>
            </li>
          ))}
        </ul>

        <button onClick={() => navigate("/examinee/attempts")}>
          View Attempt History
        </button>
      </div>
    </>
  );
}
