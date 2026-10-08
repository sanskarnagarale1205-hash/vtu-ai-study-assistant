import { useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";

function Quiz() {
  const navigate = useNavigate();

  const [subject, setSubject] = useState("DBMS");
  const [module, setModule] = useState("Module 1");

  const [quiz, setQuiz] = useState([]);
  const [answers, setAnswers] = useState({});
  const [score, setScore] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateQuiz = async () => {
    try {
      setLoading(true);
      setQuiz([]);
      setAnswers({});
      setScore(null);

      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login first");
        navigate("/");
        return;
      }

      const response = await API.post(
        "/ai/quiz",
        {
          subject,
          module,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setQuiz(response.data.quiz);
      } else {
        alert(
          response.data.message || "Failed to generate quiz"
        );
      }
    } catch (error) {
      console.error("Quiz Error:", error);

      alert(
        error.response?.data?.message ||
          "Unable to generate quiz"
      );
    } finally {
      setLoading(false);
    }
  };

  const selectAnswer = (questionIndex, optionIndex) => {
    if (score !== null) return;

    setAnswers((previous) => ({
      ...previous,
      [questionIndex]: optionIndex,
    }));
  };

  const submitQuiz = () => {
    if (quiz.length === 0) return;

    if (Object.keys(answers).length !== quiz.length) {
      alert("Please answer all questions before submitting.");
      return;
    }

    let totalScore = 0;

    quiz.forEach((question, index) => {
      if (answers[index] === question.answer) {
        totalScore++;
      }
    });

    setScore(totalScore);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const resetQuiz = () => {
    setQuiz([]);
    setAnswers({});
    setScore(null);
  };

  return (
    <div style={styles.page}>

      {/* HEADER */}
      <div style={styles.header}>
        <h1 style={styles.mainTitle}>
          📝 Generate Quiz
        </h1>

        <button
          style={styles.backButton}
          onClick={() => navigate("/dashboard")}
        >
          ← Dashboard
        </button>
      </div>

      {/* QUIZ SETTINGS */}
      <div style={styles.card}>

        <h2 style={styles.heading}>
          🎯 Create VTU Quiz
        </h2>

        <p style={styles.description}>
          Select a subject and module. AI will create
          10 multiple-choice questions.
        </p>

        <label style={styles.label}>
          Select Subject
        </label>

        <select
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          style={styles.input}
        >
          <option value="DBMS">DBMS</option>
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
          <option value="Java">Java</option>
          <option value="Python">Python</option>
        </select>

        <label style={styles.label}>
          Select Module
        </label>

        <select
          value={module}
          onChange={(e) => setModule(e.target.value)}
          style={styles.input}
        >
          <option value="Module 1">Module 1</option>
          <option value="Module 2">Module 2</option>
          <option value="Module 3">Module 3</option>
          <option value="Module 4">Module 4</option>
          <option value="Module 5">Module 5</option>
        </select>

        <button
          style={{
            ...styles.generateButton,
            opacity: loading ? 0.7 : 1,
          }}
          onClick={generateQuiz}
          disabled={loading}
        >
          {loading
            ? "🤖 Generating Quiz..."
            : "🚀 Generate Quiz"}
        </button>
      </div>

      {/* SCORE */}
      {score !== null && (
        <div style={styles.scoreCard}>

          <div style={styles.scoreIcon}>
            {score >= 7 ? "🏆" : score >= 5 ? "👏" : "📚"}
          </div>

          <h1 style={styles.scoreTitle}>
            Quiz Completed!
          </h1>

          <div style={styles.scoreNumber}>
            {score} / {quiz.length}
          </div>

          <p style={styles.scoreMessage}>
            {score === 10
              ? "Excellent! Perfect score!"
              : score >= 7
              ? "Very good! Keep it up!"
              : score >= 5
              ? "Good job! Keep practicing."
              : "Keep studying and try again!"}
          </p>

          <button
            style={styles.retryButton}
            onClick={resetQuiz}
          >
            🔄 New Quiz
          </button>
        </div>
      )}

      {/* QUIZ QUESTIONS */}
      {quiz.length > 0 && (
        <div style={styles.quizContainer}>

          <div style={styles.quizHeader}>
            <h2 style={styles.quizTitle}>
              📚 {subject}
            </h2>

            <p style={styles.moduleText}>
              {module} • {quiz.length} Questions
            </p>
          </div>

          {quiz.map((item, index) => (
            <div
              key={index}
              style={styles.questionCard}
            >

              {/* QUESTION */}
              <h3 style={styles.question}>
                <span style={styles.questionNumber}>
                  {index + 1}
                </span>

                {item.question}
              </h3>

              {/* OPTIONS */}
              <div style={styles.optionsContainer}>

                {item.options.map(
                  (option, optionIndex) => {

                    const selected =
                      answers[index] === optionIndex;

                    const correct =
                      score !== null &&
                      item.answer === optionIndex;

                    const wrong =
                      score !== null &&
                      selected &&
                      item.answer !== optionIndex;

                    let optionStyle = {
                      ...styles.option,
                    };

                    if (selected) {
                      optionStyle = {
                        ...optionStyle,
                        backgroundColor: "#dbeafe",
                        borderColor: "#2563eb",
                        color: "#111827",
                        fontWeight: "bold",
                      };
                    }

                    if (correct) {
                      optionStyle = {
                        ...optionStyle,
                        backgroundColor: "#dcfce7",
                        borderColor: "#16a34a",
                        color: "#14532d",
                        fontWeight: "bold",
                      };
                    }

                    if (wrong) {
                      optionStyle = {
                        ...optionStyle,
                        backgroundColor: "#fee2e2",
                        borderColor: "#dc2626",
                        color: "#7f1d1d",
                        fontWeight: "bold",
                      };
                    }

                    return (
                      <button
                        key={optionIndex}
                        style={optionStyle}
                        onClick={() =>
                          selectAnswer(
                            index,
                            optionIndex
                          )
                        }
                        disabled={score !== null}
                      >
                        <span style={styles.optionLetter}>
                          {String.fromCharCode(
                            65 + optionIndex
                          )}
                        </span>

                        <span style={styles.optionText}>
                          {option}
                        </span>

                        {correct && (
                          <span style={styles.resultIcon}>
                            ✓
                          </span>
                        )}

                        {wrong && (
                          <span style={styles.resultIcon}>
                            ✕
                          </span>
                        )}
                      </button>
                    );
                  }
                )}

              </div>

            </div>
          ))}

          {/* SUBMIT */}
          {score === null && (
            <button
              style={styles.submitButton}
              onClick={submitQuiz}
            >
              ✅ Submit Quiz
            </button>
          )}

        </div>
      )}

    </div>
  );
}


/* ============================= */
/* STYLES */
/* ============================= */

const styles = {

  page: {
    minHeight: "100vh",
    backgroundColor: "#f1f5f9",
    padding: "30px",
    fontFamily: "Arial, sans-serif",
    boxSizing: "border-box",
    color: "#111827",
  },

  header: {
    maxWidth: "950px",
    margin: "0 auto 25px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "15px",
  },

  mainTitle: {
    margin: 0,
    color: "#111827",
    fontSize: "30px",
  },

  backButton: {
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    padding: "11px 18px",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "15px",
    fontWeight: "bold",
  },

  card: {
    maxWidth: "950px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
    padding: "35px",
    borderRadius: "16px",
    boxShadow: "0 5px 20px rgba(0,0,0,0.08)",
    boxSizing: "border-box",
  },

  heading: {
    marginTop: 0,
    color: "#111827",
  },

  description: {
    color: "#4b5563",
    lineHeight: "1.6",
    fontSize: "16px",
  },

  label: {
    display: "block",
    marginTop: "20px",
    marginBottom: "8px",
    fontWeight: "bold",
    color: "#111827",
  },

  input: {
    width: "100%",
    padding: "13px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "16px",
    backgroundColor: "#ffffff",
    color: "#111827",
    boxSizing: "border-box",
  },

  generateButton: {
    width: "100%",
    marginTop: "25px",
    padding: "15px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  },

  quizContainer: {
    maxWidth: "950px",
    margin: "30px auto",
  },

  quizHeader: {
    backgroundColor: "#ffffff",
    padding: "25px",
    borderRadius: "12px",
    marginBottom: "20px",
    boxShadow: "0 3px 12px rgba(0,0,0,0.06)",
  },

  quizTitle: {
    margin: 0,
    color: "#111827",
  },

  moduleText: {
    color: "#64748b",
    marginBottom: 0,
  },

  questionCard: {
    backgroundColor: "#ffffff",
    padding: "25px",
    marginBottom: "20px",
    borderRadius: "12px",
    boxShadow: "0 3px 12px rgba(0,0,0,0.06)",
    border: "1px solid #e2e8f0",
  },

  question: {
    color: "#111827",
    lineHeight: "1.6",
    marginTop: 0,
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
  },

  questionNumber: {
    minWidth: "32px",
    height: "32px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "14px",
    flexShrink: 0,
  },

  optionsContainer: {
    marginTop: "20px",
  },

  option: {
    display: "flex",
    alignItems: "center",
    width: "100%",
    minHeight: "55px",
    padding: "12px 15px",
    marginTop: "10px",
    textAlign: "left",
    backgroundColor: "#ffffff",
    color: "#111827",
    border: "2px solid #cbd5e1",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "16px",
    lineHeight: "1.4",
    boxSizing: "border-box",
  },

  optionLetter: {
    width: "32px",
    height: "32px",
    minWidth: "32px",
    backgroundColor: "#e2e8f0",
    color: "#111827",
    borderRadius: "50%",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    marginRight: "12px",
  },

  optionText: {
    color: "#111827",
    flex: 1,
  },

  resultIcon: {
    fontSize: "22px",
    marginLeft: "10px",
    fontWeight: "bold",
  },

  submitButton: {
    width: "100%",
    padding: "16px",
    backgroundColor: "#16a34a",
    color: "#ffffff",
    border: "none",
    borderRadius: "10px",
    fontSize: "17px",
    fontWeight: "bold",
    cursor: "pointer",
    marginBottom: "30px",
  },

  scoreCard: {
    maxWidth: "950px",
    margin: "30px auto",
    padding: "35px",
    textAlign: "center",
    backgroundColor: "#ffffff",
    borderRadius: "15px",
    boxShadow: "0 5px 20px rgba(0,0,0,0.08)",
    border: "1px solid #e2e8f0",
  },

  scoreIcon: {
    fontSize: "50px",
  },

  scoreTitle: {
    color: "#111827",
  },

  scoreNumber: {
    fontSize: "48px",
    fontWeight: "bold",
    color: "#2563eb",
    margin: "15px 0",
  },

  scoreMessage: {
    color: "#4b5563",
    fontSize: "18px",
  },

  retryButton: {
    padding: "12px 25px",
    backgroundColor: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "16px",
    fontWeight: "bold",
  },
};

export default Quiz;