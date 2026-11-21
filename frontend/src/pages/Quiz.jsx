import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Quiz.css";

const DIFFICULTIES = ["Easy", "Medium", "Hard", "Mixed"];
const MODULES = [1, 2, 3, 4, 5].map((n) => `Module ${n}`);
const SUBJECT_IDEAS = [
  "DBMS",
  "Operating System",
  "Computer Networks",
  "Data Structures",
  "DAA",
  "Machine Learning",
];
const LETTERS = ["A", "B", "C", "D"];

const formatTime = (seconds) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60
  ).padStart(2, "0")}`;

function Quiz() {
  const navigate = useNavigate();

  // ---------- settings ----------
  const [subject, setSubject] = useState("DBMS");
  const [module, setModule] = useState("Module 1");
  const [count, setCount] = useState("10");
  const [difficulty, setDifficulty] = useState("Mixed");
  const [timerOn, setTimerOn] = useState(false);
  const [minutes, setMinutes] = useState("15");

  // ---------- quiz ----------
  const [phase, setPhase] = useState("setup"); // setup | quiz | result
  const [quiz, setQuiz] = useState([]);
  const [answers, setAnswers] = useState({});
  const [flagged, setFlagged] = useState({});
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [activeMinutes, setActiveMinutes] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [timeUsed, setTimeUsed] = useState(0);

  // ---------- ui ----------
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showExplain, setShowExplain] = useState(true);
  const [filter, setFilter] = useState("all");

  const endAtRef = useRef(0);
  const startedAtRef = useRef(0);
  const finishRef = useRef(() => {});

  const answeredCount = Object.keys(answers).length;

  // ---------- finish ----------
  const finish = (automatic = false) => {
    if (phase !== "quiz" || quiz.length === 0) return;

    const total = quiz.filter((q, i) => answers[i] === q.answer).length;

    setScore(total);
    setTimeUsed(Math.round((Date.now() - startedAtRef.current) / 1000));
        API.post("/quiz-results", {
      subject: subject.trim(),
      module,
      difficulty,
      totalQuestions: quiz.length,
      score: total,
      timeTaken: Math.round((Date.now() - startedAtRef.current) / 1000),
    }).catch((err) => console.error("Could not save quiz result:", err));
    setNotice(
      automatic ? "Time is up! Your quiz was submitted automatically." : ""
    );
    setFilter("all");
    setPhase("result");

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // always points at the latest finish()
  useEffect(() => {
    finishRef.current = finish;
  });

  // ---------- timer ----------
  useEffect(() => {
    if (phase !== "quiz" || !activeMinutes) return undefined;

    const id = setInterval(() => {
      const left = Math.max(
        0,
        Math.round((endAtRef.current - Date.now()) / 1000)
      );

      setTimeLeft(left);

      if (left <= 0) {
        clearInterval(id);
        finishRef.current(true);
      }
    }, 500);

    return () => clearInterval(id);
  }, [phase, activeMinutes]);

  // ---------- keyboard ----------
  useEffect(() => {
    if (phase !== "quiz") return undefined;

    const onKey = (event) => {
      const tag = event.target.tagName;

      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

      if (event.key === "ArrowRight") {
        setCurrent((value) => Math.min(value + 1, quiz.length - 1));
      } else if (event.key === "ArrowLeft") {
        setCurrent((value) => Math.max(value - 1, 0));
      } else if (/^[1-4]$/.test(event.key)) {
        setAnswers((previous) => ({
          ...previous,
          [current]: Number(event.key) - 1,
        }));
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [phase, current, quiz.length]);

  // ---------- start ----------
  const startQuiz = (list, mins) => {
    setQuiz(list);
    setAnswers({});
    setFlagged({});
    setCurrent(0);
    setScore(0);
    setNotice("");
    setError("");
    setActiveMinutes(mins);

    startedAtRef.current = Date.now();

    if (mins) {
      endAtRef.current = Date.now() + mins * 60000;
      setTimeLeft(mins * 60);
    } else {
      setTimeLeft(0);
    }

    setPhase("quiz");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const generate = async () => {
    setError("");

    if (!subject.trim()) {
      setError("Please enter a subject name.");
      return;
    }

    const total = Number(count);

    if (!Number.isInteger(total) || total < 1 || total > 50) {
      setError("Please enter a whole number of questions between 1 and 50.");
      return;
    }

    const mins = Number(minutes);

    if (timerOn && (!Number.isInteger(mins) || mins < 1 || mins > 180)) {
      setError("Choose a whole-number timer between 1 and 180 minutes.");
      return;
    }

    if (!localStorage.getItem("token")) {
      navigate("/login");
      return;
    }

    try {
      setLoading(true);

      const response = await API.post("/ai/quiz", {
        subject: subject.trim(),
        module,
        numberOfQuestions: total,
        difficulty,
        timerMinutes: timerOn ? mins : null,
      });

      const generated = response.data?.quiz;

      if (
        response.data?.success &&
        Array.isArray(generated) &&
        generated.length > 0
      ) {
        startQuiz(generated, timerOn ? mins : null);
      } else {
        setError(
          response.data?.message ||
            "No questions were generated. Please try again."
        );
      }
    } catch (err) {
      console.error("Quiz generation error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to generate the quiz. Check your backend and Gemini API."
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------- actions ----------
  const selectAnswer = (optionIndex) => {
    setAnswers((previous) => ({ ...previous, [current]: optionIndex }));
  };

  const toggleFlag = () => {
    setFlagged((previous) => ({ ...previous, [current]: !previous[current] }));
  };

  const submit = () => {
    const missing = quiz.length - answeredCount;

    if (
      missing > 0 &&
      !window.confirm(`You have ${missing} unanswered question(s). Submit anyway?`)
    ) {
      return;
    }

    finish(false);
  };

  const retakeAll = () => startQuiz(quiz, activeMinutes);

  const retryWrong = () => {
    const wrong = quiz.filter((q, i) => answers[i] !== q.answer);

    if (wrong.length > 0) startQuiz(wrong, activeMinutes);
  };

  const newQuiz = () => {
    setPhase("setup");
    setQuiz([]);
    setAnswers({});
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ---------- numbers ----------
  const total = quiz.length;
  const wrongCount = quiz.filter(
    (q, i) => answers[i] !== undefined && answers[i] !== q.answer
  ).length;
  const skippedCount = total - answeredCount;
  const percentage = total ? Math.round((score / total) * 100) : 0;

  const grade =
    percentage === 100
      ? "Perfect score! Outstanding!"
      : percentage >= 80
      ? "Excellent work. Keep it up!"
      : percentage >= 60
      ? "Good job. A little more practice will help."
      : percentage >= 40
      ? "Fair attempt. Revise the weak topics."
      : "Review the concepts and practise more.";

  const reviewItems = quiz
    .map((q, i) => {
      const status =
        answers[i] === undefined
          ? "skipped"
          : answers[i] === q.answer
          ? "correct"
          : "wrong";

      return { q, i, status };
    })
    .filter((item) => filter === "all" || item.status === filter);

  const question = quiz[current];

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="qz-page">
      {/* ================= SETUP ================= */}
      {phase === "setup" && (
        <>
          <section className="qz-hero">
            <div className="qz-hero-icon">📝</div>

            <div>
              <p className="qz-eyebrow">PRACTICE MODE</p>
              <h1>Generate Quiz</h1>
              <p className="qz-sub">
                Practice any subject with AI-generated questions and test your
                exam preparation.
              </p>
            </div>
          </section>

          <section className="qz-card">
            <label className="qz-label" htmlFor="qz-subject">
              Subject name
            </label>

            <input
              id="qz-subject"
              className="qz-input"
              type="text"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="e.g. DBMS, AI, Machine Learning"
              disabled={loading}
            />

            <div className="qz-chips">
              {SUBJECT_IDEAS.map((name) => (
                <button
                  type="button"
                  key={name}
                  className="qz-chip"
                  onClick={() => setSubject(name)}
                >
                  {name}
                </button>
              ))}
            </div>

            <label className="qz-label">Module</label>

            <div className="qz-seg">
              {MODULES.map((name) => (
                <button
                  type="button"
                  key={name}
                  className={module === name ? "qz-on" : ""}
                  onClick={() => setModule(name)}
                  disabled={loading}
                >
                  {name}
                </button>
              ))}
            </div>

            <label className="qz-label">Difficulty</label>

            <div className="qz-seg">
              {DIFFICULTIES.map((name) => (
                <button
                  type="button"
                  key={name}
                  className={difficulty === name ? "qz-on" : ""}
                  onClick={() => setDifficulty(name)}
                  disabled={loading}
                >
                  {name}
                </button>
              ))}
            </div>

            <label className="qz-label" htmlFor="qz-count">
              Number of questions (1 to 50)
            </label>

            <div className="qz-count-row">
              <input
                id="qz-count"
                className="qz-input qz-count"
                type="number"
                min="1"
                max="50"
                value={count}
                onChange={(event) => setCount(event.target.value)}
                disabled={loading}
              />

              {[5, 10, 20, 30].map((n) => (
                <button
                  type="button"
                  key={n}
                  className="qz-chip"
                  onClick={() => setCount(String(n))}
                >
                  {n}
                </button>
              ))}
            </div>

            <div className="qz-timer-box">
              <label className="qz-switch">
                <input
                  type="checkbox"
                  checked={timerOn}
                  onChange={(event) => setTimerOn(event.target.checked)}
                  disabled={loading}
                />
                <span>⏱️ Enable quiz timer</span>
              </label>

              {timerOn && (
                <div className="qz-minutes">
                  <input
                    className="qz-input"
                    type="number"
                    min="1"
                    max="180"
                    value={minutes}
                    onChange={(event) => setMinutes(event.target.value)}
                  />
                  <span>minutes (auto-submits when time is up)</span>
                </div>
              )}
            </div>

            {error && <div className="qz-error">❌ {error}</div>}

            <button
              type="button"
              className="qz-primary"
              onClick={generate}
              disabled={loading}
            >
              {loading ? "⏳ Generating your quiz..." : "🚀 Generate Quiz"}
            </button>

            {loading && (
              <div className="qz-loading">
                <div className="qz-spinner" />
                <p>The AI is writing your questions. This can take a moment.</p>
              </div>
            )}
          </section>
        </>
      )}

      {/* ================= QUIZ ================= */}
      {phase === "quiz" && question && (
        <>
          <div className="qz-top">
            <div className="qz-top-info">
              <strong>{subject}</strong>
              <span>
                {module} · {difficulty}
              </span>
            </div>

            <div className="qz-top-progress">
              <div className="qz-bar">
                <div style={{ width: `${(answeredCount / total) * 100}%` }} />
              </div>

              <small>
                {answeredCount} of {total} answered
              </small>
            </div>

            {activeMinutes ? (
              <div className={`qz-timer ${timeLeft <= 60 ? "qz-timer-warn" : ""}`}>
                ⏱ {formatTime(timeLeft)}
              </div>
            ) : (
              <div className="qz-timer qz-timer-off">No timer</div>
            )}
          </div>

          <div className="qz-layout">
            <section className="qz-card qz-question">
              <div className="qz-q-head">
                <span className="qz-q-count">
                  Question {current + 1} of {total}
                </span>

                <button
                  type="button"
                  className={`qz-flag ${flagged[current] ? "qz-flag-on" : ""}`}
                  onClick={toggleFlag}
                >
                  {flagged[current] ? "🚩 Flagged" : "⚑ Flag for review"}
                </button>
              </div>

              <h2 className="qz-q-text">{question.question}</h2>

              <div className="qz-options">
                {question.options.map((option, index) => (
                  <button
                    type="button"
                    key={index}
                    className={`qz-option ${
                      answers[current] === index ? "qz-option-on" : ""
                    }`}
                    onClick={() => selectAnswer(index)}
                  >
                    <span className="qz-letter">{LETTERS[index]}</span>
                    <span className="qz-option-text">{option}</span>
                  </button>
                ))}
              </div>

              <p className="qz-hint">
                Tip: press 1–4 to choose an answer and ← → to move.
              </p>

              <div className="qz-nav">
                <button
                  type="button"
                  className="qz-secondary"
                  onClick={() => setCurrent(current - 1)}
                  disabled={current === 0}
                >
                  ← Previous
                </button>

                {current < total - 1 ? (
                  <button
                    type="button"
                    className="qz-primary qz-next"
                    onClick={() => setCurrent(current + 1)}
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    type="button"
                    className="qz-primary qz-next"
                    onClick={submit}
                  >
                    ✅ Submit Quiz
                  </button>
                )}
              </div>
            </section>

            <aside className="qz-card qz-palette">
              <h3>Question map</h3>

              <div className="qz-grid">
                {quiz.map((item, index) => (
                  <button
                    type="button"
                    key={index}
                    className={[
                      "qz-dot",
                      answers[index] !== undefined ? "qz-dot-done" : "",
                      flagged[index] ? "qz-dot-flag" : "",
                      index === current ? "qz-dot-now" : "",
                    ].join(" ")}
                    onClick={() => setCurrent(index)}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <div className="qz-legend">
                <span><i className="qz-l-done" /> Answered</span>
                <span><i className="qz-l-flag" /> Flagged</span>
                <span><i className="qz-l-now" /> Current</span>
              </div>

              <button type="button" className="qz-primary" onClick={submit}>
                ✅ Submit Quiz
              </button>
            </aside>
          </div>
        </>
      )}

      {/* ================= RESULT ================= */}
      {phase === "result" && (
        <>
          <section className="qz-card qz-score">
            {notice && <div className="qz-notice">{notice}</div>}

            <div className="qz-ring" style={{ "--pct": percentage }}>
              <div className="qz-ring-in">
                <strong>{percentage}%</strong>
                <span>
                  {score}/{total}
                </span>
              </div>
            </div>

            <h2>
              {percentage >= 80 ? "🏆" : percentage >= 50 ? "👏" : "📚"} {grade}
            </h2>

            <div className="qz-stats">
              <div className="qz-stat-good"><strong>{score}</strong><span>Correct</span></div>
              <div className="qz-stat-bad"><strong>{wrongCount}</strong><span>Wrong</span></div>
              <div className="qz-stat-skip"><strong>{skippedCount}</strong><span>Skipped</span></div>
              <div><strong>{formatTime(timeUsed)}</strong><span>Time taken</span></div>
            </div>

            <div className="qz-actions">
              <button type="button" className="qz-primary" onClick={retakeAll}>
                🔄 Retake Quiz
              </button>

              <button
                type="button"
                className="qz-secondary"
                onClick={retryWrong}
                disabled={score === total}
              >
                🎯 Practice wrong answers
              </button>

              <button type="button" className="qz-secondary" onClick={newQuiz}>
                ➕ New Quiz
              </button>

              <button
                type="button"
                className="qz-secondary"
                onClick={() => navigate("/dashboard")}
              >
                🏠 Dashboard
              </button>
            </div>
          </section>

          <section className="qz-card">
            <div className="qz-review-head">
              <h2>Review answers</h2>

              <div className="qz-seg qz-seg-small">
                {[
                  ["all", "All"],
                  ["wrong", "Wrong"],
                  ["skipped", "Skipped"],
                  ["correct", "Correct"],
                ].map(([value, label]) => (
                  <button
                    type="button"
                    key={value}
                    className={filter === value ? "qz-on" : ""}
                    onClick={() => setFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <label className="qz-switch">
              <input
                type="checkbox"
                checked={showExplain}
                onChange={(event) => setShowExplain(event.target.checked)}
              />
              <span>Show correct answers and explanations</span>
            </label>

            {reviewItems.length === 0 && (
              <p className="qz-empty">Nothing to show in this filter.</p>
            )}

            {reviewItems.map(({ q, i, status }) => (
              <div className={`qz-review qz-review-${status}`} key={i}>
                <div className="qz-review-top">
                  <span className="qz-q-count">Question {i + 1}</span>

                  <span className={`qz-tag qz-tag-${status}`}>
                    {status === "correct"
                      ? "✓ Correct"
                      : status === "wrong"
                      ? "✕ Wrong"
                      : "– Skipped"}
                  </span>
                </div>

                <h3>{q.question}</h3>

                <div className="qz-options">
                  {q.options.map((option, index) => {
                    const isCorrect = showExplain && index === q.answer;
                    const isWrongPick = answers[i] === index && index !== q.answer;
                    const isPick = answers[i] === index;

                    return (
                      <div
                        key={index}
                        className={[
                          "qz-option qz-option-static",
                          isCorrect ? "qz-option-correct" : "",
                          isWrongPick ? "qz-option-wrong" : "",
                          isPick && !isWrongPick && !isCorrect ? "qz-option-on" : "",
                        ].join(" ")}
                      >
                        <span className="qz-letter">{LETTERS[index]}</span>
                        <span className="qz-option-text">{option}</span>
                        {isPick && <small>Your answer</small>}
                      </div>
                    );
                  })}
                </div>

                {showExplain && q.explanation && (
                  <div className="qz-explain">
                    <strong>💡 Explanation</strong>
                    <p>{q.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </section>
        </>
      )}
    </div>
  );
}

export default Quiz;