import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import "./Dashboard.css";

const TOOLS = [
  { icon: "📄", title: "Upload Notes", text: "Upload VTU notes and get AI-powered explanations.", path: "/upload-notes", color: "blue" },
  { icon: "🤖", title: "AI Chat", text: "Ask questions and get instant AI explanations.", path: "/ai-chat", color: "purple" },
  { icon: "⭐", title: "Important Questions", text: "Generate module-wise important VTU questions.", path: "/important-questions", color: "orange" },
  { icon: "📝", title: "VTU Quiz", text: "Practice MCQs and test your exam preparation.", path: "/quiz", color: "green" },
  { icon: "📑", title: "Previous Papers", text: "Analyze previous-year papers and find repeated questions.", path: "/previous-paper", color: "pink" },
  { icon: "💾", title: "Saved Analyses", text: "View your previously saved AI paper analyses.", path: "/saved-analyses", color: "cyan" },
  { icon: "📅", title: "Study Plan", text: "Schedule study tasks and track your weekly goals.", path: "/study-plan", color: "green" },
];

const QUICK = [
  { icon: "🤖", title: "Ask AI", text: "Get instant answers", path: "/ai-chat" },
  { icon: "📝", title: "Take Quiz", text: "Test your knowledge", path: "/quiz" },
  { icon: "⭐", title: "Important Questions", text: "Prepare for exams", path: "/important-questions" },
  { icon: "📑", title: "Analyze Papers", text: "Find repeated questions", path: "/previous-paper" },
];

const STEPS = [
  { icon: "📤", title: "Upload", text: "Upload your VTU notes or previous-year papers." },
  { icon: "🧠", title: "AI Analysis", text: "Our AI reads and understands your study material." },
  { icon: "🎯", title: "Study Smart", text: "Get explanations, questions and quizzes." },
];

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null") || {};
  } catch {
    return {};
  }
};

