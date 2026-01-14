import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

import api from "../api/api";
import { dbg } from "../utils/debugger";
import { showPopup } from "../utils/popup";

import "../styles/auth.css";

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    dbg.log("Register attempt started", { name, email });

    if (!name || !email || !password) {
      dbg.log("Register validation failed: empty fields");

      showPopup({
        type: "topright",
        title: "Validation Error",
        message: "All fields are required.",
      });
      return;
    }

    setLoading(true);

    try {
      dbg.log("Register API call (forced examinee)");

      const payload = {
        name,
        email,
        password,
        role: "examinee", // 🔒 forced by rule
      };

      const res = await api.post("/auth/register", payload);

      dbg.log("Register API success:", res.data);

      showPopup({
        type: "topright",
        title: "Registration Successful",
        message: "Account created successfully.\nYou can now login.",
      });

      navigate("/login");
    } catch (err) {
      dbg.log("Register failed (caught):", err);

      showPopup({
        type: "topright",
        title: "Registration Failed",
        message:
          "Unable to register.\n" +
          "Possible reasons:\n" +
          "- Email already exists\n" +
          "- Server error\n" +
          "- Database issue\n\n" +
          "Check debug logs for details.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h2>Register</h2>

        <input
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <input
          type="email"
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
          {loading ? "Creating account..." : "Register"}
        </button>

        <p className="auth-link">
          Already have an account?{" "}
          <Link to="/login">Back to Login</Link>
        </p>
      </form>
    </div>
  );
}
