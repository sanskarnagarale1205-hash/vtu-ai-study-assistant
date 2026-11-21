import { useEffect, useState } from "react";
import axios from "axios";
import { parseReport, importanceLevel } from "./reportParser";
import "./SavedAnalyses.css";

const API_URL = "http://localhost:5000/api/previous-papers";

const LEVEL_LABEL = {
  high: "Extremely Important",
  mid: "Very Important",
  low: "Important",
};

const authHeaders = () => {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const errorText = (err, fallback) => {
  if (err.response) {
    return err.response.data?.message || fallback;
  }

  if (err.request) {
    return "Cannot connect to the backend. Make sure it is running on port 5000.";
  }

  return err.message || fallback;
};

const fetchSaved = async () => {
  const response = await axios.get(`${API_URL}/saved`, {
    headers: authHeaders(),
  });

  if (!response.data.success) {
    throw new Error(response.data.message || "No analyses found.");
  }

  return response.data.analyses || [];
};

const formatDate = (date) => {
  if (!date) return "Unknown date";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

function SavedAnalyses() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [toast, setToast] = useState("");

  // First load
  useEffect(() => {
    let active = true;

    fetchSaved()
      .then((list) => {
        if (active) setAnalyses(list);
      })
      .catch((err) => {
        console.error("Load analyses error:", err);
        if (active) setError(errorText(err, "Unable to load saved analyses."));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Esc closes pop-ups
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape") {
        setSelected(null);
        setToDelete(null);
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const showToast = (text) => {
    setToast(text);
    setTimeout(() => setToast(""), 2500);
  };

  const refresh = async () => {
    setLoading(true);
    setError("");

    try {
      setAnalyses(await fetchSaved());
    } catch (err) {
      console.error("Load analyses error:", err);
      setError(errorText(err, "Unable to load saved analyses."));
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!toDelete) return;

    try {
      setDeleting(true);

      await axios.delete(`${API_URL}/${toDelete._id}`, {
        headers: authHeaders(),
      });

      setAnalyses((previous) =>
        previous.filter((item) => item._id !== toDelete._id)
      );

      if (selected && selected._id === toDelete._id) {
        setSelected(null);
      }

      showToast("Analysis deleted.");
    } catch (err) {
      console.error("Delete error:", err);
      setError(errorText(err, "Could not delete the analysis."));
    } finally {
      setDeleting(false);
      setToDelete(null);
    }
  };

  const copyAnalysis = async (item) => {
    try {
      await navigator.clipboard.writeText(item.analysis || "");
      showToast("Analysis copied.");
    } catch {
      setError("Could not copy automatically.");
    }
  };

  // ---------- search + sort ----------

  const term = search.trim().toLowerCase();

  const visible = analyses
    .filter((item) => {
      if (!term) return true;

      return (
        (item.subject || "").toLowerCase().includes(term) ||
        (item.fileNames || []).some((name) =>
          name.toLowerCase().includes(term)
        )
      );
    })
    .sort((a, b) => {
      if (sort === "oldest") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }

      if (sort === "az") {
        return (a.subject || "").localeCompare(b.subject || "");
      }

      return new Date(b.createdAt) - new Date(a.createdAt);
    });

  const totalPapers = analyses.reduce(
    (total, item) => total + (item.totalFiles || 0),
    0
  );

  // ---------- neat report inside the pop-up ----------

  const renderRow = (row, index) => {
    if (row.label) {
      const level = importanceLevel(row.value);
      const isImportance = /importance/i.test(row.label);

      return (
        <div className="sa-row" key={index}>
          <span className="sa-row-label">{row.label}</span>

          {isImportance && level !== "none" ? (
            <span className={`sa-pill sa-pill-${level}`}>
              {LEVEL_LABEL[level]}
            </span>
          ) : (
            <span className="sa-row-value">{row.value}</span>
          )}
        </div>
      );
    }

    return (
      <div className="sa-row sa-row-plain" key={index}>
        <span className="sa-dot" />
        <span className="sa-row-value">{row.text}</span>
      </div>
    );
  };

  const renderReport = (text) => {
    const report = parseReport(text);

    if (!report.sections.length) {
      return <pre className="sa-raw">{text}</pre>;
    }

    return report.sections.map((section, si) => (
      <div className="sa-sec" key={si}>
        <div className="sa-sec-head">
          {section.number && (
            <span className="sa-num">{section.number}</span>
          )}

          <h3>{section.title || "Report"}</h3>
        </div>

        <div className="sa-sec-body">
          {section.blocks.map((block, bi) => {
            if (block.type === "card") {
              const importanceRow = block.rows.find(
                (row) => row.label && /importance/i.test(row.label)
              );

              const level = importanceLevel(importanceRow?.value);

              return (
                <div className={`sa-qcard sa-qcard-${level}`} key={bi}>
                  {block.title && <h4>{block.title}</h4>}

                  {block.rows.map(renderRow)}
                </div>
              );
            }

            const row = block.row || {};

            const rowText = row.label
              ? `${row.label}: ${row.value}`
              : row.text;

            return (
              <div className={`sa-item sa-kind-${block.type}`} key={bi}>
                {block.type === "number" && (
                  <span className="sa-item-num">{block.n}</span>
                )}

                {block.type === "bullet" && <span className="sa-dot" />}

                <span className="sa-item-text">{rowText}</span>
              </div>
            );
          })}
        </div>
      </div>
    ));
  };

  // =====================================================
  // UI
  // =====================================================

  return (
    <main className="sa-page">
      {/* HEADER */}
      <header className="sa-hero">
        <div>
          <p className="sa-eyebrow">YOUR LIBRARY</p>

          <h1>📚 My Saved Analyses</h1>

          <p className="sa-subtitle">
            Every previous-year paper analysis you created, ready to
            review again.
          </p>
        </div>

        <button
          type="button"
          className="sa-refresh"
          onClick={refresh}
          disabled={loading}
        >
          {loading ? "Loading..." : "🔄 Refresh"}
        </button>
      </header>

      {/* STATS */}
      {analyses.length > 0 && (
        <div className="sa-stats">
          <div className="sa-stat">
            <strong>{analyses.length}</strong>
            <span>Saved analyses</span>
          </div>

          <div className="sa-stat">
            <strong>{totalPapers}</strong>
            <span>Papers analysed</span>
          </div>

          <div className="sa-stat">
            <strong>
              {new Set(analyses.map((a) => (a.subject || "").toLowerCase()))
                .size}
            </strong>
            <span>Subjects</span>
          </div>
        </div>
      )}

      {/* TOOLBAR */}
      {analyses.length > 0 && (
        <div className="sa-toolbar">
          <input
            className="sa-search"
            type="search"
            placeholder="Search by subject or file name..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <select
            className="sa-select"
            value={sort}
            onChange={(event) => setSort(event.target.value)}
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="az">Subject A to Z</option>
          </select>
        </div>
      )}

      {error && (
        <div className="sa-error" role="alert">
          {error}
        </div>
      )}

      {loading && analyses.length === 0 && (
        <div className="sa-empty">
          <div className="sa-empty-icon">⏳</div>
          <h2>Loading your analyses...</h2>
        </div>
      )}

      {!loading && analyses.length === 0 && !error && (
        <div className="sa-empty">
          <div className="sa-empty-icon">📄</div>
          <h2>No saved analyses yet</h2>
          <p>Upload previous-year papers to create your first analysis.</p>
        </div>
      )}

      {analyses.length > 0 && visible.length === 0 && (
        <div className="sa-empty">
          <div className="sa-empty-icon">🔍</div>
          <h2>No matches</h2>
          <p>Try a different word.</p>
        </div>
      )}

      {/* CARDS */}
      <div className="sa-grid">
        {visible.map((item) => {
          const names = item.fileNames || [];

          return (
            <article className="sa-card" key={item._id}>
              <div className="sa-card-top">
                <div className="sa-subject-icon">📚</div>

                <div className="sa-card-title">
                  <h2>{item.subject}</h2>
                  <p>Created {formatDate(item.createdAt)}</p>
                </div>

                <button
                  type="button"
                  className="sa-trash"
                  onClick={() => setToDelete(item)}
                  title="Delete this analysis"
                  aria-label={`Delete ${item.subject}`}
                >
                  🗑
                </button>
              </div>

              <div className="sa-badges">
                <span className="sa-badge">
                  📄 {item.totalFiles || names.length || 0} papers
                </span>

                <span className="sa-badge sa-badge-green">
                  🤖 AI analysis ready
                </span>
              </div>

              {names.length > 0 && (
                <ul className="sa-files">
                  {names.slice(0, 3).map((name, index) => (
                    <li key={index} title={name}>
                      📄 {name}
                    </li>
                  ))}

                  {names.length > 3 && (
                    <li className="sa-more">+{names.length - 3} more</li>
                  )}
                </ul>
              )}

              <div className="sa-card-actions">
                <button
                  type="button"
                  className="sa-view"
                  onClick={() => setSelected(item)}
                >
                  📖 View Analysis
                </button>

                <button
                  type="button"
                  className="sa-copy"
                  onClick={() => copyAnalysis(item)}
                >
                  📋 Copy
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {/* VIEW MODAL */}
      {selected && (
        <div className="sa-overlay" onClick={() => setSelected(null)}>
          <div
            className="sa-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sa-modal-head">
              <div>
                <h2>{selected.subject}</h2>

                <p>
                  {selected.totalFiles || 0} papers analysed ·{" "}
                  {formatDate(selected.createdAt)}
                </p>
              </div>

              <button
                type="button"
                className="sa-close"
                onClick={() => setSelected(null)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="sa-modal-body">
              {renderReport(selected.analysis || "")}
            </div>

            <div className="sa-modal-foot">
              <button
                type="button"
                className="sa-copy"
                onClick={() => copyAnalysis(selected)}
              >
                📋 Copy
              </button>

              <button
                type="button"
                className="sa-danger-outline"
                onClick={() => setToDelete(selected)}
              >
                🗑 Delete
              </button>

              <button
                type="button"
                className="sa-view sa-view-small"
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {toDelete && (
        <div className="sa-overlay" onClick={() => setToDelete(null)}>
          <div
            className="sa-confirm"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sa-confirm-icon">🗑</div>

            <h2>Delete this analysis?</h2>

            <p>
              <strong>{toDelete.subject}</strong> will be removed
              permanently. This cannot be undone.
            </p>

            <div className="sa-confirm-actions">
              <button
                type="button"
                className="sa-copy"
                onClick={() => setToDelete(null)}
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="sa-danger"
                onClick={confirmDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting..." : "Yes, delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && <div className="sa-toast">{toast}</div>}
    </main>
  );
}

export default SavedAnalyses;