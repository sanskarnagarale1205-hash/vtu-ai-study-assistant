import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });

    setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await axios.post(
        "http://localhost:5000/api/auth/login",
        formData
      );

      console.log("Login successful:", response.data);

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }

      if (response.data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(response.data.user)
        );
      }

      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);

      setError(
        err.response?.data?.message ||
          "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modern-login">

      {/* BACKGROUND EFFECTS */}
      <div className="glow glow-one"></div>
      <div className="glow glow-two"></div>
      <div className="glow glow-three"></div>

      {/* NAVBAR */}
      <nav className="login-nav">

        <div className="nav-logo">
          <div className="nav-icon">🎓</div>

          <div>
            <h1>VTU AI</h1>
            <span>Study Assistant</span>
          </div>
        </div>

        <div className="nav-status">
          <span className="status-dot"></span>
          AI System Online
        </div>

      </nav>


      {/* MAIN */}
      <main className="login-main">

        {/* LEFT */}
        <section className="intro-section">

          <div className="intro-tag">
            <span>✦</span>
            SMART LEARNING PLATFORM
          </div>

          <h2>
            Your exams.
            <br />

            <span>Your way.</span>
          </h2>

          <p>
            An intelligent study companion designed
            specifically for VTU CSE students.
          </p>


          <div className="feature-list">

            <div className="feature-item">
              <div className="feature-number">01</div>

              <div>
                <strong>AI Powered</strong>
                <small>
                  Understand complex topics easily
                </small>
              </div>
            </div>


            <div className="feature-item">
              <div className="feature-number">02</div>

              <div>
                <strong>Exam Focused</strong>
                <small>
                  Prepare with VTU-oriented content
                </small>
              </div>
            </div>


            <div className="feature-item">
              <div className="feature-number">03</div>

              <div>
                <strong>Smart Practice</strong>
                <small>
                  Quizzes, papers and important questions
                </small>
              </div>
            </div>

          </div>


          <div className="made-by">
            <span>Built with</span>
            <b>♥</b>
            <span>for VTU students</span>
          </div>

        </section>


        {/* LOGIN */}
        <section className="login-section">

          <div className="login-box">

            <div className="login-top">

              <div className="mini-logo">
                🤖
              </div>

              <div>
                <span className="login-small">
                  WELCOME BACK
                </span>

                <h3>
                  Sign in
                </h3>
              </div>

            </div>


            <p className="login-message">
              Continue your journey with AI-powered
              learning.
            </p>


            <form onSubmit={handleLogin}>

              {/* EMAIL */}

              <div className="field">

                <label>Email address</label>

                <div className="field-box">

                  <span>✉</span>

                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />

                </div>

              </div>


              {/* PASSWORD */}

              <div className="field">

                <div className="password-header">

                  <label>Password</label>

                  <button
                    type="button"
                    onClick={() =>
                      alert(
                        "Password reset feature coming soon."
                      )
                    }
                  >
                    Forgot?
                  </button>

                </div>


                <div className="field-box">

                  <span>⌕</span>

                  <input
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="current-password"
                  />

                  <button
                    type="button"
                    className="show-password"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>

                </div>

              </div>


              {/* ERROR */}

              {error && (
                <div className="error-message">
                  <span>!</span>
                  {error}
                </div>
              )}


              {/* LOGIN */}

              <button
                type="submit"
                className="signin-btn"
                disabled={loading}
              >

                <span>
                  {loading
                    ? "Authenticating..."
                    : "Sign in"}
                </span>

                {!loading && (
                  <span className="btn-arrow">
                    →
                  </span>
                )}

              </button>

            </form>


            {/* DIVIDER */}

            <div className="divider">
              <span></span>
              <small>OR</small>
              <span></span>
            </div>


            {/* REGISTER */}

            <div className="register-area">

              <p>
                New to VTU AI?
              </p>

              <button
                onClick={() =>
                  navigate("/register")
                }
              >
                Create your account
                <span>→</span>
              </button>

            </div>


            {/* SECURITY */}

            <div className="secure">

              <span>🔐</span>

              <p>
                Secure authentication
              </p>

            </div>

          </div>


          {/* DEVELOPER */}

          <div className="developer-credit">

            <span>Developed by</span>

            <strong>
              Sanskar Nagarale
            </strong>

            <span className="developer-dot">
              •
            </span>

            <span>© 2026</span>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Login;