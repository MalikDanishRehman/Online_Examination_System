import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Login from './auth/Login';
import Register from './auth/Register';

import AdminDashboard from './admin/AdminDashboard';
import ExaminerDashboard from './examiner/ExaminerDashboard';
import ExamineeDashboard from './examinee/ExamineeDashboard';

const RequireAuth = ({ role, children }) => {
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user'));

  if (!token || !user) return <Navigate to="/login" />;
  if (role && user.role !== role) return <Navigate to="/login" />;

  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/admin" element={
          <RequireAuth role="admin"><AdminDashboard /></RequireAuth>
        } />

        <Route path="/examiner" element={
          <RequireAuth role="examiner"><ExaminerDashboard /></RequireAuth>
        } />

        <Route path="/examinee" element={
          <RequireAuth role="examinee"><ExamineeDashboard /></RequireAuth>
        } />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
