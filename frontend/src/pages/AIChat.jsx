import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import API from "../services/api";
import "./AIChat.css";

const STORAGE_KEY = "vtuChatHistory";

const SUGGESTIONS = [
  { icon: "🧮", text: "Explain Dijkstra's Algorithm in easy words" },
  { icon: "⭐", text: "Give me important DBMS questions for VTU 4th semester" },
  { icon: "🔒", text: "Explain ACID properties with a simple example" },
  { icon: "⚙️", text: "Difference between process and thread" },
  { icon: "🗂️", text: "Explain normalization with examples" },
  { icon: "🛑", text: "What is deadlock? How can it be prevented?" },
];

const loadHistory = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
};

function AIChat() {
  const [messages, setMessages] = useState(loadHistory);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const bottomRef = useRef(null);

  // Remember the conversation
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-40)));
    } catch {
      // storage blocked: the chat still works
    }
  }, [messages]);

  // Scroll to the newest message
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = async (text) => {
    const question = (text ?? input).trim();

    if (!question || loading) return;

    setMessages((previous) => [
      ...previous,
      { id: Date.now(), role: "user", text: question },
    ]);

    setInput("");
    setLoading(true);

    try {
      const response = await API.post("/ai/chat", { question });

      const answer =
        response.data.answer ||
        "I could not find an answer. Please try again.";

      setMessages((previous) => [
        ...previous,
        { id: Date.now() + 1, role: "ai", text: answer },
      ]);
    } catch (error) {
      console.error("AI Chat Error:", error);

      setMessages((previous) => [
        ...previous,
        {
          id: Date.now() + 1,
          role: "ai",
          isError: true,
          text:
            error.response?.data?.message ||
            "Unable to get an answer from the AI. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const onKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  const copyMessage = async (message) => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopiedId(message.id);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // clipboard blocked
    }
  };

  const clearChat = () => {
    if (window.confirm("Clear the whole conversation?")) {
      setMessages([]);
    }
  };

  return (
    <div className="ac-page">
      <div className="ac-head">
        <div className="ac-head-left">
          <div className="ac-logo">🤖</div>

          <div>
            <h2>AI Study Assistant</h2>
            <span>
              <i className="ac-online" /> Online · Ask anything about VTU
            </span>
          </div>
        </div>

        {messages.length > 0 && (
          <button type="button" className="ac-clear" onClick={clearChat}>
            🗑 Clear chat
          </button>
        )}
      </div>

      <div className="ac-scroll">
        {messages.length === 0 && (
          <div className="ac-welcome">
            <div className="ac-big">🤖</div>

            <h1>How can I help you today?</h1>

            <p>
              Ask about DSA, DBMS, OS, Computer Networks, Algorithms, VTU
              exams and more.
            </p>

            <div className="ac-suggestions">
              {SUGGESTIONS.map((item) => (
                <button
                  type="button"
                  key={item.text}
                  className="ac-suggestion"
                  onClick={() => send(item.text)}
                >
                  <span>{item.icon}</span>
                  {item.text}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`ac-row ${message.role === "user" ? "ac-row-user" : ""}`}
          >
            <div className="ac-avatar">
              {message.role === "user" ? "🧑" : "🤖"}
            </div>

            <div
              className={`ac-bubble ${
                message.role === "user" ? "ac-bubble-user" : "ac-bubble-ai"
              } ${message.isError ? "ac-bubble-error" : ""}`}
            >
              {message.role === "user" ? (
                <p className="ac-user-text">{message.text}</p>
              ) : (
                <>
                  <div className="ac-md">
                    <ReactMarkdown>{message.text}</ReactMarkdown>
                  </div>

                  {!message.isError && (
                    <button
                      type="button"
                      className="ac-copy"
                      onClick={() => copyMessage(message)}
                    >
                      {copiedId === message.id ? "✓ Copied" : "📋 Copy"}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="ac-row">
            <div className="ac-avatar">🤖</div>

            <div className="ac-bubble ac-bubble-ai ac-typing">
              <span />
              <span />
              <span />
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="ac-composer">
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type your question... (Enter to send, Shift+Enter for a new line)"
          rows={1}
          disabled={loading}
        />

        <button
          type="button"
          className="ac-send"
          onClick={() => send()}
          disabled={loading || !input.trim()}
        >
          {loading ? "..." : "Send ➤"}
        </button>
      </div>
    </div>
  );
}

export default AIChat;