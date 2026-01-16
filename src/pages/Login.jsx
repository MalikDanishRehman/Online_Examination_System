import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api/api";
import { dbg } from "../utils/debugger";
import { saveUser } from "../utils/auth";
import { showPopup } from "../popup/popup";
import "../styles/auth.css";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dbg.log("Login attempt started", { email });

    if (!email || !password) {
      dbg.log("Login validation failed: empty fields");
      showPopup({
        type: "topright",
        title: "Validation Error",
        message: "Email and password are required.",
      });
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/auth/login", { email, password });
      dbg.log("Login API success:", res.data);

      const user = {
        id: res.data.user.user_id,
        name: res.data.user.name,
        email: res.data.user.email,
        role: res.data.user.role,
        token: res.data.token,
      };
      saveUser(user);
      dbg.log("User saved, redirecting to role dashboard", user.role);
      
      showPopup({
        type: "topright",
        title: "Login Successful",
        message: `Welcome back, ${user.name}!`,
      });
      
      navigate(`/${user.role}`);
    } catch (err) {
      dbg.log("Login failed (caught):", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Login</h2>
        <input
          type="text"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
        <p className="auth-link">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </form>
    </div>
  );
}