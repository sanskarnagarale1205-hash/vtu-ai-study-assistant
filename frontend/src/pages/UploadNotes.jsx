import { useState } from "react";
import axios from "axios";
import "./UploadNotes.css";

const UploadNotes = () => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  // =================================================
  // SELECT FILES
  // =================================================

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);

    setFiles(selectedFiles);
    setResult(null);
    setError("");
  };

  // =================================================
  // UPLOAD
  // =================================================

  const handleUpload = async () => {
    if (files.length === 0) {
      setError("Please select at least one PDF.");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const formData = new FormData();

      files.forEach((file) => {
        formData.append("pdfs", file);
      });

      const response = await axios.post(
        "http://localhost:5000/api/pdf/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },

          timeout: 10 * 60 * 1000,
        }
      );

      console.log("PDF response:", response.data);

      setResult(response.data);
    } catch (err) {
      console.error("Upload error:", err);

      setError(
        err.response?.data?.message ||
          err.message ||
          "PDF upload failed."
      );
    } finally {
      setLoading(false);
    }
  };

  // =================================================
  // REMOVE SELECTED FILE
  // =================================================

  const removeFile = (index) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  // =================================================
  // FORMAT FILE SIZE
  // =================================================

  const formatFileSize = (bytes) => {
    const mb = bytes / 1024 / 1024;

    return `${mb.toFixed(2)} MB`;
  };

  // =================================================
  // UI
  // =================================================

  return (
    <div className="upload-page">
      {/* HEADER */}

      <div className="upload-header">
        <div className="upload-header-icon">📚</div>

        <div>
          <h1>VTU AI Study Assistant</h1>

          <p>
            Upload your study materials and let AI
            analyze them for your VTU preparation.
          </p>
        </div>
      </div>

      {/* MAIN CARD */}

      <div className="upload-container">
        <div className="upload-card">
          <div className="upload-title">
            <h2>Upload Study Notes</h2>

            <p>
              Upload one or multiple PDF files
              containing your study material.
            </p>
          </div>

          {/* FILE SELECT AREA */}

          <div className="file-upload-box">
            <div className="upload-icon">
              📄
            </div>

            <h3>Select PDF Files</h3>

            <p>
              Choose one or multiple PDF files
            </p>

            <label className="choose-button">
              Choose PDF Files

              <input
                type="file"
                accept=".pdf,application/pdf"
                multiple
                onChange={handleFileChange}
              />
            </label>

            {files.length > 0 && (
              <div className="selected-count">
                {files.length} PDF
                {files.length > 1 ? "s" : ""} selected
              </div>
            )}
          </div>

          {/* SELECTED FILES */}

          {files.length > 0 && (
            <div className="selected-section">
              <div className="section-heading">
                <h3>Selected PDFs</h3>

                <span>
                  {files.length} file
                  {files.length > 1 ? "s" : ""}
                </span>
              </div>

              <div className="file-list">
                {files.map((file, index) => (
                  <div
                    className="file-item"
                    key={`${file.name}-${index}`}
                  >
                    <div className="file-info">
                      <div className="pdf-icon">
                        PDF
                      </div>

                      <div className="file-details">
                        <strong>
                          {file.name}
                        </strong>

                        <span>
                          {formatFileSize(
                            file.size
                          )}
                        </span>
                      </div>
                    </div>

                    <button
                      className="remove-button"
                      onClick={() =>
                        removeFile(index)
                      }
                      disabled={loading}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* UPLOAD BUTTON */}

          <button
            className="analyze-button"
            onClick={handleUpload}
            disabled={
              loading || files.length === 0
            }
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Processing PDFs...
              </>
            ) : (
              <>
                🤖 Upload & Analyze PDFs
              </>
            )}
          </button>

          {/* LOADING MESSAGE */}

          {loading && (
            <div className="loading-box">
              <div className="loading-title">
                AI is analyzing your PDFs...
              </div>

              <p>
                Please wait. Large or multiple PDFs
                may take some time to process.
              </p>
            </div>
          )}

          {/* ERROR */}

          {error && (
            <div className="error-box">
              <div className="error-title">
                ⚠️ Upload Error
              </div>

              <p>{error}</p>
            </div>
          )}

          {/* RESULT */}

          {result && (
            <div className="result-section">
              <div className="success-header">
                <div className="success-icon">
                  ✓
                </div>

                <div>
                  <h2>
                    Analysis Completed
                  </h2>

                  <p>
                    Your study material has been
                    processed successfully.
                  </p>
                </div>
              </div>

              {/* SUMMARY CARDS */}

              <div className="result-stats">
                <div className="stat-card">
                  <span>📄</span>

                  <strong>
                    {result.totalFiles || 0}
                  </strong>

                  <p>Total PDFs</p>
                </div>

                <div className="stat-card">
                  <span>✓</span>

                  <strong>
                    {result.successfulFiles ||
                      0}
                  </strong>

                  <p>Processed</p>
                </div>

                <div className="stat-card">
                  <span>⚠️</span>

                  <strong>
                    {result.failedFiles || 0}
                  </strong>

                  <p>Failed</p>
                </div>

                <div className="stat-card">
                  <span>📝</span>

                  <strong>
                    {result.totalCharacters ||
                      0}
                  </strong>

                  <p>Characters</p>
                </div>
              </div>

              {/* PDF DETAILS */}

              <div className="result-card">
                <h3>📑 PDF Details</h3>

                <div className="result-file-list">
                  {result.files?.map(
                    (file, index) => (
                      <div
                        className="result-file"
                        key={index}
                      >
                        <div className="result-file-name">
                          <strong>
                            {file.fileName}
                          </strong>
                        </div>

                        <div className="result-file-info">
                          <span>
                            Pages:{" "}
                            {file.pages || 0}
                          </span>

                          <span>
                            Characters:{" "}
                            {file.characters ||
                              0}
                          </span>

                          <span>
                            Method:{" "}
                            {file.extractionMethod ||
                              "Unknown"}
                          </span>
                        </div>

                        {file.error && (
                          <div className="file-error">
                            Error: {file.error}
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* EXTRACTED TEXT */}

              <div className="result-card">
                <h3>
                  📖 Extracted Text Preview
                </h3>

                <pre className="text-preview">
                  {result.extractedText ||
                    "No extracted text available."}
                </pre>
              </div>

              {/* AI RESULT */}

              <div className="ai-result-card">
                <div className="ai-result-header">
                  <span>🤖</span>

                  <h2>AI Analysis</h2>
                </div>

                <pre className="ai-analysis">
                  {result.aiSummary ||
                    "No AI analysis available."}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UploadNotes;