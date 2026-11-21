import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Login.css";

// =====================================================
// SETTINGS
// =====================================================

const API_URL = "http://localhost:5000/api/auth/login";

const MAX_ATTEMPTS = 5;
const LOCK_SECONDS = 30;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Common typing mistakes in email domains
const DOMAIN_FIXES = {
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gamil.com": "gmail.com",
  "gmaill.com": "gmail.com",
  "gmail.co": "gmail.com",
  "gmail.con": "gmail.com",
  "yaho.com": "yahoo.com",
  "yahho.com": "yahoo.com",
  "yahoo.con": "yahoo.com",
  "hotmial.com": "hotmail.com",
  "hotmail.con": "hotmail.com",
  "outlok.com": "outlook.com",
  "outlook.con": "outlook.com",
};

function suggestEmail(email) {
  const parts = email.trim().split("@");

  if (parts.length !== 2) return "";

  const fixedDomain = DOMAIN_FIXES[parts[1].toLowerCase()];

  return fixedDomain ? `${parts[0]}@${fixedDomain}` : "";
}

// localStorage can fail in private windows, so every use is wrapped.
function safeGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

function safeRemove(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

function readLock() {
  try {
    const saved = JSON.parse(safeGet("loginLock") || "{}");

    return {
      attempts: Number(saved.attempts) || 0,
      lockedUntil: Number(saved.lockedUntil) || 0,
    };
  } catch {
    return { attempts: 0, lockedUntil: 0 };
  }
}

// =====================================================
// COMPONENT
// =====================================================

function Login() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(() => ({
    email: safeGet("rememberedEmail") || "",
    password: "",
  }));

  const [rememberEmail, setRememberEmail] = useState(() =>
    Boolean(safeGet("rememberedEmail"))
  );

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");
  const [errorKey, setErrorKey] = useState(0);
  const [info, setInfo] = useState("");

  const [capsLock, setCapsLock] = useState(false);
  const [emailHint, setEmailHint] = useState("");

  const [lock, setLock] = useState(readLock);
  const [now, setNow] = useState(() => Date.now());

  // -----------------------------------------------
  // LOCKOUT AFTER TOO MANY FAILED LOGINS
  // -----------------------------------------------

  const secondsLeft = Math.max(
    0,
    Math.ceil((lock.lockedUntil - now) / 1000)
  );

  const isLocked = secondsLeft > 0;

  const saveLock = (nextLock) => {
    setLock(nextLock);
    safeSet("loginLock", JSON.stringify(nextLock));
  };

  // Tick every half second while locked
  useEffect(() => {
    if (!isLocked) return undefined;

    const timer = setInterval(() => setNow(Date.now()), 500);

    return () => clearInterval(timer);
  }, [isLocked]);

  // Unlock and reset the counter when the time is over
    // Unlock and reset the counter when the time is over
  useEffect(() => {
    if (lock.lockedUntil && now >= lock.lockedUntil) {
      const freshLock = { attempts: 0, lockedUntil: 0 };

      setLock(freshLock);
      safeSet("loginLock", JSON.stringify(freshLock));
    }
  }, [now, lock.lockedUntil]);

  // -----------------------------------------------
  // HELPERS
  // -----------------------------------------------

  // The key changes each time so the shake animation replays
  const showError = (message) => {
    setInfo("");
    setError(message);
    setErrorKey((key) => key + 1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setInfo("");

    if (name === "email") {
      setEmailHint("");
    }
  };

  const handleEmailBlur = () => {
    setEmailHint(suggestEmail(formData.email));
  };

  const applyEmailHint = () => {
    setFormData((previous) => ({ ...previous, email: emailHint }));
    setEmailHint("");
  };

  const handlePasswordKey = (e) => {
    if (e.getModifierState) {
      setCapsLock(e.getModifierState("CapsLock"));
    }
  };

  // -----------------------------------------------
  // LOGIN
  // -----------------------------------------------

  const handleLogin = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (isLocked) {
      showError(
        `Too many failed attempts. Please wait ${secondsLeft} seconds.`
      );
      return;
    }

    const email = formData.email.trim();

    if (!email || !formData.password) {
      showError("Please enter your email and password.");
      return;
    }

    if (!EMAIL_PATTERN.test(email)) {
      showError("Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setInfo("");

      const response = await axios.post(
        API_URL,
        { email, password: formData.password },
        { timeout: 15000 }
      );

      if (response.data.token) {
        localStorage.setItem("token", response.data.token);
      }

      if (response.data.user) {
        localStorage.setItem(
          "user",
          JSON.stringify(response.data.user)
        );
      }

      // Remember the email only (never the password)
      if (rememberEmail) {
        safeSet("rememberedEmail", email);
      } else {
        safeRemove("rememberedEmail");
      }

      saveLock({ attempts: 0, lockedUntil: 0 });

      navigate("/dashboard");
    } catch (err) {
      const status = err.response?.status;

      let message;
      let countsAsFailure = false;

      if (status === 429) {
        message =
          err.response?.data?.message ||
          "Too many requests. Please wait a minute and try again.";
      } else if (err.response) {
        message =
          err.response?.data?.message ||
          "Invalid email or password.";

        countsAsFailure = [400, 401, 403].includes(status);
      } else if (err.code === "ECONNABORTED") {
        message =
          "The server took too long to respond. Please try again.";
      } else {
        message =
          "Cannot connect to the server. Make sure the backend is running.";
      }

      if (countsAsFailure) {
               const lockExpired =
          lock.lockedUntil > 0 && Date.now() >= lock.lockedUntil;

        const attempts = (lockExpired ? 0 : lock.attempts) + 1;

        if (attempts >= MAX_ATTEMPTS) {
          saveLock({
            attempts,
            lockedUntil: Date.now() + LOCK_SECONDS * 1000,
          });

          setNow(Date.now());

          message = `Too many failed attempts. Please wait ${LOCK_SECONDS} seconds.`;
        } else {
          saveLock({ attempts, lockedUntil: 0 });

          if (attempts >= 3) {
            message += ` (${MAX_ATTEMPTS - attempts} attempts left)`;
          }
        }
      }

      showError(message);
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------
  // PAGE
  // -----------------------------------------------

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


            <form onSubmit={handleLogin} noValidate>

              {/* EMAIL */}

              <div className="field">

                <label htmlFor="login-email">
                  Email address
                </label>

                <div className="field-box">

                  <span>✉</span>

                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    onBlur={handleEmailBlur}
                    autoComplete="email"
                    disabled={loading}
                  />

                </div>

                {emailHint && (
                  <div className="field-hint">
                    Did you mean{" "}
                    <button
                      type="button"
                      onClick={applyEmailHint}
                    >
                      {emailHint}
                    </button>
                    ?
                  </div>
                )}

              </div>


              {/* PASSWORD */}

              <div className="field">

                <div className="password-header">

                  <label htmlFor="login-password">
                    Password
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      setInfo(
                        "Password reset by email is not available yet."
                      )
                    }
                  >
                    Forgot?
                  </button>

                </div>


                <div className="field-box">

                  <span>🔒</span>

                  <input
                    id="login-password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    name="password"
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    onKeyDown={handlePasswordKey}
                    onKeyUp={handlePasswordKey}
                    onBlur={() => setCapsLock(false)}
                    autoComplete="current-password"
                    disabled={loading}
                  />

                  <button
                    type="button"
                    className="show-password"
                    onClick={() =>
                      setShowPassword(!showPassword)
                    }
                    aria-label={
                      showPassword
                        ? "Hide password"
                        : "Show password"
                    }
                  >
                    {showPassword ? "🙈" : "👁"}
                  </button>

                </div>

                {capsLock && (
                  <div className="caps-warning">
                    ⚠ Caps Lock is on
                  </div>
                )}

              </div>


              {/* REMEMBER EMAIL */}

              <label className="remember-row">
                <input
                  type="checkbox"
                  checked={rememberEmail}
                  onChange={(e) =>
                    setRememberEmail(e.target.checked)
                  }
                />

                <span>Remember my email</span>
              </label>


              {/* MESSAGES */}

              {error && (
                <div
                  key={errorKey}
                  className="error-message"
                  role="alert"
                >
                  <span>!</span>
                  {error}
                </div>
              )}

              {info && !error && (
                <div className="info-message" role="status">
                  <span>i</span>
                  {info}
                </div>
              )}


              {/* LOGIN */}

              <button
                type="submit"
                className="signin-btn"
                disabled={loading || isLocked}
              >

                {loading && <span className="btn-spinner"></span>}

                <span>
                  {loading
                    ? "Authenticating..."
                    : isLocked
                    ? `Locked · try again in ${secondsLeft}s`
                    : "Sign in"}
                </span>

                {!loading && !isLocked && (
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
                type="button"
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