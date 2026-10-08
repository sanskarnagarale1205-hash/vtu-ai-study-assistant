import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function ImportantQuestions() {
  const navigate = useNavigate();

  const [subject, setSubject] = useState("");
  const [module, setModule] = useState("All Modules");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  // =====================================================
  // GENERATE IMPORTANT QUESTIONS
  // =====================================================

  const generateQuestions = async () => {
    if (!subject.trim()) {
      setError("Please enter a subject name.");
      return;
    }

    setLoading(true);
    setError("");
    setResult("");

    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        "http://localhost:5000/api/important-questions/generate",
        {
          subject: subject.trim(),
          module: module,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setResult(
          response.data.questions ||
            response.data.result ||
            response.data.analysis ||
            "Questions generated successfully."
        );
      } else {
        setError(
          response.data.message ||
            "Failed to generate questions."
        );
      }
    } catch (err) {
      console.error(
        "Generate questions error:",
        err
      );

      setError(
        err.response?.data?.message ||
          "Unable to generate questions. Please check your backend."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // CLEAR
  // =====================================================

  const clearForm = () => {
    setSubject("");
    setModule("All Modules");
    setResult("");
    setError("");
  };

  return (
    <div style={styles.page}>

      {/* =================================================
          HEADER
      ================================================= */}

      <header style={styles.header}>

        <div style={styles.headerLeft}>

          <div style={styles.logoBox}>
            🎓
          </div>

          <div>
            <h1 style={styles.logo}>
              VTU AI Study Assistant
            </h1>

            <p style={styles.headerSubtitle}>
              Important Questions Generator
            </p>
          </div>

        </div>

        <button
          style={styles.dashboardButton}
          onClick={() => navigate("/dashboard")}
        >
          ← Dashboard
        </button>

      </header>


      {/* =================================================
          MAIN
      ================================================= */}

      <main style={styles.container}>

        {/* PAGE TITLE */}

        <div style={styles.pageTitleSection}>

          <div style={styles.questionIcon}>
            ❓
          </div>

          <div>

            <h2 style={styles.pageTitle}>
              Important Questions
            </h2>

            <p style={styles.pageSubtitle}>
              Enter any subject and let AI generate
              important questions for your VTU exam.
            </p>

          </div>

        </div>


        {/* =================================================
            GENERATOR CARD
        ================================================= */}

        <section style={styles.card}>

          <div style={styles.cardHeader}>

            <div style={styles.cardIcon}>
              📚
            </div>

            <div>

              <h2 style={styles.cardTitle}>
                Generate VTU Important Questions
              </h2>

              <p style={styles.cardDescription}>
                Enter the subject name and select a module.
                You can enter any subject.
              </p>

            </div>

          </div>


          {/* =================================================
              SUBJECT
          ================================================= */}

          <div style={styles.formGroup}>

            <label style={styles.label}>
              Subject Name
            </label>

            <input
              type="text"
              value={subject}
              onChange={(e) =>
                setSubject(e.target.value)
              }
              placeholder="Example: DBMS, DAA, Operating System..."
              style={styles.input}
            />

            <p style={styles.helpText}>
              💡 You can type any subject name.
            </p>

          </div>


          {/* =================================================
              MODULE
          ================================================= */}

          <div style={styles.formGroup}>

            <label style={styles.label}>
              Select Module
            </label>

            <select
              value={module}
              onChange={(e) =>
                setModule(e.target.value)
              }
              style={styles.select}
            >

              <option value="All Modules">
                All Modules
              </option>

              <option value="Module 1">
                Module 1
              </option>

              <option value="Module 2">
                Module 2
              </option>

              <option value="Module 3">
                Module 3
              </option>

              <option value="Module 4">
                Module 4
              </option>

              <option value="Module 5">
                Module 5
              </option>

            </select>

          </div>


          {/* =================================================
              EXAMPLES
          ================================================= */}

          <div style={styles.examplesBox}>

            <div style={styles.examplesTitle}>
              ✨ Example subjects
            </div>

            <div style={styles.examples}>

              <button
                type="button"
                style={styles.exampleButton}
                onClick={() => setSubject("DBMS")}
              >
                DBMS
              </button>

              <button
                type="button"
                style={styles.exampleButton}
                onClick={() =>
                  setSubject(
                    "Design and Analysis of Algorithms"
                  )
                }
              >
                DAA
              </button>

              <button
                type="button"
                style={styles.exampleButton}
                onClick={() =>
                  setSubject("Operating System")
                }
              >
                Operating System
              </button>

              <button
                type="button"
                style={styles.exampleButton}
                onClick={() =>
                  setSubject("Computer Networks")
                }
              >
                Computer Networks
              </button>

            </div>

          </div>


          {/* =================================================
              ERROR
          ================================================= */}

          {error && (
            <div style={styles.error}>
              ❌ {error}
            </div>
          )}


          {/* =================================================
              BUTTONS
          ================================================= */}

          <div style={styles.buttonRow}>

            <button
              type="button"
              style={styles.clearButton}
              onClick={clearForm}
              disabled={loading}
            >
              Clear
            </button>

            <button
              type="button"
              style={styles.generateButton}
              onClick={generateQuestions}
              disabled={loading}
            >

              {loading ? (
                <>
                  ⏳ Generating...
                </>
              ) : (
                <>
                  ✨ Generate Important Questions →
                </>
              )}

            </button>

          </div>

        </section>


        {/* =================================================
            RESULT
        ================================================= */}

        {result && (
          <section style={styles.resultCard}>

            <div style={styles.resultHeader}>

              <div>

                <h2 style={styles.resultTitle}>
                  🎯 Important Questions
                </h2>

                <p style={styles.resultSubtitle}>
                  Subject:{" "}
                  <strong>{subject}</strong>
                  {" • "}
                  {module}
                </p>

              </div>

              <button
                style={styles.newButton}
                onClick={clearForm}
              >
                + New
              </button>

            </div>


            <div style={styles.resultContent}>
              {result}
            </div>

          </section>
        )}

      </main>


      {/* =================================================
          FOOTER
      ================================================= */}

      <footer style={styles.footer}>

        <strong>
          🎓 VTU AI Study Assistant
        </strong>

        <span>
          Made for VTU CSE Students ❤️
        </span>

      </footer>

    </div>
  );
}


/* =====================================================
   STYLES
===================================================== */

const styles = {

  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #f4f7ff 0%, #eef2ff 50%, #f8fafc 100%)",
    color: "#111827",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    boxSizing: "border-box",
  },


  /* HEADER */

  header: {
    minHeight: "82px",
    background: "#ffffff",
    borderBottom:
      "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 45px",
    boxSizing: "border-box",
    boxShadow:
      "0 4px 15px rgba(0,0,0,0.05)",
  },

  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },

  logoBox: {
    width: "48px",
    height: "48px",
    borderRadius: "14px",
    background:
      "linear-gradient(135deg, #2563eb, #4f46e5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "25px",
    boxShadow:
      "0 7px 18px rgba(37,99,235,0.25)",
  },

  logo: {
    margin: 0,
    color: "#111827",
    fontSize: "22px",
    fontWeight: "800",
  },

  headerSubtitle: {
    margin: "3px 0 0",
    color: "#64748b",
    fontSize: "13px",
  },

  dashboardButton: {
    border: "none",
    borderRadius: "10px",
    padding: "12px 20px",
    background: "#2563eb",
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },


  /* MAIN */

  container: {
    width: "100%",
    maxWidth: "1050px",
    margin: "0 auto",
    padding: "45px 25px 70px",
    boxSizing: "border-box",
  },


  /* TITLE */

  pageTitleSection: {
    display: "flex",
    alignItems: "center",
    gap: "18px",
    marginBottom: "30px",
  },

  questionIcon: {
    width: "62px",
    height: "62px",
    borderRadius: "18px",
    background: "#e0e7ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "32px",
    flexShrink: 0,
  },

  pageTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "32px",
    fontWeight: "800",
  },

  pageSubtitle: {
    margin: "7px 0 0",
    color: "#64748b",
    fontSize: "15px",
    lineHeight: "1.6",
  },


  /* CARD */

  card: {
    background: "#ffffff",
    borderRadius: "22px",
    padding: "35px",
    border:
      "1px solid #e5e7eb",
    boxShadow:
      "0 12px 35px rgba(15,23,42,0.08)",
    boxSizing: "border-box",
  },

  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    paddingBottom: "25px",
    borderBottom:
      "1px solid #e5e7eb",
    marginBottom: "28px",
  },

  cardIcon: {
    width: "52px",
    height: "52px",
    borderRadius: "14px",
    background: "#eef2ff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "26px",
    flexShrink: 0,
  },

  cardTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "21px",
    fontWeight: "800",
  },

  cardDescription: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: "14px",
  },


  /* FORM */

  formGroup: {
    marginBottom: "24px",
  },

  label: {
    display: "block",
    marginBottom: "9px",
    color: "#111827",
    fontSize: "15px",
    fontWeight: "700",
  },

  input: {
    width: "100%",
    height: "52px",
    padding: "0 16px",
    border:
      "1px solid #cbd5e1",
    borderRadius: "11px",
    background: "#ffffff",
    color: "#111827",
    fontSize: "16px",
    outline: "none",
    boxSizing: "border-box",
  },

  select: {
    width: "100%",
    height: "52px",
    padding: "0 16px",
    border:
      "1px solid #cbd5e1",
    borderRadius: "11px",
    background: "#ffffff",
    color: "#111827",
    fontSize: "16px",
    outline: "none",
    cursor: "pointer",
    boxSizing: "border-box",
  },

  helpText: {
    margin: "7px 0 0",
    color: "#64748b",
    fontSize: "12px",
  },


  /* EXAMPLES */

  examplesBox: {
    background: "#f8fafc",
    border:
      "1px solid #e2e8f0",
    borderRadius: "13px",
    padding: "16px",
    marginBottom: "25px",
  },

  examplesTitle: {
    color: "#334155",
    fontSize: "13px",
    fontWeight: "700",
    marginBottom: "10px",
  },

  examples: {
    display: "flex",
    flexWrap: "wrap",
    gap: "9px",
  },

  exampleButton: {
    border:
      "1px solid #c7d2fe",
    background: "#ffffff",
    color: "#3730a3",
    borderRadius: "20px",
    padding: "7px 13px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer",
  },


  /* ERROR */

  error: {
    background: "#fef2f2",
    border:
      "1px solid #fecaca",
    color: "#b91c1c",
    padding: "13px 15px",
    borderRadius: "10px",
    marginBottom: "20px",
    fontSize: "14px",
    fontWeight: "600",
  },


  /* BUTTONS */

  buttonRow: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "10px",
  },

  clearButton: {
    border:
      "1px solid #cbd5e1",
    background: "#ffffff",
    color: "#334155",
    padding: "13px 20px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },

  generateButton: {
    border: "none",
    background:
      "linear-gradient(135deg, #2563eb, #4f46e5)",
    color: "#ffffff",
    padding: "13px 22px",
    borderRadius: "10px",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow:
      "0 7px 18px rgba(37,99,235,0.22)",
  },


  /* RESULT */

  resultCard: {
    marginTop: "30px",
    background: "#ffffff",
    borderRadius: "22px",
    border:
      "1px solid #e5e7eb",
    boxShadow:
      "0 12px 35px rgba(15,23,42,0.08)",
    overflow: "hidden",
  },

  resultHeader: {
    padding: "22px 28px",
    borderBottom:
      "1px solid #e5e7eb",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "20px",
  },

  resultTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "21px",
    fontWeight: "800",
  },

  resultSubtitle: {
    margin: "5px 0 0",
    color: "#64748b",
    fontSize: "13px",
  },

  newButton: {
    border: "none",
    background: "#eef2ff",
    color: "#3730a3",
    padding: "10px 15px",
    borderRadius: "9px",
    fontWeight: "700",
    cursor: "pointer",
  },

  resultContent: {
    padding: "28px",
    whiteSpace: "pre-wrap",
    color: "#1f2937",
    fontSize: "15px",
    lineHeight: "1.75",
    fontFamily:
      "Arial, Helvetica, sans-serif",
    overflowX: "auto",
  },


  /* FOOTER */

  footer: {
    background: "#111827",
    color: "#ffffff",
    padding: "25px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "20px",
    flexWrap: "wrap",
    fontSize: "13px",
  },

};

export default ImportantQuestions;