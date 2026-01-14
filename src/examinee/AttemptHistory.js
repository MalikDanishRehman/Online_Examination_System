import { useEffect, useState } from "react";

import Navbar from "../components/Navbar";
import api from "../api/api";
import { dbg } from "../utils/debugger";

export default function AttemptHistory() {
  const [attempts, setAttempts] = useState([]);

  useEffect(() => {
    dbg.log("AttemptHistory mounted");
    fetchAttempts();
  }, []);

  const fetchAttempts = async () => {
    try {
      dbg.log("Fetching attempt history");
      const res = await api.get("/examinee/attempts");
      setAttempts(res.data);
      dbg.log("Attempts loaded:", res.data.length);
    } catch (err) {
      dbg.log("Failed to fetch attempts:", err);
    }
  };

  return (
    <>
      <Navbar />
      <div className="page">
        <h1>Attempt History</h1>

        <table>
          <thead>
            <tr>
              <th>Exam</th>
              <th>Score</th>
              <th>Attempt</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {attempts.map((a, i) => (
              <tr key={i}>
                <td>{a.examTitle}</td>
                <td>{a.score}</td>
                <td>{a.attemptNumber}</td>
                <td>{new Date(a.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
