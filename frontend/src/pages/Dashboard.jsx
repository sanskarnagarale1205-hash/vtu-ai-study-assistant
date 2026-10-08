import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {
  const navigate = useNavigate();

  // Get logged-in user
  let studentName = "Student";

  try {
    const savedUser = localStorage.getItem("user");

    if (savedUser) {
      const user = JSON.parse(savedUser);

      studentName =
        user.name ||
        user.username ||
        user.fullName ||
        user.fullname ||
        "Student";
    }
  } catch (error) {
    console.error("Unable to read user:", error);
  }

  const firstLetter = studentName.charAt(0).toUpperCase();

  // Logout
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  // Study tools
  const tools = [
    {
      icon: "📄",
      title: "Upload Notes",
      text: "Upload VTU notes and get AI-powered explanations.",
      path: "/upload-notes",
      color: "blue",
    },
    {
      icon: "🤖",
      title: "AI Chat",
      text: "Ask questions and get instant AI explanations.",
      path: "/ai-chat",
      color: "purple",
    },
    {
      icon: "⭐",
      title: "Important Questions",
      text: "Generate module-wise important VTU questions.",
      path: "/important-questions",
      color: "orange",
    },
    {
      icon: "📝",
      title: "VTU Quiz",
      text: "Practice MCQs and test your exam preparation.",
      path: "/quiz",
      color: "green",
    },
    {
      icon: "📑",
      title: "Previous Papers",
      text: "Analyze previous-year papers and find repeated questions.",
      path: "/previous-paper",
      color: "pink",
    },
    {
      icon: "💾",
      title: "Saved Analyses",
      text: "View your previously saved AI paper analyses.",
      path: "/saved-analyses",
      color: "cyan",
    },
  ];

  return (
    <div className="dashboard">

      {/* SIDEBAR */}
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">🎓</div>

          <div>
            <h2>VTU AI</h2>
            <span>Study Assistant</span>
          </div>
        </div>

        <div className="side-label">MENU</div>

        <nav className="side-menu">

          <button className="side-link active">
            <span>🏠</span>
            Dashboard
          </button>

          <button
            className="side-link"
            onClick={() => navigate("/ai-chat")}
          >
            <span>🤖</span>
            AI Chat
          </button>

          <button
            className="side-link"
            onClick={() => navigate("/upload-notes")}
          >
            <span>📄</span>
            Upload Notes
          </button>

          <button
            className="side-link"
            onClick={() => navigate("/important-questions")}
          >
            <span>⭐</span>
            Important Questions
          </button>

          <button
            className="side-link"
            onClick={() => navigate("/quiz")}
          >
            <span>📝</span>
            Quiz
          </button>

          <button
            className="side-link"
            onClick={() => navigate("/previous-paper")}
          >
            <span>📑</span>
            Previous Papers
          </button>

          <button
            className="side-link"
            onClick={() => navigate("/saved-analyses")}
          >
            <span>💾</span>
            Saved Analyses
          </button>

        </nav>

        <div className="sidebar-bottom">

          <div className="developer-card">
            <div className="developer-icon">⚡</div>

            <div>
              <small>Developed by</small>
              <strong>Sanskar Nagarale</strong>
            </div>
          </div>

          <button className="logout" onClick={logout}>
            <span>🚪</span>
            Logout
          </button>

        </div>

      </aside>


      {/* MAIN CONTENT */}
      <main className="main-content">

        {/* TOPBAR */}
        <header className="topbar">

          <div>
            <p className="top-small">VTU CSE • 5th Semester</p>
            <h1>Dashboard</h1>
          </div>

          <div className="profile">

            <div className="profile-text">
              <strong>{studentName}</strong>
              <span>CSE Student</span>
            </div>

            <div className="avatar">
              {firstLetter}
            </div>

          </div>

        </header>


        {/* HERO */}
        <section className="hero">

          <div className="hero-content">

            <div className="hero-badge">
              ✨ AI POWERED LEARNING
            </div>

            <h2>
              Study smarter.
              <br />
              <span>Score better.</span>
            </h2>

            <p>
              Your personal AI study companion for VTU exams.
              Understand difficult topics, prepare important
              questions and practice with smart quizzes.
            </p>

            <div className="hero-actions">

              <button
                className="hero-primary"
                onClick={() => navigate("/ai-chat")}
              >
                🤖 Ask AI
                <span>→</span>
              </button>

              <button
                className="hero-secondary"
                onClick={() => navigate("/upload-notes")}
              >
                📤 Upload Notes
              </button>

            </div>

          </div>

          <div className="hero-visual">

            <div className="glow-circle"></div>

            <div className="robot">
              🤖
            </div>

            <div className="floating-card floating-one">
              <span>🧠</span>
              <div>
                <strong>AI Learning</strong>
                <small>Smart explanations</small>
              </div>
            </div>

            <div className="floating-card floating-two">
              <span>🎯</span>
              <div>
                <strong>VTU Focused</strong>
                <small>Exam preparation</small>
              </div>
            </div>

          </div>

        </section>


        {/* STATS */}
        <section className="stats">

          <div className="stat">
            <div className="stat-icon blue">📚</div>
            <div>
              <strong>6+</strong>
              <span>Study Tools</span>
            </div>
          </div>

          <div className="stat">
            <div className="stat-icon purple">🤖</div>
            <div>
              <strong>AI</strong>
              <span>Powered Learning</span>
            </div>
          </div>

          <div className="stat">
            <div className="stat-icon orange">📑</div>
            <div>
              <strong>5</strong>
              <span>Papers Analysis</span>
            </div>
          </div>

          <div className="stat">
            <div className="stat-icon green">🎯</div>
            <div>
              <strong>VTU</strong>
              <span>Exam Focused</span>
            </div>
          </div>

        </section>


        {/* TOOLS */}
        <section className="tools-section">

          <div className="section-heading">

            <div>
              <span>YOUR LEARNING HUB</span>
              <h2>Study Tools</h2>
            </div>

            <p>
              Everything you need for your VTU preparation.
            </p>

          </div>


          <div className="tools-grid">

            {tools.map((tool, index) => (

              <div
                className="tool-card"
                key={tool.title}
                onClick={() => navigate(tool.path)}
              >

                <div className="tool-top">

                  <div className={`tool-icon ${tool.color}`}>
                    {tool.icon}
                  </div>

                  <span className="tool-number">
                    0{index + 1}
                  </span>

                </div>

                <h3>{tool.title}</h3>

                <p>{tool.text}</p>

                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    navigate(tool.path);
                  }}
                >
                  Open Tool
                  <span>→</span>
                </button>

              </div>

            ))}

          </div>

        </section>


        {/* QUICK ACTION */}
        <section className="quick-section">

          <div className="quick-header">
            <div>
              <span>QUICK ACTIONS</span>
              <h2>What do you want to do?</h2>
            </div>
          </div>

          <div className="quick-grid">

            <button
              onClick={() => navigate("/ai-chat")}
            >
              <span>🤖</span>
              <div>
                <strong>Ask AI</strong>
                <small>Get instant answers</small>
              </div>
              <b>→</b>
            </button>

            <button
              onClick={() => navigate("/quiz")}
            >
              <span>📝</span>
              <div>
                <strong>Take Quiz</strong>
                <small>Test your knowledge</small>
              </div>
              <b>→</b>
            </button>

            <button
              onClick={() => navigate("/important-questions")}
            >
              <span>⭐</span>
              <div>
                <strong>Important Questions</strong>
                <small>Prepare for exams</small>
              </div>
              <b>→</b>
            </button>

            <button
              onClick={() => navigate("/previous-paper")}
            >
              <span>📑</span>
              <div>
                <strong>Analyze Papers</strong>
                <small>Find repeated questions</small>
              </div>
              <b>→</b>
            </button>

          </div>

        </section>


        {/* HOW IT WORKS */}
        <section className="how-section">

          <div className="section-heading">
            <div>
              <span>SIMPLE PROCESS</span>
              <h2>How It Works</h2>
            </div>

            <p>
              Prepare smarter in just three simple steps.
            </p>
          </div>

          <div className="steps">

            <div className="step">

              <div className="step-number">01</div>

              <div className="step-icon">
                📤
              </div>

              <h3>Upload</h3>

              <p>
                Upload your VTU notes or previous-year papers.
              </p>

            </div>

            <div className="step-line"></div>

            <div className="step">

              <div className="step-number">02</div>

              <div className="step-icon">
                🧠
              </div>

              <h3>AI Analysis</h3>

              <p>
                Our AI reads and understands your study material.
              </p>

            </div>

            <div className="step-line"></div>

            <div className="step">

              <div className="step-number">03</div>

              <div className="step-icon">
                🎯
              </div>

              <h3>Study Smart</h3>

              <p>
                Get explanations, questions and quizzes.
              </p>

            </div>

          </div>

        </section>


        {/* FOOTER */}
        <footer>

          <div className="footer-logo">
            🎓 VTU AI Study Assistant
          </div>

          <p>
            Your intelligent companion for VTU exam preparation.
          </p>

          <div className="footer-developer">
            Developed with ❤️ by <strong>Sanskar Nagarale</strong>
          </div>

          <div className="footer-line"></div>

          <small>
            © 2026 VTU AI Study Assistant • VTU CSE
          </small>

        </footer>

      </main>

    </div>
  );
}

export default Dashboard;