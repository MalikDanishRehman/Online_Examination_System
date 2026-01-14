import { Link, useNavigate } from "react-router-dom";
import { dbg } from "../utils/debugger";
import { getRole, clearUser } from "../utils/auth";

export default function Navbar() {
  const role = getRole();
  const navigate = useNavigate();

  dbg.log("Navbar render, role:", role);

  const handleLogout = () => {
    dbg.log("Navbar: logout clicked");
    clearUser();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <span className="logo">Online Exam System</span>

        {role === "admin" && <Link to="/admin">Dashboard</Link>}
        {role === "examiner" && <Link to="/examiner">Dashboard</Link>}
        {role === "examinee" && <Link to="/examinee">Dashboard</Link>}
      </div>

      <div className="nav-right">
        <span className="role-chip">{role}</span>
        <button className="logout-btn" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </nav>
  );
}
