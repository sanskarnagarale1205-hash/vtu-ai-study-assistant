import { useState } from "react";
import {
  NavLink,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
} from "react-router-dom";
import "./AppLayout.css";

const NAV = [
  { path: "/dashboard", icon: "🏠", label: "Dashboard" },
  { path: "/ai-chat", icon: "🤖", label: "AI Chat" },
  { path: "/upload-notes", icon: "📄", label: "Upload Notes" },
  { path: "/important-questions", icon: "⭐", label: "Important Questions" },
  { path: "/quiz", icon: "📝", label: "Quiz" },
  { path: "/study-plan", icon: "📅", label: "Study Plan" },
  { path: "/previous-paper", icon: "📑", label: "Previous Papers" },
  { path: "/saved-analyses", icon: "💾", label: "Saved Analyses" },
];

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null") || {};
  } catch {
    return {};
  }
};

function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  // Not logged in: go to the login page
  if (!localStorage.getItem("token")) {
    return <Navigate to="/login" replace />;
  }

  const user = readUser();

  const name =
    user.name || user.username || user.fullName || user.fullname || "Student";

  const detail = user.branch
    ? `${user.branch}${user.semester ? ` · Sem ${user.semester}` : ""}`
    : "CSE Student";

  const current = NAV.find((item) => item.path === location.pathname);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div className="al-shell">
      {menuOpen && (
        <div className="al-backdrop" onClick={() => setMenuOpen(false)} />
      )}

      {/* SIDEBAR */}
      <aside className={`al-sidebar ${menuOpen ? "al-open" : ""}`}>
        <div className="al-brand">
          <div className="al-brand-icon">🎓</div>

          <div>
            <strong>VTU AI</strong>
            <span>Study Assistant</span>
          </div>
        </div>

        <p className="al-label">MENU</p>

        <nav className="al-nav">
          {NAV.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `al-link ${isActive ? "al-active" : ""}`
              }
              onClick={() => setMenuOpen(false)}
            >
              <span className="al-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="al-bottom">
          <div className="al-dev">
            <div className="al-dev-icon">⚡</div>

            <div>
              <small>Developed by</small>
              <strong>Sanskar Nagarale</strong>
            </div>
          </div>

          <button type="button" className="al-logout" onClick={logout}>
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="al-main">
        <header className="al-topbar">
          <button
            type="button"
            className="al-burger"
            onClick={() => setMenuOpen(true)}
            aria-label="Open menu"
          >
            ☰
          </button>

          <h1 className="al-title">
            {current ? `${current.icon} ${current.label}` : "VTU AI"}
          </h1>

          <div className="al-profile">
            <div className="al-profile-text">
              <strong>{name}</strong>
              <span>{detail}</span>
            </div>

            <div className="al-avatar">{name.charAt(0).toUpperCase()}</div>
          </div>
        </header>

        <div className="al-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default AppLayout;