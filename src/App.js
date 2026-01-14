import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { dbg } from "./utils/debugger";

import Login from "./auth/Login";
import Register from "./auth/Register";

import PopupHost from "./components/PopupHost";

import AdminDashboard from "./admin/AdminDashboard";

import ExaminerDashboard from "./examiner/ExaminerDashboard";
import CreateExam from "./examiner/CreateExam";
import CreateExamAI from "./examiner/CreateExamAI";
import ExamResults from "./examiner/ExamResults";

import ExamineeDashboard from "./examinee/ExamineeDashboard";
import TakeExam from "./examinee/TakeExam";
import AttemptHistory from "./examinee/AttemptHistory";

import { Protected, PublicOnly } from "./utils/RouteGuards";

function App() {
  dbg.log("App mounted");

  return (
    <BrowserRouter>
      <PopupHost />

      <Routes>
        {/* ================= PUBLIC ================= */}
        <Route
          path="/login"
          element={
            <PublicOnly>
              <Login />
            </PublicOnly>
          }
        />

        <Route
          path="/register"
          element={
            <PublicOnly>
              <Register />
            </PublicOnly>
          }
        />

        {/* ================= ADMIN ================= */}
        <Route
          path="/admin"
          element={
            <Protected roles={["admin"]}>
              <AdminDashboard />
            </Protected>
          }
        />

        {/* ================= EXAMINER ================= */}
        <Route
          path="/examiner"
          element={
            <Protected roles={["examiner"]}>
              <ExaminerDashboard />
            </Protected>
          }
        />

        <Route
          path="/examiner/create"
          element={
            <Protected roles={["examiner"]}>
              <CreateExam />
            </Protected>
          }
        />

        <Route
          path="/examiner/create-ai"
          element={
            <Protected roles={["examiner"]}>
              <CreateExamAI />
            </Protected>
          }
        />

        <Route
          path="/examiner/results"
          element={
            <Protected roles={["examiner"]}>
              <ExamResults />
            </Protected>
          }
        />

        {/* ================= EXAMINEE ================= */}
        <Route
          path="/examinee"
          element={
            <Protected roles={["examinee"]}>
              <ExamineeDashboard />
            </Protected>
          }
        />

        <Route
          path="/examinee/exam/:id"
          element={
            <Protected roles={["examinee"]}>
              <TakeExam />
            </Protected>
          }
        />

        <Route
          path="/examinee/attempts"
          element={
            <Protected roles={["examinee"]}>
              <AttemptHistory />
            </Protected>
          }
        />

        {/* ================= FALLBACK ================= */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
