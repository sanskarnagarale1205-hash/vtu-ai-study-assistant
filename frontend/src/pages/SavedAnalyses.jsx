import { useEffect, useState } from "react";
import axios from "axios";

function SavedAnalyses() {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [error, setError] = useState("");

  const loadAnalyses = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
  "http://localhost:5000/api/previous-paper/saved"
);
      console.log("Saved analyses:", response.data);

      if (response.data.success) {
        setAnalyses(response.data.analyses || []);
      } else {
        setAnalyses([]);
        setError(response.data.message || "No analyses found.");
      }
    } catch (err) {
      console.error("Load analyses error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load saved analyses."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
  const fetchAnalyses = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await axios.get(
        "http://localhost:5000/api/previous-papers/saved"
      );

      if (response.data.success) {
        setAnalyses(response.data.analyses || []);
      } else {
        setError("No analyses found.");
      }
    } catch (err) {
      console.error("Load analyses error:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load saved analyses."
      );
    } finally {
      setLoading(false);
    }
  };

  fetchAnalyses();
}, []);

  const formatDate = (date) => {
    if (!date) return "Unknown date";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div style={styles.center}>
        <div style={styles.loadingIcon}>⏳</div>
        <h2>Loading your analyses...</h2>
      </div>
    );
  }

  return (
    <div style={styles.page}>

      {/* HEADER */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>
            📚 My Saved Analyses
          </h1>

          <p style={styles.subtitle}>
            View your saved VTU previous-year paper analyses.
          </p>
        </div>

        <button
          style={styles.refreshButton}
          onClick={loadAnalyses}
        >
          🔄 Refresh
        </button>
      </div>

      {/* ERROR */}
      {error && (
        <div style={styles.error}>
          ❌ {error}
        </div>
      )}

      {/* EMPTY */}
      {analyses.length === 0 && !error && (
        <div style={styles.empty}>
          <div style={styles.emptyIcon}>📄</div>

          <h2>No saved analyses</h2>

          <p>
            Upload previous-year papers to create
            your first analysis.
          </p>
        </div>
      )}

      {/* CARDS */}
      <div style={styles.grid}>
        {analyses.map((item) => (
          <div
            key={item._id}
            style={styles.card}
          >

            {/* CARD HEADER */}
            <div style={styles.cardTop}>

              <div style={styles.subjectIcon}>
                📚
              </div>

              <div>
                <h2 style={styles.cardTitle}>
                  {item.subject}
                </h2>

                <p style={styles.date}>
                  Created: {formatDate(item.createdAt)}
                </p>
              </div>

            </div>

            {/* INFO */}
            <div style={styles.info}>

              <div>
                📄{" "}
                <strong>
                  {item.totalFiles || 0}
                </strong>{" "}
                Previous Year Papers
              </div>

              <div>
                🤖 AI Analysis Available
              </div>

            </div>

            {/* FILES */}
            {item.fileNames &&
              item.fileNames.length > 0 && (
                <div style={styles.files}>

                  <h4 style={styles.filesTitle}>
                    Uploaded Papers
                  </h4>

                  {item.fileNames.map(
                    (file, index) => (
                      <div
                        key={index}
                        style={styles.file}
                      >
                        📄 {file}
                      </div>
                    )
                  )}

                </div>
              )}

            {/* VIEW */}
            <button
              style={styles.viewButton}
              onClick={() => setSelected(item)}
            >
              📖 View Analysis
            </button>

          </div>
        ))}
      </div>

      {/* MODAL */}
      {selected && (
        <div style={styles.overlay}>

          <div style={styles.modal}>

            {/* MODAL HEADER */}
            <div style={styles.modalHeader}>

              <div>
                <h1 style={styles.modalTitle}>
                  🤖 {selected.subject} Analysis
                </h1>

                <p style={styles.modalSubtitle}>
                  {selected.totalFiles} previous-year
                  papers analyzed
                </p>
              </div>

              <button
                style={styles.closeButton}
                onClick={() => setSelected(null)}
              >
                ✕
              </button>

            </div>

            {/* ANALYSIS */}
            <div style={styles.analysis}>

              <div style={styles.analysisText}>
                {selected.analysis}
              </div>

            </div>

            {/* FOOTER */}
            <div style={styles.modalFooter}>

              <button
                style={styles.closeBottomButton}
                onClick={() => setSelected(null)}
              >
                Close
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}

const styles = {

  page: {
    minHeight: "100vh",
    padding: "35px",
    background: "#f5f7fb",
    color: "#1f2937",
    boxSizing: "border-box",
  },

  header: {
    maxWidth: "1200px",
    margin: "0 auto 30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
  },

  title: {
    margin: "0",
    fontSize: "32px",
    fontWeight: "700",
  },

  subtitle: {
    marginTop: "8px",
    color: "#6b7280",
    fontSize: "16px",
  },

  refreshButton: {
    padding: "12px 18px",
    border: "none",
    borderRadius: "10px",
    background: "#2563eb",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "14px",
  },

  grid: {
    maxWidth: "1200px",
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(320px, 1fr))",
    gap: "22px",
  },

  card: {
    background: "#fff",
    borderRadius: "18px",
    padding: "24px",
    boxShadow:
      "0 5px 20px rgba(0, 0, 0, 0.08)",
    border: "1px solid #e5e7eb",
  },

  cardTop: {
    display: "flex",
    gap: "15px",
    alignItems: "center",
  },

  subjectIcon: {
    width: "55px",
    height: "55px",
    borderRadius: "14px",
    background: "#e0e7ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    flexShrink: 0,
  },

  cardTitle: {
    margin: "0",
    fontSize: "21px",
  },

  date: {
    margin: "5px 0 0",
    color: "#6b7280",
    fontSize: "13px",
  },

  info: {
    marginTop: "20px",
    display: "flex",
    flexDirection: "column",
    gap: "9px",
    color: "#4b5563",
    fontSize: "14px",
  },

  files: {
    marginTop: "18px",
    padding: "12px",
    background: "#f9fafb",
    borderRadius: "10px",
    maxHeight: "130px",
    overflowY: "auto",
  },

  filesTitle: {
    margin: "0 0 8px",
    fontSize: "13px",
  },

  file: {
    fontSize: "12px",
    padding: "5px 0",
    color: "#6b7280",
    wordBreak: "break-word",
  },

  viewButton: {
    width: "100%",
    marginTop: "20px",
    padding: "13px",
    border: "none",
    borderRadius: "10px",
    background: "#111827",
    color: "#fff",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "14px",
  },

  center: {
    minHeight: "100vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "#f5f7fb",
  },

  loadingIcon: {
    fontSize: "42px",
  },

  empty: {
    maxWidth: "500px",
    margin: "100px auto",
    textAlign: "center",
    background: "#fff",
    padding: "50px",
    borderRadius: "20px",
    boxShadow:
      "0 5px 20px rgba(0, 0, 0, 0.08)",
  },

  emptyIcon: {
    fontSize: "50px",
  },

  error: {
    maxWidth: "1200px",
    margin: "0 auto 20px",
    padding: "15px",
    background: "#fee2e2",
    color: "#991b1b",
    borderRadius: "10px",
  },

  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0, 0, 0, 0.65)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    padding: "20px",
    zIndex: 1000,
    boxSizing: "border-box",
  },

  modal: {
    width: "100%",
    maxWidth: "1000px",
    height: "90vh",
    background: "#fff",
    borderRadius: "18px",
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
    boxShadow:
      "0 20px 60px rgba(0, 0, 0, 0.25)",
  },

  modalHeader: {
    padding: "20px 25px",
    borderBottom: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
  },

  modalTitle: {
    margin: "0",
    fontSize: "24px",
  },

  modalSubtitle: {
    margin: "5px 0 0",
    color: "#6b7280",
    fontSize: "14px",
  },

  closeButton: {
    width: "40px",
    height: "40px",
    border: "none",
    borderRadius: "50%",
    background: "#fee2e2",
    color: "#991b1b",
    fontSize: "18px",
    cursor: "pointer",
  },

  analysis: {
    flex: 1,
    overflowY: "auto",
    padding: "30px",
    background: "#fff",
  },

  analysisText: {
    whiteSpace: "pre-wrap",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    fontSize: "15px",
    lineHeight: "1.7",
    color: "#1f2937",
  },

  modalFooter: {
    padding: "15px 25px",
    borderTop: "1px solid #e5e7eb",
    display: "flex",
    justifyContent: "flex-end",
  },

  closeBottomButton: {
    padding: "10px 20px",
    border: "none",
    borderRadius: "9px",
    background: "#111827",
    color: "#fff",
    cursor: "pointer",
    fontWeight: "600",
  },

};

export default SavedAnalyses;