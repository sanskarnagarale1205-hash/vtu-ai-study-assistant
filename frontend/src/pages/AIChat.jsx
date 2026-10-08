import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function AIChat() {
  const navigate = useNavigate();

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const askAI = async (text) => {
    const userQuestion = text || question;

    if (!userQuestion.trim()) {
      alert("Please enter a question");
      return;
    }

    try {
      setLoading(true);
      setAnswer("");

      const token = localStorage.getItem("token");

      const response = await API.post(
        "/ai/chat",
        {
          question: userQuestion,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setAnswer(response.data.answer);
    } catch (error) {
      console.error("AI Chat Error:", error);

      setAnswer(
        error.response?.data?.message ||
          "Unable to get answer from AI."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>

      {/* HEADER */}
      <div style={styles.header}>
        <h1>🤖 AI Study Assistant</h1>

        <button
          style={styles.backButton}
          onClick={() => navigate("/dashboard")}
        >
          ← Dashboard
        </button>
      </div>

      {/* MAIN CARD */}
      <div style={styles.card}>

        <h2>How can I help you?</h2>

        <p style={styles.subtitle}>
          Ask me about DSA, DBMS, OS, Computer Networks,
          Algorithms, VTU exams and more.
        </p>

        {/* TEXT BOX */}
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Type your question here..."
          style={styles.textarea}
        />

        {/* ASK BUTTON */}
        <button
          style={styles.askButton}
          onClick={() => askAI(question)}
          disabled={loading}
        >
          {loading ? "🤖 Thinking..." : "🚀 Ask AI"}
        </button>

        {/* QUICK QUESTIONS */}
        <h3 style={styles.quickTitle}>
          Quick Questions
        </h3>

        <div style={styles.quickContainer}>

          <button
            style={styles.quickButton}
            onClick={() =>
              askAI(
                "Explain Dijkstra's Algorithm in easy words"
              )
            }
          >
            Explain Dijkstra's Algorithm
          </button>

          <button
            style={styles.quickButton}
            onClick={() =>
              askAI(
                "Give me important DBMS questions for VTU 4th semester"
              )
            }
          >
            Important DBMS Questions
          </button>

          <button
            style={styles.quickButton}
            onClick={() =>
              askAI(
                "Explain ACID properties with a simple example"
              )
            }
          >
            Explain ACID Properties
          </button>

        </div>

        {/* ANSWER */}
        {answer && (
          <div style={styles.answerBox}>
            <h2>🤖 AI Answer</h2>

            <div style={styles.answer}>
              {answer}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f7fb",
    padding: "30px",
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box",
  },

  header: {
    maxWidth: "1000px",
    margin: "0 auto 25px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  backButton: {
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: "10px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "15px",
  },

  card: {
    maxWidth: "1000px",
    margin: "auto",
    background: "white",
    padding: "35px",
    borderRadius: "16px",
    boxShadow: "0 5px 20px rgba(0,0,0,0.08)",
    boxSizing: "border-box",
  },

  subtitle: {
    color: "#666",
    fontSize: "16px",
    lineHeight: "1.6",
  },

  textarea: {
    width: "100%",
    minHeight: "140px",
    marginTop: "20px",
    padding: "15px",
    border: "1px solid #ccc",
    borderRadius: "10px",
    fontSize: "16px",
    resize: "vertical",
    boxSizing: "border-box",
    outline: "none",
  },

  askButton: {
    marginTop: "15px",
    padding: "13px 25px",
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
  },

  quickTitle: {
    marginTop: "30px",
  },

  quickContainer: {
    display: "flex",
    flexWrap: "wrap",
    gap: "10px",
  },

  quickButton: {
    padding: "12px 15px",
    background: "#eef4ff",
    color: "#2563eb",
    border: "1px solid #c7d8ff",
    borderRadius: "8px",
    cursor: "pointer",
  },

  answerBox: {
    marginTop: "30px",
    padding: "25px",
    background: "#f8fafc",
    borderRadius: "12px",
    border: "1px solid #ddd",
  },

  answer: {
    marginTop: "15px",
    whiteSpace: "pre-wrap",
    lineHeight: "1.7",
    fontSize: "16px",
    color: "#333",
  },
};

export default AIChat;