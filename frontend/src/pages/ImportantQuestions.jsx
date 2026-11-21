import { useState } from "react";
import axios from "axios";
import "./ImportantQuestions.css";

const API_URL = "http://localhost:5000/api/important-questions/generate";
const RECENT_KEY = "vtuIqRecent";

const MODULES = ["All Modules", "Module 1", "Module 2", "Module 3", "Module 4", "Module 5"];

const EXAMPLES = [
  { label: "DBMS", value: "DBMS" },
  { label: "DAA", value: "Design and Analysis of Algorithms" },
  { label: "Operating System", value: "Operating System" },
  { label: "Computer Networks", value: "Computer Networks" },
  { label: "Data Structures", value: "Data Structures" },
];

const stripMd = (text) =>
  text.replace(/\*\*(.*?)\*\*/g, "$1").replace(/[`#]/g, "").replace(/\s+/g, " ").trim();

const titleCase = (text) =>
  text
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
    .replace(/\bVtu\b/g, "VTU");

// Turns the AI answer into sections: heading + numbered questions / bullet topics
function parseQuestions(text) {
  const sections = [];
  let current = null;

  const start = (title) => {
    current = { title, items: [], notes: [] };
    sections.push(current);
  };

  String(text || "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .forEach((raw) => {
      const line = raw.trim();

      if (!line || /^[-*_]{3,}$/.test(line)) return;

      const clean = stripMd(line.replace(/^#+\s*/, ""));
      const numbered = clean.match(/^(\d+)[.)]\s+(.+)$/);
      const bullet = line.match(/^[-*\u2022]\s+(.+)$/);

      const isHeading =
        !numbered &&
        !bullet &&
        (/^#+\s/.test(line) || /^[A-Z0-9][A-Z0-9\s&/:()-]{4,}$/.test(clean));

      if (isHeading) {
        start(clean.replace(/:$/, ""));
        return;
      }

      if (!current) start("Questions");

      if (numbered) current.items.push({ text: numbered[2] });
      else if (bullet) current.items.push({ text: stripMd(bullet[1]) });
      else current.notes.push(clean);
    });

  return sections.filter((section) => section.items.length || section.notes.length);
}

const kindOf = (title) => {
  const t = title.toUpperCase();

  if (t.includes("REVISION")) return "revise";
  if (t.includes("VERY IMPORTANT")) return "hot";
  return "main";
};

const loadRecent = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

function ImportantQuestions() {
  const [subject, setSubject] = useState("");
  const [module, setModule] = useState("All Modules");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [shown, setShown] = useState({ subject: "", module: "" });
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [done, setDone] = useState({});
  const [recent, setRecent] = useState(loadRecent);

  const flash = (text) => {
    setNotice(text);
    setTimeout(() => setNotice(""), 2000);
  };

  const generate = async (subjectValue = subject, moduleValue = module) => {
    const name = subjectValue.trim();

    if (!name) {
      setError("Please enter a subject name.");
      return;
    }

    setLoading(true);
    setError("");
    setResult("");
    setDone({});

    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        API_URL,
        { subject: name, module: moduleValue },
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (!response.data.success) {
        setError(response.data.message || "Failed to generate questions.");
        return;
      }

      setResult(
        response.data.questions ||
          response.data.result ||
          response.data.analysis ||
          "Questions generated successfully."
      );

      setShown({ subject: name, module: moduleValue });

      const entry = { subject: name, module: moduleValue };

      const next = [
        entry,
        ...recent.filter(
          (item) => !(item.subject === name && item.module === moduleValue)
        ),
      ].slice(0, 5);

      setRecent(next);

      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        // storage blocked
      }
    } catch (err) {
      console.error("Generate questions error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to generate questions. Please check your backend."
      );
    } finally {
      setLoading(false);
    }
  };

  const clearForm = () => {
    setSubject("");
    setModule("All Modules");
    setResult("");
    setError("");
    setDone({});
  };

  const copyText = async (text, message) => {
    try {
      await navigator.clipboard.writeText(text);
      flash(message);
    } catch {
      setError("Could not copy automatically.");
    }
  };

  const sections = parseQuestions(result);

  const questionTotal = sections
    .filter((section) => kindOf(section.title) !== "revise")
    .reduce((total, section) => total + section.items.length, 0);

  const doneCount = Object.values(done).filter(Boolean).length;
  const progress = questionTotal ? Math.round((doneCount * 100) / questionTotal) : 0;

  const toggleDone = (key) => setDone((previous) => ({ ...previous, [key]: !previous[key] }));

  const allText = sections
    .map(
      (section) =>
        `${section.title}\n` +
        section.items.map((item, i) => `${i + 1}. ${item.text}`).join("\n")
    )
    .join("\n\n");

  return (
    <div className="iq-page">
      <section className="iq-hero">
        <div className="iq-hero-icon">⭐</div>

        <div>
          <p className="iq-eyebrow">EXAM PREPARATION</p>
          <h1>Important Questions</h1>
          <p className="iq-sub">
            Enter any subject and let AI generate important questions for
            your VTU exam.
          </p>
        </div>
      </section>

      <section className="iq-card">
        <label className="iq-label" htmlFor="iq-subject">Subject name</label>

        <input
          id="iq-subject"
          className="iq-input"
          type="text"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !loading) generate();
          }}
          placeholder="Example: DBMS, DAA, Operating System..."
          disabled={loading}
        />

        <div className="iq-chips">
          {EXAMPLES.map((item) => (
            <button type="button" key={item.label} className="iq-chip" onClick={() => setSubject(item.value)}>
              {item.label}
            </button>
          ))}
        </div>

        <label className="iq-label">Select module</label>

        <div className="iq-modules">
          {MODULES.map((name) => (
            <button
              type="button"
              key={name}
              className={`iq-module ${module === name ? "iq-module-active" : ""}`}
              onClick={() => setModule(name)}
              disabled={loading}
            >
              {name}
            </button>
          ))}
        </div>

        {recent.length > 0 && (
          <div className="iq-recent">
            <span>🕘 Recent:</span>

            {recent.map((item) => (
              <button
                type="button"
                key={`${item.subject}-${item.module}`}
                className="iq-chip iq-chip-recent"
                onClick={() => {
                  setSubject(item.subject);
                  setModule(item.module);
                }}
              >
                {item.subject} · {item.module}
              </button>
            ))}
          </div>
        )}

        {error && <div className="iq-error">❌ {error}</div>}

        <div className="iq-buttons">
          <button type="button" className="iq-secondary" onClick={clearForm} disabled={loading}>
            Clear
          </button>

          <button type="button" className="iq-primary" onClick={() => generate()} disabled={loading}>
            {loading ? "⏳ Generating..." : "✨ Generate Important Questions →"}
          </button>
        </div>

        {loading && (
          <div className="iq-loading">
            <div className="iq-spinner" />
            <p>The AI is preparing your questions...</p>
          </div>
        )}
      </section>

      {result && (
        <section className="iq-card iq-result">
          <div className="iq-result-head">
            <div>
              <h2>🎯 Important Questions</h2>
              <p>
                <strong>{shown.subject}</strong> · {shown.module}
              </p>
            </div>

            <div className="iq-actions">
              <button type="button" onClick={() => copyText(allText, "All questions copied.")}>📋 Copy all</button>
              <button type="button" onClick={() => window.print()}>🖨 Print</button>
              <button type="button" onClick={() => generate(shown.subject, shown.module)} disabled={loading}>🔄 Regenerate</button>
              <button type="button" onClick={clearForm}>➕ New</button>
            </div>
          </div>

          {notice && <div className="iq-notice">{notice}</div>}

          {questionTotal > 0 && (
            <div className="iq-progress">
              <div className="iq-progress-top">
                <strong>Study progress</strong>
                <span>{doneCount} of {questionTotal} questions done ({progress}%)</span>
              </div>

              <div className="iq-bar"><div style={{ width: `${progress}%` }} /></div>
            </div>
          )}

          <div className="iq-sections">
            {sections.map((section, si) => {
              const kind = kindOf(section.title);

              return (
                <div className={`iq-section iq-${kind}`} key={si}>
                  <h3>{titleCase(section.title)}</h3>

                  {kind === "revise" ? (
                    <div className="iq-topics">
                      {section.items.map((item, ii) => (
                        <span className="iq-topic" key={ii}>{item.text}</span>
                      ))}
                    </div>
                  ) : (
                    <div className="iq-list">
                      {section.items.map((item, ii) => {
                        const key = `${si}-${ii}`;

                        return (
                          <div className={`iq-q ${done[key] ? "iq-q-done" : ""}`} key={key}>
                            <span className="iq-num">{ii + 1}</span>
                            <p>{item.text}</p>

                            <div className="iq-q-actions">
                              <button type="button" title="Copy question" onClick={() => copyText(item.text, "Question copied.")}>📋</button>

                              <label className="iq-check">
                                <input type="checkbox" checked={Boolean(done[key])} onChange={() => toggleDone(key)} />
                                Done
                              </label>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {section.notes.map((note, ni) => (
                    <p className="iq-note" key={ni}>{note}</p>
                  ))}
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

export default ImportantQuestions;