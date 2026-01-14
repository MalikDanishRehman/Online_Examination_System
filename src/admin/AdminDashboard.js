import React, { useState } from 'react';
import api from '../api/api';

const AdminDashboard = () => {
  const [form, setForm] = useState({
    name: '', email: '', password: '', role: 'examiner'
  });

  const submit = async e => {
    e.preventDefault();
    await api.post('/admin/create-user', form);
    alert('User created');
  };

  const logout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div>
      <h2>Admin Dashboard</h2>

      <form onSubmit={submit}>
        <input placeholder="Name" onChange={e => setForm({...form, name:e.target.value})} />
        <input placeholder="Email" onChange={e => setForm({...form, email:e.target.value})} />
        <input type="password" placeholder="Password"
               onChange={e => setForm({...form, password:e.target.value})} />
        <select onChange={e => setForm({...form, role:e.target.value})}>
          <option value="examiner">Examiner</option>
          <option value="examinee">Examinee</option>
        </select>
        <button>Create</button>
      </form>

      <button onClick={logout}>Logout</button>
    </div>
  );
};

export default AdminDashboard;
