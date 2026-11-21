import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import ReactMarkdown from "react-markdown";
import "./UploadNotes.css";

const API_URL = "http://localhost:5000/api/pdf/upload";
const MAX_FILES = 10;
const MAX_SIZE = 100 * 1024 * 1024;
const PREVIEW_LIMIT = 3000;

const fileKey = (file) => `${file.name}-${file.size}-${file.lastModified}`;

const formatSize = (bytes) => {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
};

const countOf = (value) =>
  Array.isArray(value) ? value.length : Number(value) || 0;

function UploadNotes() {
  const navigate = useNavigate();

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [percent, setPercent] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [dragActive, setDragActive] = useState(false);
  const [showFullText, setShowFullText] = useState(false);

  const inputRef = useRef(null);
  const abortRef = useRef(null);

  const addFiles = (picked) => {
    setError("");
    setNotice("");

    const pdfs = picked.filter(
      (file) =>
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf")
    );

    const rejected = picked.length - pdfs.length;

    const keys = new Set(files.map(fileKey));

    const fresh = pdfs.filter(
      (file) => !keys.has(fileKey(file)) && file.size <= MAX_SIZE
    );

    const room = Math.max(0, MAX_FILES - files.length);
    const accepted = fresh.slice(0, room);

    const notes = [];

    if (rejected) notes.push(`${rejected} file(s) skipped (PDF only).`);
    if (pdfs.length - fresh.length > 0) notes.push("Some duplicates or files over 100 MB were skipped.");
    if (fresh.length > accepted.length) notes.push(`Maximum ${MAX_FILES} PDFs allowed.`);

    if (notes.length) setNotice(notes.join(" "));

    if (accepted.length) {
      setFiles([...files, ...accepted]);
      setResult(null);
    }
  };

  const onPick = (event) => {
    addFiles(Array.from(event.target.files || []));
    event.target.value = "";
  };

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (!files.length) {
      setError("Please select at least one PDF.");
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError("");
    setNotice("");
    setResult(null);
    setPercent(0);
    setShowFullText(false);

    try {
      const formData = new FormData();

      files.forEach((file) => formData.append("pdfs", file));

      const token = localStorage.getItem("token");

      const response = await axios.post(API_URL, formData, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        timeout: 10 * 60 * 1000,
        signal: controller.signal,
        onUploadProgress: (event) => {
          if (event.total) {
            setPercent(Math.round((event.loaded * 100) / event.total));
          }
        },
      });

      setResult(response.data);
    } catch (err) {
      if (axios.isCancel(err) || err.code === "ERR_CANCELED") {
        setNotice("Upload cancelled.");
        return;
      }

      console.error("Upload error:", err);

      setError(
        err.response?.data?.message || err.message || "PDF upload failed."
      );
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const cancel = () => abortRef.current?.abort();

  const copySummary = async () => {
    try {
      await navigator.clipboard.writeText(result?.aiSummary || "");
      setNotice("Summary copied.");
    } catch {
      setError("Could not copy automatically.");
    }
  };

  const downloadSummary = () => {
    const blob = new Blob([result?.aiSummary || ""], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "VTU_Notes_Summary.txt";
    link.click();

    URL.revokeObjectURL(url);
  };

  const newUpload = () => {
    setFiles([]);
    setResult(null);
    setError("");
    setNotice("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const text = result?.extractedText || "";
  const textShown = showFullText ? text : text.slice(0, PREVIEW_LIMIT);

  return (
    <div className="un-page">
      <section className="un-hero">
        <div className="un-hero-icon">📄</div>

        <div>
          <p className="un-eyebrow">AI NOTES ANALYZER</p>
          <h1>Upload Study Notes</h1>
          <p className="un-sub">
            Upload up to {MAX_FILES} PDFs. The AI reads them and writes a
            clear summary for your VTU preparation.
          </p>
        </div>
      </section>

      <section className="un-card">
        <input
          ref={inputRef}
          type="file"
          accept=".pdf,application/pdf"
          multiple
          hidden
          onChange={onPick}
        />

        <div
          className={`un-drop ${dragActive ? "un-drop-active" : ""}`}
          onClick={() => !loading && inputRef.current?.click()}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);
            if (!loading) addFiles(Array.from(event.dataTransfer.files || []));
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !loading) inputRef.current?.click();
          }}
        >
          <div className="un-drop-icon">⬆️</div>
          <h3>Click or drag PDF files here</h3>
          <p>PDF only · up to {MAX_FILES} files · 100 MB each</p>
          <span className="un-browse">Browse PDF Files</span>
        </div>

        {files.length > 0 && (
          <>
            <div className="un-summary">
              <div>
                <strong>{files.length} PDF(s) selected</strong>
                <span> · {formatSize(totalSize)}</span>
              </div>

              <button
                type="button"
                className="un-link-red"
                onClick={() => setFiles([])}
                disabled={loading}
              >
                Clear all
              </button>
            </div>

            <div className="un-files">
              {files.map((file, index) => (
                <div className="un-file" key={fileKey(file)}>
                  <div className="un-pdf">PDF</div>

                  <div className="un-file-info">
                    <strong title={file.name}>{file.name}</strong>
                    <span>{formatSize(file.size)}</span>
                  </div>

                  <button
                    type="button"
                    className="un-x"
                    onClick={() => removeFile(index)}
                    disabled={loading}
                    aria-label={`Remove ${file.name}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading ? (
          <button
            type="button"
            className="un-primary"
            onClick={handleUpload}
            disabled={!files.length}
          >
            🤖 Upload & Analyze PDFs
          </button>
        ) : (
          <button type="button" className="un-cancel" onClick={cancel}>
            ✖ Cancel
          </button>
        )}

        {loading && (
          <div className="un-loading">
            <div className="un-spinner" />

            {percent < 100 ? (
              <>
                <p>Uploading PDFs... {percent}%</p>
                <div className="un-bar">
                  <div style={{ width: `${percent}%` }} />
                </div>
              </>
            ) : (
              <p>
                Upload complete. The AI is reading your PDFs. Large or
                scanned files can take a few minutes.
              </p>
            )}
          </div>
        )}

        {notice && <div className="un-notice">{notice}</div>}
        {error && <div className="un-error">⚠️ {error}</div>}
      </section>

      {result && (
        <section className="un-card">
          <div className="un-done">
            <div className="un-done-icon">✓</div>

            <div>
              <h2>Analysis Completed</h2>
              <p>Your study material has been processed successfully.</p>
            </div>
          </div>

          <div className="un-stats">
            <div><span>📄</span><strong>{result.totalFiles || 0}</strong><p>Total PDFs</p></div>
            <div><span>✅</span><strong>{countOf(result.successfulFiles)}</strong><p>Processed</p></div>
            <div><span>⚠️</span><strong>{countOf(result.failedFiles)}</strong><p>Failed</p></div>
            <div><span>📝</span><strong>{(result.totalCharacters || 0).toLocaleString()}</strong><p>Characters</p></div>
          </div>

          <div className="un-ai">
            <div className="un-ai-head">
              <h2>🤖 AI Summary</h2>

              <div className="un-ai-actions">
                <button type="button" onClick={copySummary}>📋 Copy</button>
                <button type="button" onClick={downloadSummary}>⬇ Download</button>
                <button type="button" onClick={() => navigate("/important-questions")}>⭐ Questions</button>
              </div>
            </div>

            <div className="un-md">
              <ReactMarkdown>
                {result.aiSummary || "No AI analysis available."}
              </ReactMarkdown>
            </div>
          </div>

          {Array.isArray(result.files) && result.files.length > 0 && (
            <div className="un-block">
              <h3>📑 PDF Details</h3>

              {result.files.map((file, index) => (
                <div className="un-detail" key={index}>
                  <strong>{file.fileName}</strong>

                  <div>
                    <span>Pages: {file.pages || 0}</span>
                    <span>Characters: {(file.characters || 0).toLocaleString()}</span>
                    <span>Method: {file.extractionMethod || "Unknown"}</span>
                  </div>

                  {file.error && <p className="un-detail-error">Error: {file.error}</p>}
                </div>
              ))}
            </div>
          )}

          <div className="un-block">
            <h3>📖 Extracted Text Preview</h3>

            <pre className="un-pre">{textShown || "No extracted text available."}</pre>

            {text.length > PREVIEW_LIMIT && (
              <button
                type="button"
                className="un-link"
                onClick={() => setShowFullText((value) => !value)}
              >
                {showFullText ? "Show less" : "Show full text"}
              </button>
            )}
          </div>

          <button type="button" className="un-primary" onClick={newUpload}>
            ➕ Upload New Notes
          </button>
        </section>
      )}
    </div>
  );
}

export default UploadNotes;