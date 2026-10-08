import React, { useState } from "react";
import axios from "axios";

function PreviousPaper() {
  const [subject, setSubject] = useState("DBMS");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState("");

  // =====================================================
  // SELECT FILES
  // =====================================================

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files || []);

    setError("");
    setMessage("");

    if (selectedFiles.length === 0) {
      return;
    }

    // Check PDF
    const invalidFiles = selectedFiles.filter(
      (file) =>
        file.type !== "application/pdf" &&
        !file.name.toLowerCase().endsWith(".pdf")
    );

    if (invalidFiles.length > 0) {
      setError("Only PDF files are allowed.");
      event.target.value = "";
      return;
    }

    // Maximum 5 files
    if (selectedFiles.length > 5) {
      setError("You can upload maximum 5 PDF files.");
      event.target.value = "";
      return;
    }

    // Maximum 20 MB per file
    const largeFile = selectedFiles.find(
      (file) => file.size > 20 * 1024 * 1024
    );

    if (largeFile) {
      setError(`${largeFile.name} is larger than 20 MB.`);
      event.target.value = "";
      return;
    }

    setFiles(selectedFiles);
  };

  // =====================================================
  // REMOVE FILE
  // =====================================================

  const removeFile = (index) => {
    setFiles((previousFiles) =>
      previousFiles.filter((_, i) => i !== index)
    );

    setError("");
    setMessage("");
  };

  // =====================================================
  // FORMAT FILE SIZE
  // =====================================================

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 KB";

    const mb = bytes / (1024 * 1024);

    if (mb >= 1) {
      return `${mb.toFixed(2)} MB`;
    }

    return `${Math.ceil(bytes / 1024)} KB`;
  };

  // =====================================================
  // ANALYZE PAPERS
  // =====================================================

  const handleAnalyze = async () => {
    setError("");
    setMessage("");
    setAnalysis("");

    if (!subject) {
      setError("Please select a subject.");
      return;
    }

    if (files.length === 0) {
      setError("Please select at least one PDF.");
      return;
    }

    if (files.length > 5) {
      setError("Maximum 5 PDF files are allowed.");
      return;
    }

    try {
      setLoading(true);

      setMessage("📚 Uploading previous-year papers...");

      const formData = new FormData();

      // IMPORTANT:
      // Backend uses upload.array("files", 5)
      files.forEach((file) => {
        formData.append("files", file);
      });

      formData.append("subject", subject);

      setMessage("🤖 AI is analyzing all uploaded papers...");

      // =================================================
      // IMPORTANT API URL
      // =================================================

      const response = await axios.post(
        "http://localhost:5000/api/previous-papers/analyze",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },

          timeout: 300000,
        }
      );

      console.log(
        "Previous paper response:",
        response.data
      );

      if (response.data?.success) {
        const result =
          response.data.analysis ||
          response.data.data?.analysis ||
          "";

        setAnalysis(result);

        setMessage(
          "✅ Analysis completed successfully!"
        );
      } else {
        setError(
          response.data?.message ||
            "Analysis failed."
        );
      }
    } catch (err) {
      console.error(
        "Previous paper analysis error:",
        err
      );

      // Server responded with error
      if (err.response) {
        console.error(
          "Server response:",
          err.response.data
        );

        setError(
          err.response.data?.message ||
            `Server error (${err.response.status})`
        );
      }

      // Request sent but no response
      else if (err.request) {
        setError(
          "Cannot connect to backend. Make sure your backend is running on port 5000."
        );
      }

      // Other error
      else {
        setError(
          err.message ||
            "Something went wrong."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // CLEAR EVERYTHING
  // =====================================================

  const clearAll = () => {
    setFiles([]);
    setAnalysis("");
    setMessage("");
    setError("");

    const input = document.getElementById("pdf-upload");

    if (input) {
      input.value = "";
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div style={styles.page}>
      <div style={styles.container}>

        {/* =================================================
            HEADER
        ================================================= */}

        <div style={styles.header}>
          <div style={styles.headerIcon}>
            📄
          </div>

          <div>
            <h1 style={styles.title}>
              Upload VTU Previous Year Papers
            </h1>

            <p style={styles.subtitle}>
              Upload up to 5 previous-year papers.
              AI will compare all papers and find
              repeated questions and SUPER IMPORTANT
              questions.
            </p>
          </div>
        </div>

        {/* =================================================
            UPLOAD CARD
        ================================================= */}

        <div style={styles.card}>

          {/* SUBJECT */}

          <label style={styles.label}>
            Select Subject
          </label>

          <select
            value={subject}
            onChange={(e) =>
              setSubject(e.target.value)
            }
            style={styles.select}
            disabled={loading}
          >
            <option value="DBMS">
              DBMS
            </option>

            <option value="Design and Analysis of Algorithms">
              Design and Analysis of Algorithms
            </option>

            <option value="Operating Systems">
              Operating Systems
            </option>

            <option value="Computer Networks">
              Computer Networks
            </option>

            <option value="Data Structures">
              Data Structures
            </option>

            <option value="Java">
              Java
            </option>

            <option value="Python">
              Python
            </option>
          </select>

          {/* PDF INPUT */}

          <label style={styles.label}>
            Select PDF files
          </label>

          <label
            htmlFor="pdf-upload"
            style={
              loading
                ? styles.uploadBoxDisabled
                : styles.uploadBox
            }
          >
            <div style={styles.uploadIcon}>
              📄
            </div>

            <div style={styles.uploadText}>
              <strong>
                Click to select PDF files
              </strong>

              <span>
                Maximum 5 PDF files
              </span>
            </div>
          </label>

          <input
            id="pdf-upload"
            type="file"
            accept=".pdf,application/pdf"
            multiple
            onChange={handleFileChange}
            disabled={loading}
            style={styles.hiddenInput}
          />

          {/* =================================================
              FILE COUNT
          ================================================= */}

          {files.length > 0 && (
            <div style={styles.selectedHeader}>
              <div>
                <strong>
                  ✅ {files.length} PDF
                  {files.length > 1
                    ? "s"
                    : ""} Selected
                </strong>
              </div>

              <span style={styles.limitText}>
                {files.length}/5
              </span>
            </div>
          )}

          {/* =================================================
              FILE LIST
          ================================================= */}

          {files.length > 0 && (
            <div style={styles.fileList}>
              {files.map((file, index) => (
                <div
                  key={`${file.name}-${index}`}
                  style={styles.fileItem}
                >
                  <div style={styles.fileLeft}>
                    <div style={styles.pdfIcon}>
                      📄
                    </div>

                    <div style={styles.fileDetails}>
                      <div style={styles.fileName}>
                        {file.name}
                      </div>

                      <div style={styles.fileSize}>
                        {formatFileSize(file.size)}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      removeFile(index)
                    }
                    disabled={loading}
                    style={styles.removeButton}
                    title="Remove file"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* =================================================
              MESSAGE
          ================================================= */}

          {message && (
            <div style={styles.successMessage}>
              {message}
            </div>
          )}

          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div style={styles.errorMessage}>
              ❌ {error}
            </div>
          )}

          {/* =================================================
              BUTTONS
          ================================================= */}

          <div style={styles.buttonRow}>

            <button
              type="button"
              onClick={handleAnalyze}
              disabled={
                loading ||
                files.length === 0
              }
              style={
                loading ||
                files.length === 0
                  ? styles.analyzeButtonDisabled
                  : styles.analyzeButton
              }
            >
              {loading
                ? "⏳ Analyzing Papers..."
                : "🚀 Analyze All Papers"}
            </button>

            {files.length > 0 && !loading && (
              <button
                type="button"
                onClick={clearAll}
                style={styles.clearButton}
              >
                Clear All
              </button>
            )}

          </div>

        </div>

        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <div style={styles.loadingCard}>
            <div style={styles.spinner}>
              🤖
            </div>

            <h2 style={styles.loadingTitle}>
              AI Previous Year Paper Analysis
            </h2>

            <p style={styles.loadingText}>
              Reading your papers, comparing
              repeated questions and finding
              SUPER IMPORTANT questions...
            </p>

            <div style={styles.progressBar}>
              <div
                style={styles.progress}
              />
            </div>

            <p style={styles.smallText}>
              Please don't close this page.
            </p>
          </div>
        )}

        {/* =================================================
            ANALYSIS RESULT
        ================================================= */}

        {analysis && !loading && (
          <div style={styles.resultCard}>

            <div style={styles.resultHeader}>
              <div>
                <h2 style={styles.resultTitle}>
                  🤖 AI Previous Year Paper Analysis
                </h2>

                <p style={styles.resultSubtitle}>
                  {subject} • {files.length} paper
                  {files.length > 1
                    ? "s"
                    : ""} analyzed
                </p>
              </div>

              <div style={styles.completedBadge}>
                ✅ Completed
              </div>
            </div>

            <div style={styles.analysisBox}>
              {renderAnalysis(analysis)}
            </div>

          </div>
        )}

        {/* =================================================
            INFORMATION
        ================================================= */}

        {!analysis && !loading && (
          <div style={styles.infoCard}>

            <h3 style={styles.infoTitle}>
              💡 How it works
            </h3>

            <div style={styles.steps}>

              <div style={styles.step}>
                <div style={styles.stepNumber}>
                  1
                </div>

                <div>
                  <strong>
                    Upload papers
                  </strong>

                  <p>
                    Upload up to 5 VTU previous-year
                    question papers.
                  </p>
                </div>
              </div>

              <div style={styles.step}>
                <div style={styles.stepNumber}>
                  2
                </div>

                <div>
                  <strong>
                    AI compares papers
                  </strong>

                  <p>
                    The AI reads all papers and
                    compares questions.
                  </p>
                </div>
              </div>

              <div style={styles.step}>
                <div style={styles.stepNumber}>
                  3
                </div>

                <div>
                  <strong>
                    Find repeated questions
                  </strong>

                  <p>
                    Repeated questions and important
                    topics are identified.
                  </p>
                </div>
              </div>

              <div style={styles.step}>
                <div style={styles.stepNumber}>
                  4
                </div>

                <div>
                  <strong>
                    Get SUPER IMPORTANT questions
                  </strong>

                  <p>
                    Study the highest-priority
                    questions first.
                  </p>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// =====================================================
// ANALYSIS RENDERER
// =====================================================

function renderAnalysis(text) {
  if (!text) {
    return null;
  }

  const lines = text.split("\n");

  return lines.map((line, index) => {
    const trimmed = line.trim();

    // Empty line
    if (!trimmed) {
      return (
        <div
          key={index}
          style={styles.emptyLine}
        />
      );
    }

    // Main heading
    if (trimmed.startsWith("# ")) {
      return (
        <h1
          key={index}
          style={styles.analysisH1}
        >
          {cleanMarkdown(
            trimmed.replace(/^# /, "")
          )}
        </h1>
      );
    }

    // Heading
    if (trimmed.startsWith("## ")) {
      return (
        <h2
          key={index}
          style={styles.analysisH2}
        >
          {cleanMarkdown(
            trimmed.replace(/^## /, "")
          )}
        </h2>
      );
    }

    // Subheading
    if (trimmed.startsWith("### ")) {
      return (
        <h3
          key={index}
          style={styles.analysisH3}
        >
          {cleanMarkdown(
            trimmed.replace(/^### /, "")
          )}
        </h3>
      );
    }

    // Horizontal line
    if (
      trimmed === "---" ||
      trimmed === "***"
    ) {
      return (
        <hr
          key={index}
          style={styles.hr}
        />
      );
    }

    // Table
    if (trimmed.startsWith("|")) {
      const cells = trimmed
        .split("|")
        .map((cell) => cell.trim())
        .filter(Boolean);

      // Skip separator row
      if (
        cells.length > 0 &&
        cells.every((cell) =>
          /^:?-+:?$/.test(cell)
        )
      ) {
        return null;
      }

      return (
        <div
          key={index}
          style={styles.tableRow}
        >
          {cells.map((cell, cellIndex) => (
            <div
              key={cellIndex}
              style={
                cellIndex === 0
                  ? styles.tableCellFirst
                  : styles.tableCell
              }
            >
              {renderInlineMarkdown(cell)}
            </div>
          ))}
        </div>
      );
    }

    // Numbered list
    if (/^\d+\.\s/.test(trimmed)) {
      const match = trimmed.match(
        /^(\d+)\.\s+(.*)$/
      );

      if (match) {
        return (
          <div
            key={index}
            style={styles.numberedItem}
          >
            <span style={styles.number}>
              {match[1]}.
            </span>

            <span>
              {renderInlineMarkdown(
                match[2]
              )}
            </span>
          </div>
        );
      }
    }

    // Bullet
    if (
      trimmed.startsWith("* ") ||
      trimmed.startsWith("- ")
    ) {
      return (
        <div
          key={index}
          style={styles.bulletItem}
        >
          <span style={styles.bullet}>
            •
          </span>

          <span>
            {renderInlineMarkdown(
              trimmed.substring(2)
            )}
          </span>
        </div>
      );
    }

    // Normal paragraph
    return (
      <p
        key={index}
        style={styles.paragraph}
      >
        {renderInlineMarkdown(trimmed)}
      </p>
    );
  });
}

// =====================================================
// INLINE MARKDOWN
// =====================================================

function renderInlineMarkdown(text) {
  const cleaned = cleanMarkdown(text);

  const parts = cleaned.split(
    /(\*\*.*?\*\*|\*.*?\*)/g
  );

  return parts.map((part, index) => {
    if (
      part.startsWith("**") &&
      part.endsWith("**")
    ) {
      return (
        <strong key={index}>
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (
      part.startsWith("*") &&
      part.endsWith("*")
    ) {
      return (
        <em key={index}>
          {part.slice(1, -1)}
        </em>
      );
    }

    return (
      <React.Fragment key={index}>
        {part}
      </React.Fragment>
    );
  });
}

// =====================================================
// CLEAN MARKDOWN
// =====================================================

function cleanMarkdown(text) {
  return text
    .replace(/\*\*/g, "**")
    .replace(/__/g, "")
    .replace(/\\\*/g, "*")
    .replace(/\\_/g, "_");
}

// =====================================================
// STYLES
// =====================================================

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #eef2ff, #f8fafc)",
    padding: "35px 20px",
    boxSizing: "border-box",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    color: "#111827",
  },

  container: {
    maxWidth: "1200px",
    margin: "0 auto",
  },

  header: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    marginBottom: "28px",
  },

  headerIcon: {
    width: "65px",
    height: "65px",
    borderRadius: "18px",
    background: "#4f46e5",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
    boxShadow:
      "0 10px 25px rgba(79, 70, 229, 0.25)",
    flexShrink: 0,
  },

  title: {
    margin: 0,
    fontSize: "30px",
    fontWeight: "800",
    color: "#111827",
  },

  subtitle: {
    margin: "8px 0 0",
    color: "#64748b",
    fontSize: "15px",
    lineHeight: 1.6,
    maxWidth: "800px",
  },

  card: {
    background: "#ffffff",
    borderRadius: "20px",
    padding: "28px",
    boxShadow:
      "0 10px 35px rgba(15, 23, 42, 0.08)",
    border:
      "1px solid #e5e7eb",
  },

  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "700",
    marginBottom: "8px",
    color: "#374151",
  },

  select: {
    width: "100%",
    padding: "14px",
    border:
      "1px solid #d1d5db",
    borderRadius: "11px",
    background: "#ffffff",
    color: "#111827",
    fontSize: "15px",
    outline: "none",
    marginBottom: "22px",
    boxSizing: "border-box",
  },

  uploadBox: {
    border:
      "2px dashed #818cf8",
    borderRadius: "15px",
    minHeight: "140px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    cursor: "pointer",
    background: "#f8faff",
    transition: "0.2s",
  },

  uploadBoxDisabled: {
    border:
      "2px dashed #cbd5e1",
    borderRadius: "15px",
    minHeight: "140px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    background: "#f1f5f9",
    cursor: "not-allowed",
  },

  hiddenInput: {
    display: "none",
  },

  uploadIcon: {
    fontSize: "40px",
    marginBottom: "8px",
  },

  uploadText: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "5px",
    color: "#4f46e5",
  },

  selectedHeader: {
    marginTop: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#1f2937",
  },

  limitText: {
    background: "#eef2ff",
    color: "#4f46e5",
    padding: "5px 10px",
    borderRadius: "20px",
    fontWeight: "700",
    fontSize: "13px",
  },

  fileList: {
    marginTop: "12px",
    display: "flex",
    flexDirection: "column",
    gap: "9px",
  },

  fileItem: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "15px",
    padding: "13px",
    background: "#f8fafc",
    border:
      "1px solid #e2e8f0",
    borderRadius: "12px",
  },

  fileLeft: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    minWidth: 0,
  },

  pdfIcon: {
    width: "40px",
    height: "40px",
    borderRadius: "9px",
    background: "#fee2e2",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },

  fileDetails: {
    minWidth: 0,
  },

  fileName: {
    fontWeight: "600",
    fontSize: "14px",
    color: "#1f2937",
    wordBreak: "break-word",
  },

  fileSize: {
    marginTop: "3px",
    fontSize: "12px",
    color: "#64748b",
  },

  removeButton: {
    width: "32px",
    height: "32px",
    border: "none",
    borderRadius: "8px",
    background: "#fee2e2",
    color: "#dc2626",
    cursor: "pointer",
    fontWeight: "700",
    flexShrink: 0,
  },

  successMessage: {
    marginTop: "18px",
    padding: "13px 15px",
    borderRadius: "10px",
    background: "#dcfce7",
    color: "#166534",
    fontSize: "14px",
    fontWeight: "600",
  },

  errorMessage: {
    marginTop: "18px",
    padding: "13px 15px",
    borderRadius: "10px",
    background: "#fee2e2",
    color: "#991b1b",
    fontSize: "14px",
    fontWeight: "600",
  },

  buttonRow: {
    display: "flex",
    gap: "12px",
    marginTop: "22px",
  },

  analyzeButton: {
    flex: 1,
    padding: "15px",
    border: "none",
    borderRadius: "11px",
    background:
      "linear-gradient(135deg, #4f46e5, #7c3aed)",
    color: "#ffffff",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow:
      "0 8px 20px rgba(79, 70, 229, 0.25)",
  },

  analyzeButtonDisabled: {
    flex: 1,
    padding: "15px",
    border: "none",
    borderRadius: "11px",
    background: "#cbd5e1",
    color: "#64748b",
    fontSize: "15px",
    fontWeight: "700",
    cursor: "not-allowed",
  },

  clearButton: {
    padding: "15px 22px",
    border:
      "1px solid #d1d5db",
    borderRadius: "11px",
    background: "#ffffff",
    color: "#374151",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },

  loadingCard: {
    marginTop: "25px",
    background: "#ffffff",
    borderRadius: "20px",
    padding: "45px 30px",
    textAlign: "center",
    boxShadow:
      "0 10px 35px rgba(15, 23, 42, 0.08)",
  },

  spinner: {
    fontSize: "48px",
  },

  loadingTitle: {
    margin: "15px 0 8px",
    fontSize: "22px",
  },

  loadingText: {
    color: "#64748b",
    lineHeight: 1.6,
  },

  progressBar: {
    maxWidth: "500px",
    height: "8px",
    margin: "25px auto 12px",
    borderRadius: "20px",
    background: "#e5e7eb",
    overflow: "hidden",
  },

  progress: {
    width: "70%",
    height: "100%",
    borderRadius: "20px",
    background:
      "linear-gradient(90deg, #4f46e5, #8b5cf6)",
  },

  smallText: {
    color: "#94a3b8",
    fontSize: "13px",
  },

  resultCard: {
    marginTop: "25px",
    background: "#ffffff",
    borderRadius: "20px",
    overflow: "hidden",
    boxShadow:
      "0 10px 35px rgba(15, 23, 42, 0.08)",
  },

  resultHeader: {
    padding: "24px 28px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    borderBottom:
      "1px solid #e5e7eb",
  },

  resultTitle: {
    margin: 0,
    fontSize: "23px",
    color: "#111827",
  },

  resultSubtitle: {
    margin: "7px 0 0",
    color: "#64748b",
    fontSize: "14px",
  },

  completedBadge: {
    padding: "8px 13px",
    borderRadius: "20px",
    background: "#dcfce7",
    color: "#166534",
    fontSize: "13px",
    fontWeight: "700",
    whiteSpace: "nowrap",
  },

  analysisBox: {
    padding: "28px",
    color: "#1f2937",
    overflowX: "auto",
  },

  analysisH1: {
    fontSize: "27px",
    margin:
      "10px 0 25px",
    color: "#111827",
  },

  analysisH2: {
    fontSize: "21px",
    margin:
      "28px 0 15px",
    color: "#3730a3",
    borderBottom:
      "1px solid #e5e7eb",
    paddingBottom: "8px",
  },

  analysisH3: {
    fontSize: "18px",
    margin:
      "22px 0 10px",
    color: "#4338ca",
  },

  paragraph: {
    margin:
      "7px 0",
    lineHeight: 1.7,
    fontSize: "15px",
  },

  numberedItem: {
    display: "flex",
    gap: "10px",
    margin:
      "9px 0",
    lineHeight: 1.6,
    fontSize: "15px",
  },

  number: {
    fontWeight: "700",
    color: "#4f46e5",
    minWidth: "28px",
  },

  bulletItem: {
    display: "flex",
    gap: "10px",
    margin:
      "8px 0",
    lineHeight: 1.6,
    fontSize: "15px",
  },

  bullet: {
    color: "#4f46e5",
    fontWeight: "900",
  },

  tableRow: {
    display: "grid",
    gridTemplateColumns:
      "minmax(170px, 1fr) minmax(250px, 2fr) minmax(250px, 2fr) minmax(170px, 1fr)",
    borderLeft:
      "1px solid #dbeafe",
    borderTop:
      "1px solid #dbeafe",
    minWidth: "750px",
  },

  tableCell: {
    padding: "11px",
    borderRight:
      "1px solid #dbeafe",
    borderBottom:
      "1px solid #dbeafe",
    fontSize: "14px",
    lineHeight: 1.5,
  },

  tableCellFirst: {
    padding: "11px",
    borderRight:
      "1px solid #dbeafe",
    borderBottom:
      "1px solid #dbeafe",
    fontSize: "14px",
    lineHeight: 1.5,
    fontWeight: "700",
    background: "#eef2ff",
    color: "#3730a3",
  },

  emptyLine: {
    height: "8px",
  },

  hr: {
    border: "none",
    borderTop:
      "1px solid #e5e7eb",
    margin:
      "20px 0",
  },

  infoCard: {
    marginTop: "25px",
    background: "#ffffff",
    borderRadius: "20px",
    padding: "25px",
    boxShadow:
      "0 10px 35px rgba(15, 23, 42, 0.06)",
  },

  infoTitle: {
    margin: "0 0 20px",
    fontSize: "19px",
  },

  steps: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(220px, 1fr))",
    gap: "18px",
  },

  step: {
    display: "flex",
    gap: "12px",
    padding: "15px",
    background: "#f8fafc",
    borderRadius: "12px",
  },

  stepNumber: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    background: "#4f46e5",
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    flexShrink: 0,
  },
};

export default PreviousPaper;