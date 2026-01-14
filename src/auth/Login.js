import React, { useState } from 'react';
import api from '../api/api';
import { useNavigate, Link } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const submit = async e => {
    e.preventDefault();
    const res = await api.post('/auth/login', { email, password });

    try {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', res.data.token);
    localStorage.setItem('user', JSON.stringify(res.data.user));
    } catch (err) {
    alert(err.response?.data?.message || 'Login failed');
    }

    if (res.data.user.role === 'admin') navigate('/admin');
    else if (res.data.user.role === 'examiner') navigate('/examiner');
    else navigate('/examinee');
  };

  return (
    <div>
      <h2>Login</h2>
      <form onSubmit={submit}>
        <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Password"
               onChange={e => setPassword(e.target.value)} />
        <button>Login</button>
      </form>
      <Link to="/register">Register as Student</Link>
    </div>
  );
};

export default Login;
