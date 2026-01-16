import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { dbg } from "./utils/debugger";
import { getUser } from "./utils/auth";
import Login from "./pages/Login";
import Register from "./pages/Register";
import LandingPage from "./pages/LandingPage";
import AdminDashboard from "./pages/AdminDashboard";
import ExaminerDashboard from "./pages/ExaminerDashboard";
import ExamineeDashboard from "./pages/ExamineeDashboard";
import TakeExam from "./pages/TakeExam";
import ProtectedRoute from "./components/ProtectedRoute";
import PopupHost from "./popup/PopupHost";
import "./styles/popup.css";

function App() {
  dbg.log("App mounted");

  return (
    <BrowserRouter>
      <PopupHost />

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/examiner"
          element={
            <ProtectedRoute allowedRoles={["examiner"]}>
              <ExaminerDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/examinee"
          element={
            <ProtectedRoute allowedRoles={["examinee"]}>
              <ExamineeDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/take-exam/:examId"
          element={
            <ProtectedRoute allowedRoles={["examinee"]}>
              <TakeExam />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;