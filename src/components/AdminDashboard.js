// src/components/AdminDashboard.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './../App.css'; 

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [view, setView] = useState('add-user'); 
    
    // Form Data
    const [user, setUser] = useState({ fullName: '', rollNo: '', password: '', role: 'Student' });
    
    // Real Data Store karne ke liye State
    const [usersList, setUsersList] = useState([]);

    // --- 1. FETCH USERS FROM DB ---
    const fetchUsers = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/users');
            setUsersList(res.data);
        } catch (err) {
            console.error("Error fetching users:", err);
        }
    };

    // Jab component load ho ya 'View Users' tab khule, tab data layen
    useEffect(() => {
        if (view === 'view-users') {
            fetchUsers();
        }
    }, [view]);

    // --- 2. ADD USER ---
    const handleUserSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/addUser', user);
            if(res.data.success) { 
                alert(`🎉 ${user.role} Added Successfully!`); 
                setUser({ fullName: '', rollNo: '', password: '', role: 'Student' }); 
                fetchUsers(); // List ko update karo
            } else {
                alert("Error: " + res.data.message);
            }
        } catch(err) { alert("Server Error"); }
    };

    // --- 3. DELETE USER ---
    const handleDelete = async (id) => {
        if(!window.confirm("Are you sure you want to delete this user?")) return;

        try {
            const res = await axios.delete(`http://localhost:5000/api/deleteUser/${id}`);
            if (res.data.success) {
                alert("User Deleted Successfully");
                fetchUsers(); // Refresh list
            } else {
                alert("Error deleting user");
            }
        } catch (error) {
            console.error(error);
            alert("Server Error");
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        navigate('/');
    };

    return (
        <div className="dashboard-container">
            {/* SIDEBAR */}
            <aside className="sidebar">
                <div className="logo-section">
                    <h2>🛡️ Admin Panel</h2>
                    <p className="welcome-text">System Administrator</p>
                </div>

                <nav className="nav-links">
                    <button className={view === 'add-user' ? 'active' : ''} onClick={() => setView('add-user')}>
                        ➕ Add New User
                    </button>
                    <button className={view === 'view-users' ? 'active' : ''} onClick={() => setView('view-users')}>
                        👥 View All Users
                    </button>
                </nav>

                <button className="logout-btn" onClick={handleLogout}>LOGOUT</button>
            </aside>

            {/* MAIN CONTENT */}
            <main className="main-content">
                <header className="top-bar">
                    <h1>{view === 'add-user' ? 'User Registration' : 'User Management'}</h1>
                </header>

                <div className="content-area">
                    {view === 'add-user' ? (
                        // ADD USER FORM
                        <div className="card" style={{maxWidth: '600px', margin: '0 auto'}}>
                            <div style={{marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px'}}>
                                <h3 style={{margin:0, color:'#1e293b'}}>Create New Account</h3>
                                <p style={{margin:'5px 0', color:'#64748b', fontSize:'0.9rem'}}>Add Teachers or Students to the system.</p>
                            </div>
                            
                            <form onSubmit={handleUserSubmit} className="admin-form">
                                <label>Full Name</label>
                                <input className="modern-input" placeholder="e.g. Sir Zubair" value={user.fullName} onChange={(e) => setUser({...user, fullName: e.target.value})} required />

                                <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px'}}>
                                    <div>
                                        <label>Login ID / Roll No</label>
                                        <input className="modern-input" placeholder="Unique ID" value={user.rollNo} onChange={(e) => setUser({...user, rollNo: e.target.value})} required />
                                    </div>
                                    <div>
                                        <label>Password</label>
                                        <input type="password" className="modern-input" placeholder="******" value={user.password} onChange={(e) => setUser({...user, password: e.target.value})} required />
                                    </div>
                                </div>

                                <label>Role</label>
                                <select className="modern-input" value={user.role} onChange={(e) => setUser({...user, role: e.target.value})}>
                                    <option value="Student">Student</option>
                                    <option value="Teacher">Teacher</option>
                                    <option value="Admin">Admin</option>
                                </select>

                                <button type="submit" className="create-btn" style={{width: '100%', marginTop:'10px'}}>Create Account</button>
                            </form>
                        </div>
                    ) : (
                        // VIEW USERS TABLE
                        <div className="card table-card">
                            <h3>Registered Users Database</h3>
                            {usersList.length === 0 ? (
                                <p style={{padding:'20px', textAlign:'center'}}>No users found. Loading...</p>
                            ) : (
                                <table className="modern-table">
                                    <thead>
                                        <tr>
                                            <th>ID</th>
                                            <th>Full Name</th>
                                            <th>Login ID</th>
                                            <th>Role</th>
                                            <th>Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {usersList.map((u) => (
                                            <tr key={u.UserID}>
                                                <td>#{u.UserID}</td>
                                                <td>{u.FullName}</td>
                                                <td>{u.RollNo}</td>
                                                <td>
                                                    <span className={`status-badge ${u.Role === 'Teacher' ? 'published' : 'draft'}`}>
                                                        {u.Role}
                                                    </span>
                                                </td>
                                                <td>
                                                    <button 
                                                        className="sm-btn" 
                                                        style={{background:'#ef4444'}}
                                                        onClick={() => handleDelete(u.UserID)}
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default AdminDashboard;