import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Register.css";

// =====================================================
// SETTINGS
// =====================================================

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const BRANCHES = [
  { value: "CSE", label: "CSE · Computer Science" },
  { value: "ISE", label: "ISE · Information Science" },
  { value: "ECE", label: "ECE · Electronics & Communication" },
  { value: "EEE", label: "EEE · Electrical & Electronics" },
  { value: "ME", label: "ME · Mechanical" },
  { value: "CV", label: "CV · Civil" },
];

const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

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

// Returns a score from 0 to 4 and a label
function getStrength(password) {
  if (!password) return { score: 0, label: "" };

  let points = 0;

  if (password.length >= 8) points++;
  if (password.length >= 12) points++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points++;
  if (/\d/.test(password)) points++;
  if (/[^A-Za-z0-9]/.test(password)) points++;

  // Anything shorter than 8 characters is always weak
  const score = password.length < 8 ? 1 : Math.min(Math.max(points - 1, 1), 4);

  const labels = ["", "Weak", "Fair", "Good", "Strong"];

  return { score, label: labels[score] };
}

// =====================================================
// COMPONENT
// =====================================================

function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    branch: "CSE",
    semester: 4,
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [error, setError] = useState("");
  const [errorKey, setErrorKey] = useState(0);

  const [capsLock, setCapsLock] = useState(false);
  const [emailHint, setEmailHint] = useState("");

  const redirectTimer = useRef(null);

  // Stop the redirect timer if the page is closed early
  useEffect(() => {
    return () => {
      if (redirectTimer.current) {
        clearTimeout(redirectTimer.current);
      }
    };
  }, []);

  const strength = getStrength(formData.password);

  const passwordsMatch =
    confirmPassword.length > 0 && formData.password === confirmPassword;

  const passwordsDiffer =
    confirmPassword.length > 0 && formData.password !== confirmPassword;

  // -----------------------------------------------
  // HELPERS
  // -----------------------------------------------

  // The key changes each time so the shake animation replays
  const showError = (message) => {
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

  const validate = () => {
    const name = formData.name.trim();
    const email = formData.email.trim();
    const password = formData.password;

    if (name.length < 2) {
      return "Please enter your full name (at least 2 characters).";
    }

    if (!EMAIL_PATTERN.test(email)) {
      return "Please enter a valid email address.";
    }

    if (password.length < 8) {
      return "Password must be at least 8 characters long.";
    }

    if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      return "Password must contain at least one letter and one number.";
    }

    if (password !== confirmPassword) {
      return "The two passwords do not match.";
    }

    return "";
  };

  // -----------------------------------------------
  // REGISTER
  // -----------------------------------------------

  const handleRegister = async (e) => {
    e.preventDefault();

    if (loading || success) return;

    const problem = validate();

    if (problem) {
      showError(problem);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const response = await API.post("/auth/register", {
        name: formData.name.trim(),
        email: formData.email.trim(),
        password: formData.password,
        branch: formData.branch,
        semester: Number(formData.semester),
      });

      if (response.data?.success) {
        setSuccess(true);

        redirectTimer.current = setTimeout(() => {
          navigate("/");
        }, 2000);
      } else {
        showError(
          response.data?.message ||
            "Registration failed. Please try again."
        );
      }
    } catch (err) {
      if (err.response) {
        showError(
          err.response.data?.message ||
            "Registration failed. Please try again."
        );
      } else {
        showError(
          "Cannot connect to the server. Make sure the backend is running."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // -----------------------------------------------
  // PAGE
  // -----------------------------------------------

  return (
    <div className="reg-page">

      {/* BACKGROUND EFFECTS */}
      <div className="reg-glow reg-glow-one"></div>
      <div className="reg-glow reg-glow-two"></div>
      <div className="reg-glow reg-glow-three"></div>

      {/* NAVBAR */}
      <nav className="reg-nav">

        <div className="reg-logo">
          <div className="reg-logo-icon">🎓</div>

          <div>
            <h1>VTU AI</h1>
            <span>Study Assistant</span>
          </div>
        </div>

        <button
          type="button"
          className="reg-nav-link"
          onClick={() => navigate("/")}
        >
          Sign in →
        </button>

      </nav>


      <main className="reg-main">

        {/* LEFT */}
        <section className="reg-intro">

          <div className="reg-tag">
            <span>✦</span>
            FREE FOR VTU STUDENTS
          </div>

          <h2>
            Start studying
            <br />

            <span>smarter today.</span>
          </h2>

          <p>
            Create your account in under a minute and get your
            own AI study assistant.
          </p>

          <div className="reg-benefits">

            <div className="reg-benefit">
              <div className="reg-benefit-icon">📄</div>

              <div>
                <strong>Upload your notes</strong>
                <small>Ask questions from your own PDFs</small>
              </div>
            </div>

            <div className="reg-benefit">
              <div className="reg-benefit-icon">📚</div>

              <div>
                <strong>Previous paper analysis</strong>
                <small>Find repeated and important questions</small>
              </div>
            </div>

            <div className="reg-benefit">
              <div className="reg-benefit-icon">🧠</div>

              <div>
                <strong>Quizzes on demand</strong>
                <small>Practice before the exam</small>
              </div>
            </div>

          </div>

        </section>


        {/* FORM */}
        <section className="reg-section">

          <div className="reg-box">

            {success ? (

              <div className="reg-success">

                <div className="reg-success-icon">✓</div>

                <h3>Account created!</h3>

                <p>
                  Welcome to VTU AI, {formData.name.trim()}.
                  Taking you to the sign-in page...
                </p>

                <button
                  type="button"
                  className="reg-submit"
                  onClick={() => navigate("/")}
                >
                  <span>Go to sign in</span>
                  <span className="reg-arrow">→</span>
                </button>

              </div>

            ) : (

              <>
                <div className="reg-top">

                  <div className="reg-mini-logo">✨</div>

                  <div>
                    <span className="reg-small">GET STARTED</span>
                    <h3>Create account</h3>
                  </div>

                </div>

                <p className="reg-message">
                  Join thousands of students preparing smarter.
                </p>


                <form onSubmit={handleRegister} noValidate>

                  {/* NAME */}

                  <div className="reg-field">

                    <label htmlFor="reg-name">Full name</label>

                    <div className="reg-input-box">
                      <span>👤</span>

                      <input
                        id="reg-name"
                        type="text"
                        name="name"
                        placeholder="Your full name"
                        value={formData.name}
                        onChange={handleChange}
                        autoComplete="name"
                        maxLength={60}
                        disabled={loading}
                      />
                    </div>

                  </div>


                  {/* EMAIL */}

                  <div className="reg-field">

                    <label htmlFor="reg-email">Email address</label>

                    <div className="reg-input-box">
                      <span>✉</span>

                      <input
                        id="reg-email"
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
                      <div className="reg-hint">
                        Did you mean{" "}
                        <button type="button" onClick={applyEmailHint}>
                          {emailHint}
                        </button>
                        ?
                      </div>
                    )}

                  </div>


                  {/* BRANCH + SEMESTER */}

                  <div className="reg-row">

                    <div className="reg-field">

                      <label htmlFor="reg-branch">Branch</label>

                      <div className="reg-input-box">
                        <select
                          id="reg-branch"
                          name="branch"
                          value={formData.branch}
                          onChange={handleChange}
                          disabled={loading}
                        >
                          {BRANCHES.map((branch) => (
                            <option key={branch.value} value={branch.value}>
                              {branch.label}
                            </option>
                          ))}
                        </select>
                      </div>

                    </div>

                    <div className="reg-field reg-field-small">

                      <label htmlFor="reg-semester">Semester</label>

                      <div className="reg-input-box">
                        <select
                          id="reg-semester"
                          name="semester"
                          value={formData.semester}
                          onChange={handleChange}
                          disabled={loading}
                        >
                          {SEMESTERS.map((number) => (
                            <option key={number} value={number}>
                              Sem {number}
                            </option>
                          ))}
                        </select>
                      </div>

                    </div>

                  </div>


                  {/* PASSWORD */}

                  <div className="reg-field">

                    <label htmlFor="reg-password">Password</label>

                    <div className="reg-input-box">
                      <span>🔒</span>

                      <input
                        id="reg-password"
                        type={showPassword ? "text" : "password"}
                        name="password"
                        placeholder="At least 8 characters"
                        value={formData.password}
                        onChange={handleChange}
                        onKeyDown={handlePasswordKey}
                        onKeyUp={handlePasswordKey}
                        onBlur={() => setCapsLock(false)}
                        autoComplete="new-password"
                        disabled={loading}
                      />

                      <button
                        type="button"
                        className="reg-eye"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword ? "Hide passwords" : "Show passwords"
                        }
                      >
                        {showPassword ? "🙈" : "👁"}
                      </button>
                    </div>

                    {capsLock && (
                      <div className="reg-caps">⚠ Caps Lock is on</div>
                    )}

                    {formData.password && (
                      <div className="reg-strength">

                        <div className="reg-strength-bars">
                          {[1, 2, 3, 4].map((level) => (
                            <span
                              key={level}
                              className={
                                level <= strength.score
                                  ? `reg-bar reg-bar-on reg-level-${strength.score}`
                                  : "reg-bar"
                              }
                            ></span>
                          ))}
                        </div>

                        <small className={`reg-strength-text reg-level-${strength.score}`}>
                          {strength.label}
                        </small>

                      </div>
                    )}

                  </div>


                  {/* CONFIRM PASSWORD */}

                  <div className="reg-field">

                    <label htmlFor="reg-confirm">Confirm password</label>

                    <div
                      className={
                        passwordsDiffer
                          ? "reg-input-box reg-input-bad"
                          : passwordsMatch
                          ? "reg-input-box reg-input-good"
                          : "reg-input-box"
                      }
                    >
                      <span>🔑</span>

                      <input
                        id="reg-confirm"
                        type={showPassword ? "text" : "password"}
                        placeholder="Type the password again"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setError("");
                        }}
                        autoComplete="new-password"
                        disabled={loading}
                      />
                    </div>

                    {passwordsMatch && (
                      <div className="reg-match reg-match-good">
                        ✓ Passwords match
                      </div>
                    )}

                    {passwordsDiffer && (
                      <div className="reg-match reg-match-bad">
                        ✕ Passwords do not match yet
                      </div>
                    )}

                  </div>


                  {/* ERROR */}

                  {error && (
                    <div key={errorKey} className="reg-error" role="alert">
                      <span>!</span>
                      {error}
                    </div>
                  )}


                  {/* SUBMIT */}

                  <button
                    type="submit"
                    className="reg-submit"
                    disabled={loading}
                  >
                    {loading && <span className="reg-spinner"></span>}

                    <span>
                      {loading ? "Creating account..." : "Create account"}
                    </span>

                    {!loading && <span className="reg-arrow">→</span>}
                  </button>

                </form>


                <div className="reg-login-row">
                  <p>Already have an account?</p>

                  <button type="button" onClick={() => navigate("/")}>
                    Sign in
                  </button>
                </div>

                <div className="reg-secure">
                  <span>🔐</span>
                  <p>Your password is never shown or stored in the browser</p>
                </div>
              </>

            )}

          </div>

        </section>

      </main>

    </div>
  );
}

export default Register;