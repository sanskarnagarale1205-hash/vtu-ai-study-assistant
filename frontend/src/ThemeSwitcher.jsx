import { useEffect, useState } from "react";
import "./ThemeSwitcher.css";

const THEMES = [
  { id: "indigo", label: "Indigo", color: "#4f46e5" },
  { id: "dark", label: "Dark", color: "#0b1020" },
  { id: "emerald", label: "Emerald", color: "#059669" },
  { id: "ocean", label: "Ocean", color: "#2563eb" },
];

const getSavedTheme = () => {
  try {
    const saved = localStorage.getItem("vtuTheme");

    if (THEMES.some((theme) => theme.id === saved)) {
      return saved;
    }
  } catch {
    // storage blocked: fall back to the default
  }

  return "indigo";
};

function ThemeSwitcher() {
  const [theme, setTheme] = useState(getSavedTheme);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const choose = (id) => {
    setTheme(id);
    setOpen(false);

    try {
      localStorage.setItem("vtuTheme", id);
    } catch {
      // the theme still works for this visit
    }
  };

  const current = THEMES.find((item) => item.id === theme);

  return (
    <div className="ts-wrap">
      {open && (
        <div className="ts-menu" role="menu">
          {THEMES.map((item) => (
            <button
              type="button"
              key={item.id}
              className={`ts-option ${item.id === theme ? "ts-active" : ""}`}
              onClick={() => choose(item.id)}
              role="menuitem"
            >
              <span
                className="ts-dot"
                style={{ background: item.color }}
              />
              {item.label}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        className="ts-toggle"
        onClick={() => setOpen((value) => !value)}
        aria-label="Change theme"
        title="Change theme"
      >
        <span className="ts-dot" style={{ background: current.color }} />
        🎨
      </button>
    </div>
  );
}

export default ThemeSwitcher;