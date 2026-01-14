import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import api from "../api/api";
import { dbg } from "../utils/debugger";

export default function ExamResults() {
  const [results, setResults] = useState([]);

  useEffect(() => {
    dbg.log("ExamResults mounted");
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const res = await api.get("/examiner/results");
      setResults(res.data);
      dbg.log("Results loaded:", res.data.length);
    } catch (err) {
      dbg.log("Failed to load exam results:", err);
    }
  };

  return (
    <>
      <Navbar />
      <div className="page">
        <h1>Exam Results</h1>

        <table>
          <thead>
            <tr>
              <th>Exam</th>
              <th>Student</th>
              <th>Score</th>
              <th>Attempted At</th>
            </tr>
          </thead>
          <tbody>
            {results.map((r) => (
              <tr key={r.attempt_id}>
                <td>{r.exam_title}</td>
                <td>{r.student_name}</td>
                <td>{r.score}</td>
                <td>{new Date(r.attempted_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
