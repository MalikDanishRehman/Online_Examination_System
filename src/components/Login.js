// src/components/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios'; 

const Login = () => {
  const [rollNo, setRollNo] = useState(''); 
  const [password, setPassword] = useState(''); 
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post('http://localhost:5000/api/login', {
        rollNo: rollNo,
        password: password
      });

      if (response.data.success) {
        alert("Login Successful! Welcome " + response.data.user.FullName);
        
        // User data browser mein save karein
        localStorage.setItem('user', JSON.stringify(response.data.user));
        
        // --- LOGIC FIX YAHAN HAI ---
        const role = response.data.user.Role;

        if (role === 'Admin') {
            navigate('/admin');
        } 
        else if (role === 'Teacher') {
            navigate('/teacher'); // <--- Ye line missing thi!
        } 
        else {
            navigate('/student'); // Baaki sab Students
        }
        // ---------------------------

      } else {
        alert("Ghalat ID ya Password! Dobara try karein.");
      }

    } catch (error) {
      console.error("Login Error:", error);
      alert("Server connect nahi ho pa raha. Kya backend chal raha hai?");
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-box">
        <h2>Online Exam Portal</h2>
        <p>Login to start your exam</p>
        
        <form onSubmit={handleLogin}>
          <input 
            type="text" 
            placeholder="Enter Login ID / Roll No"
            className="input-field"
            value={rollNo}
            onChange={(e) => setRollNo(e.target.value)}
            required
          />
          
          <input 
            type="password" 
            placeholder="Enter Password"
            className="input-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" className="btn-primary">Login</button>
        </form>
      </div>
    </div>
  );
};

export default Login;