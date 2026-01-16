import { Link, useNavigate } from "react-router-dom";
import { getUser, clearUser } from "../utils/auth";
import { dbg } from "../utils/debugger";
import "../styles/navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const user = getUser();

  const handleLogout = () => {
    dbg.log("User logging out");
    clearUser();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="logo">
          <span className="logo-icon">📝</span>
          Exam System
        </Link>
        
        <ul className="nav-links">
          {user ? (
            <>
              <li>
                <Link to={`/${user.role}`} className="nav-link">
                  Dashboard
                </Link>
              </li>
              <li className="user-info">
                <span className="user-name">{user.name}</span>
                <span className="user-role">{user.role}</span>
              </li>
              <li>
                <button className="logout-btn" onClick={handleLogout}>
                  Logout
                </button>
              </li>
            </>
          ) : (
            <>
              <li>
                <Link to="/login" className="nav-link">Login</Link>
              </li>
              <li>
                <Link to="/register" className="nav-link">Register</Link>
              </li>
            </>
          )}
        </ul>
      </div>
    </nav>
  );
}