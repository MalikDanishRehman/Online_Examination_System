import React, { useState } from 'react';
import api from '../api/api';
import { useNavigate } from 'react-router-dom';

const Register = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const navigate = useNavigate();

  const submit = async e => {
    e.preventDefault();
    await api.post('/auth/register', form);
    alert('Registered successfully');
    navigate('/login');
  };

  return (
    <form onSubmit={submit}>
      <input placeholder="Name" onChange={e => setForm({...form, name:e.target.value})} />
      <input placeholder="Email" onChange={e => setForm({...form, email:e.target.value})} />
      <input type="password" placeholder="Password"
             onChange={e => setForm({...form, password:e.target.value})} />
      <button>Register</button>
    </form>
  );
};

export default Register;
