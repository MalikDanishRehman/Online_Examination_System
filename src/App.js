// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import StudentExam from './components/StudentExam'; 
import TeacherDashboard from './components/TeacherDashboard';
import CreateExamManual from './components/CreateExamManual'; // Manual exam creation
import CreateExamAI from './components/CreateExamAI'; // AI exam creation

import './App.css'; 

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/teacher" element={<TeacherDashboard />} />
        <Route path="/student" element={<StudentExam />} />
        
        {/* New Manual Route */}
        <Route path="/create-exam-manual" element={<CreateExamManual />} />
        
        {/* AI Route */}
        <Route path="/create-exam-ai" element={<CreateExamAI />} />

      </Routes>
    </Router>
  );
}

export default App;
