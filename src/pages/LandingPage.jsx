import { Link } from "react-router-dom";
import { getUser } from "../utils/auth";
import Navbar from "../components/Navbar";
import "../styles/landing.css";

export default function LandingPage() {
  const user = getUser();

  return (
    <div className="landing-page">
      <Navbar />
      
      <div className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">
            Modern Exam Management System
          </h1>
          <p className="hero-subtitle">
            Create, manage, and take exams with AI-powered question generation
          </p>
          
          <div className="hero-actions">
            {user ? (
              <Link to={`/${user.role}`} className="btn btn-primary">
                Go to Dashboard
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn btn-primary">
                  Get Started
                </Link>
                <Link to="/login" className="btn btn-secondary">
                  Login
                </Link>
              </>
            )}
          </div>
        </div>
        
        <div className="hero-image">
            {/* placeholder pics */}
        </div>
      </div>
      
      <div className="features-section">
        <h2 className="section-title">Key Features</h2>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">👨‍💼</div>
            <h3>Admin Control</h3>
            <p>Complete user and exam management with full CRUD operations</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">👨‍🏫</div>
            <h3>Examiner Tools</h3>
            <p>Create exams manually or with AI, manage visibility and view results</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">👨‍🎓</div>
            <h3>Student Portal</h3>
            <p>Take exams, view results, and track your progress over time</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon">🤖</div>
            <h3>AI Generation</h3>
            <p>Generate exam questions automatically using advanced AI technology</p>
          </div>
        </div>
      </div>
    </div>
  );
}