const greeting = () => {
  const hour = new Date().getHours();

  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const formatDate = (date) =>
  date
    ? new Date(date).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "";

function Dashboard() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(null); // null = still loading
    const [quizResults, setQuizResults] = useState(null);

  const user = readUser();

  const fullName =
    user.name || user.username || user.fullName || user.fullname || "Student";

  const firstName = fullName.split(" ")[0];

    useEffect(() => {
    let active = true;

    API.get("/previous-papers/saved")
      .then((response) => {
        if (active) setSaved(response.data.analyses || []);
      })
      .catch(() => {
        if (active) setSaved([]);
      });

    API.get("/quiz-results")
      .then((response) => {
        if (active) setQuizResults(response.data.results || []);
      })
      .catch(() => {
        if (active) setQuizResults([]);
      });

    return () => {
      active = false;
    };
  }, []);

  const lastQuizzes = quizResults ? quizResults.slice(0, 10).reverse() : [];

  const averageScore =
    quizResults && quizResults.length
      ? Math.round(
          quizResults.reduce((sum, item) => sum + item.percentage, 0) /
            quizResults.length
        )
      : 0;

  const bestScore =
    quizResults && quizResults.length
      ? Math.max(...quizResults.map((item) => item.percentage))
      : 0;

  const analysesCount = saved === null ? "…" : saved.length;

  const papersCount =
    saved === null
      ? "…"
      : saved.reduce((total, item) => total + (item.totalFiles || 0), 0);

  const subjectsCount =
    saved === null
      ? "…"
      : new Set(saved.map((item) => (item.subject || "").toLowerCase())).size;

  const recent = saved ? saved.slice(0, 3) : [];

  return (
    <div className="db-page">
      {/* HERO */}
      <section className="db-hero">
        <div className="db-hero-text">
          <span className="db-badge">✨ AI POWERED LEARNING</span>

          <h2>
            {greeting()}, {firstName}! 👋
          </h2>

          <p>
            Your personal AI study companion for VTU exams. Understand
            difficult topics, prepare important questions and practice with
            smart quizzes.
          </p>

          <div className="db-hero-actions">
            <button
              type="button"
              className="db-btn-white"
              onClick={() => navigate("/ai-chat")}
            >
              🤖 Ask AI →
            </button>

            <button
              type="button"
              className="db-btn-ghost"
              onClick={() => navigate("/upload-notes")}
            >
              📤 Upload Notes
            </button>
          </div>
        </div>

        <div className="db-hero-visual" aria-hidden="true">
          <div className="db-orb">🤖</div>

          <div className="db-float db-float-1">
            <span>🧠</span>
            <div>
              <strong>AI Learning</strong>
              <small>Smart explanations</small>
            </div>
          </div>

          <div className="db-float db-float-2">
            <span>🎯</span>
            <div>
              <strong>VTU Focused</strong>
              <small>Exam preparation</small>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="db-stats">
        <div className="db-stat">
          <div className="db-stat-icon db-blue">📚</div>
          <div>
            <strong>{TOOLS.length}</strong>
            <span>Study tools</span>
          </div>
        </div>

        <div className="db-stat">
          <div className="db-stat-icon db-purple">💾</div>
          <div>
            <strong>{analysesCount}</strong>
            <span>Saved analyses</span>
          </div>
        </div>

        <div className="db-stat">
          <div className="db-stat-icon db-orange">📑</div>
          <div>
            <strong>{papersCount}</strong>
            <span>Papers analysed</span>
          </div>
        </div>

        <div className="db-stat">
          <div className="db-stat-icon db-green">🎯</div>
          <div>
            <strong>{subjectsCount}</strong>
            <span>Subjects covered</span>
          </div>
        </div>
      </section>

      {/* TOOLS */}
      <section className="db-section">
        <div className="db-heading">
          <div>
            <span>YOUR LEARNING HUB</span>
            <h2>Study Tools</h2>
          </div>

          <p>Everything you need for your VTU preparation.</p>
        </div>

        <div className="db-tools">
          {TOOLS.map((tool, index) => (
            <article
              className="db-tool"
              key={tool.title}
              onClick={() => navigate(tool.path)}
              role="link"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === "Enter") navigate(tool.path);
              }}
            >
              <div className="db-tool-top">
                <div className={`db-tool-icon db-${tool.color}`}>
                  {tool.icon}
                </div>

                <span className="db-tool-num">0{index + 1}</span>
              </div>

              <h3>{tool.title}</h3>
              <p>{tool.text}</p>

              <span className="db-tool-open">Open tool →</span>
            </article>
          ))}
        </div>
      </section>

      {/* RECENT + QUICK */}
      <section className="db-two">
        <div className="db-panel">
          <div className="db-panel-head">
            <h2>Recent analyses</h2>

            <button
              type="button"
              className="db-link"
              onClick={() => navigate("/saved-analyses")}
            >
              View all →
            </button>
          </div>

          {saved === null && <p className="db-muted">Loading...</p>}

          {saved !== null && recent.length === 0 && (
            <div className="db-empty">
              <span>📄</span>
              <p>No analyses yet.</p>

              <button
                type="button"
                className="db-btn-solid"
                onClick={() => navigate("/previous-paper")}
              >
                Analyze your first papers
              </button>
            </div>
          )}

          {recent.map((item) => (
            <button
              type="button"
              className="db-recent"
              key={item._id}
              onClick={() => navigate("/saved-analyses")}
            >
              <span className="db-recent-icon">📚</span>

              <div>
                <strong>{item.subject}</strong>
                <small>
                  {item.totalFiles || 0} papers · {formatDate(item.createdAt)}
                </small>
              </div>

              <b>→</b>
            </button>
          ))}
        </div>

        <div className="db-panel">
          <div className="db-panel-head">
            <h2>Quick actions</h2>
          </div>

          <div className="db-quick">
            {QUICK.map((item) => (
              <button
                type="button"
                key={item.title}
                className="db-quick-btn"
                onClick={() => navigate(item.path)}
              >
                <span>{item.icon}</span>

                <div>
                  <strong>{item.title}</strong>
                  <small>{item.text}</small>
                </div>

                <b>→</b>
              </button>
            ))}
          </div>
        </div>
      </section>
      {/* QUIZ PROGRESS */}
      <section className="db-section">
        <div className="db-heading">
          <div>
            <span>YOUR PROGRESS</span>
            <h2>Quiz Performance</h2>
          </div>

          <button
            type="button"
            className="db-link"
            onClick={() => navigate("/quiz")}
          >
            Take a quiz →
          </button>
        </div>

        {quizResults === null && <p className="db-muted">Loading...</p>}

        {quizResults !== null && quizResults.length === 0 && (
          <div className="db-panel db-empty">
            <span>📝</span>
            <p>No quizzes yet. Take your first quiz to see your progress here.</p>

            <button
              type="button"
              className="db-btn-solid"
              onClick={() => navigate("/quiz")}
            >
              Start a quiz
            </button>
          </div>
        )}

        {quizResults !== null && quizResults.length > 0 && (
          <div className="db-panel">
            <div className="db-quiz-stats">
              <div>
                <strong>{quizResults.length}</strong>
                <span>Quizzes taken</span>
              </div>

              <div>
                <strong>{averageScore}%</strong>
                <span>Average score</span>
              </div>

              <div>
                <strong>{bestScore}%</strong>
                <span>Best score</span>
              </div>
            </div>

            <div className="db-chart">
              {lastQuizzes.map((item) => (
                <div
                  className="db-bar-col"
                  key={item._id}
                  title={`${item.subject} · ${item.score}/${item.totalQuestions} · ${formatDate(item.createdAt)}`}
                >
                  <span className="db-bar-value">{item.percentage}%</span>

                  <div
                    className={`db-bar ${
                      item.percentage >= 80
                        ? "db-bar-good"
                        : item.percentage >= 50
                        ? "db-bar-mid"
                        : "db-bar-low"
                    }`}
                    style={{ height: `${Math.max(item.percentage, 4)}%` }}
                  />

                  <small>{item.subject.slice(0, 8)}</small>
                </div>
              ))}
            </div>

            <p className="db-muted">Your last {lastQuizzes.length} quizzes, oldest to newest.</p>
          </div>
        )}
      </section>
      {/* HOW IT WORKS */}
      <section className="db-section">
        <div className="db-heading">
          <div>
            <span>SIMPLE PROCESS</span>
            <h2>How It Works</h2>
          </div>

          <p>Prepare smarter in just three simple steps.</p>
        </div>

        <div className="db-steps">
          {STEPS.map((step, index) => (
            <div className="db-step" key={step.title}>
              <span className="db-step-num">0{index + 1}</span>
              <div className="db-step-icon">{step.icon}</div>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="db-footer">
        <strong>🎓 VTU AI Study Assistant</strong>

        <p>Your intelligent companion for VTU exam preparation.</p>

        <small>
          Developed with ❤️ by <b>Sanskar Nagarale</b> · © 2026
        </small>
      </footer>
    </div>
  );
}

export default Dashboard;