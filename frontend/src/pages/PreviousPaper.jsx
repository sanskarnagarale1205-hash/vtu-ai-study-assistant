import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { jsPDF } from "jspdf";
import "./PreviousPaper.css";
import {
  parseReport,
  blockText,
  importanceLevel,
  pdfSafe,
} from "./reportParser";

// =====================================================
// CONFIGURATION
// =====================================================

const API_URL = "http://localhost:5000/api/previous-papers";

const MAX_FILES = 10;
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB per file

const SUBJECT_SUGGESTIONS = [
  "Database Management Systems",
  "Design and Analysis of Algorithms",
  "Operating Systems",
  "Computer Networks",
  "Data Structures",
  "Object Oriented Programming with Java",
  "Python Programming",
  "Software Engineering",
  "Theory of Computation",
  "Artificial Intelligence",
  "Machine Learning",
  "Engineering Mathematics",
];

const fileKey = (file) => `${file.name}-${file.size}-${file.lastModified}`;

const LEVEL_LABEL = {
  high: "Extremely Important",
  mid: "Very Important",
  low: "Important",
};

const FILTERS = [
  ["all", "All"],
  ["high", "Extremely Important"],
  ["mid", "Very Important"],
  ["low", "Important"],
];

// Highlights the search word inside a piece of text
const highlight = (text, term) => {
  if (!term || !text) return text;

  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const parts = String(text).split(new RegExp(`(${escaped})`, "gi"));

  return parts.map((part, i) =>
    part.toLowerCase() === term.toLowerCase() ? (
      <mark key={i}>{part}</mark>
    ) : (
      part
    )
  );
};

function PreviousPaper() {
  // =====================================================
  // STATE
  // =====================================================

  const [subject, setSubject] = useState("");
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [analysisInfo, setAnalysisInfo] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const [levelFilter, setLevelFilter] = useState("all");
  const [collapsed, setCollapsed] = useState({});
  const [studied, setStudied] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("ppStudied") || "{}");
    } catch {
      return {};
    }
  });

  const fileInputRef = useRef(null);
  const resultsRef = useRef(null);
  const abortRef = useRef(null);

  useEffect(() => {
    if (analysis && resultsRef.current) {
      resultsRef.current.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [analysis]);

  // =====================================================
  // ADD FILES
  // =====================================================

  const processFiles = (selectedFiles) => {
    setError("");
    setMessage("");

    if (!selectedFiles.length) return;

    const validFiles = [];
    const invalidFiles = [];

    selectedFiles.forEach((file) => {
      const isPDF =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");

      if (!isPDF) {
        invalidFiles.push(`${file.name} (not a PDF)`);
      } else if (file.size > MAX_FILE_SIZE) {
        invalidFiles.push(`${file.name} (larger than 50 MB)`);
      } else {
        validFiles.push(file);
      }
    });

    const existingKeys = new Set(files.map(fileKey));

    const uniqueNewFiles = validFiles.filter(
      (file) => !existingKeys.has(fileKey(file))
    );

    const availableSlots = Math.max(0, MAX_FILES - files.length);
    const filesToAdd = uniqueNewFiles.slice(0, availableSlots);

    const notes = [];

    if (invalidFiles.length) {
      notes.push(`Rejected: ${invalidFiles.join(", ")}.`);
    }

    if (uniqueNewFiles.length > filesToAdd.length) {
      notes.push(`Maximum ${MAX_FILES} PDFs allowed.`);
    }

    if (filesToAdd.length > 0) {
      notes.push(`${filesToAdd.length} PDF(s) added.`);

      setFiles([...files, ...filesToAdd]);
      setAnalysis("");
      setAnalysisInfo(null);
      setSearchText("");
    } else if (validFiles.length > 0 && uniqueNewFiles.length === 0) {
      notes.push("These PDFs are already selected.");
    }

    const hasProblem =
      invalidFiles.length > 0 || uniqueNewFiles.length > filesToAdd.length;

    if (hasProblem) {
      setError(notes.join(" "));
    } else {
      setMessage(notes.join(" "));
    }
  };

  const handleFileChange = (event) => {
    processFiles(Array.from(event.target.files || []));
    event.target.value = "";
  };

  const removeFile = (index) => {
    setFiles((previousFiles) =>
      previousFiles.filter((_, i) => i !== index)
    );

    setMessage("");
    setError("");
  };

  const clearFiles = () => {
    setFiles([]);
    setError("");
    setMessage("All selected PDFs have been removed.");
    setAnalysis("");
    setAnalysisInfo(null);
    setSearchText("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const startNewAnalysis = () => {
    setSubject("");
    setFiles([]);
    setAnalysis("");
    setAnalysisInfo(null);
    setSearchText("");
    setLevelFilter("all");
    setCollapsed({});
    setError("");
    setMessage("");
    setUploadPercent(0);

    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const totalFileSize = files.reduce((total, file) => total + file.size, 0);

  // =====================================================
  // ANALYZE
  // =====================================================

  const handleAnalyze = async () => {
    setError("");
    setMessage("");
    setAnalysis("");
    setAnalysisInfo(null);
    setSearchText("");
    setLevelFilter("all");
    setCollapsed({});
    setUploadPercent(0);

    if (!subject.trim()) {
      setError("Please type a subject name.");
      return;
    }

    if (!files.length) {
      setError("Please select at least one PDF.");
      return;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    try {
      setLoading(true);

      const formData = new FormData();

      files.forEach((file) => {
        formData.append("files", file);
      });

      formData.append("subject", subject.trim());

      const token = localStorage.getItem("token");
      const headers = {};

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.post(`${API_URL}/analyze`, formData, {
        headers,
        timeout: 0,
        signal: controller.signal,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setUploadPercent(
              Math.round((progressEvent.loaded * 100) / progressEvent.total)
            );
          }
        },
      });

      const data = response.data;

      if (data?.success === false) {
        throw new Error(data.message || "Analysis failed.");
      }

      const result =
        data.analysis ?? data.data?.analysis ?? data.data?.result ?? "";

      if (typeof result !== "string" || !result.trim()) {
        throw new Error(
          data.message ||
            "No analysis text was returned. Check the backend controller response."
        );
      }

      setAnalysis(result);

      setAnalysisInfo({
        analysisId: data.analysisId ?? data.data?.analysisId ?? null,
        totalFiles: data.totalFiles ?? files.length,
        processedFiles: data.processedFiles ?? [],
        ocrFiles: data.ocrFiles ?? [],
        failedFiles: data.failedFiles ?? [],
        totalCharacters: data.totalCharacters ?? 0,
      });

      setMessage("Analysis completed successfully!");
    } catch (err) {
      if (axios.isCancel(err) || err.code === "ERR_CANCELED") {
        setMessage("Analysis cancelled.");
        return;
      }

      console.error("Previous paper analysis error:", err);

      if (err.response) {
        setError(
          err.response.data?.message ||
            err.response.data?.error ||
            `Server error: ${err.response.status}`
        );
      } else if (err.request) {
        setError(
          "Cannot connect to the backend. Make sure your backend is running on port 5000."
        );
      } else {
        setError(err.message || "Something went wrong.");
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  };

  const cancelAnalysis = () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }
  };

  // =====================================================
  // THE REPORT (parsed once per analysis)
  // =====================================================

  const report = analysis ? parseReport(analysis) : null;

  const searchTerm = searchText.trim();

  const storeId =
    analysisInfo?.analysisId || subject.trim().toLowerCase();

  const studiedKey = (id) => `${storeId}|${id}`;

  const cardLevel = (block) => {
    const row = block.rows.find(
      (r) => r.label && /importance/i.test(r.label)
    );

    return importanceLevel(row?.value);
  };

  const visibleSections = report
    ? report.sections
        .map((section, si) => ({
          ...section,
          id: si,
          blocks: section.blocks
            .map((block, bi) => ({ ...block, id: `${si}-${bi}` }))
            .filter((block) => {
              if (
                levelFilter !== "all" &&
                !(block.type === "card" && cardLevel(block) === levelFilter)
              ) {
                return false;
              }

              if (
                searchTerm &&
                !blockText(block)
                  .toLowerCase()
                  .includes(searchTerm.toLowerCase())
              ) {
                return false;
              }

              return true;
            }),
        }))
        .filter((section) => section.blocks.length > 0)
    : [];

  const matchCount = visibleSections.reduce(
    (total, section) => total + section.blocks.length,
    0
  );

  const allCards = report
    ? report.sections.flatMap((section, si) =>
        section.blocks
          .map((block, bi) => ({ block, id: `${si}-${bi}` }))
          .filter((item) => item.block.type === "card")
      )
    : [];

  const questionCount = allCards.length;

  const studiedCount = allCards.filter(
    (item) => studied[studiedKey(item.id)]
  ).length;

  const progress = questionCount
    ? Math.round((studiedCount * 100) / questionCount)
    : 0;

  const toggleStudied = (id) => {
    const next = { ...studied };
    const key = studiedKey(id);

    if (next[key]) {
      delete next[key];
    } else {
      next[key] = true;
    }

    setStudied(next);

    try {
      localStorage.setItem("ppStudied", JSON.stringify(next));
    } catch {
      // the tick still works for this visit even if storage is blocked
    }
  };

  const toggleSection = (id) => {
    setCollapsed((previous) => ({ ...previous, [id]: !previous[id] }));
  };

  // =====================================================
  // PDF
  // =====================================================

  const getPdfFilename = () => {
    const safeSubject =
      subject.trim().replace(/[^a-z0-9_-]/gi, "_") || "Subject";

    return `VTU_${safeSubject}_Previous_Paper_Analysis.pdf`;
  };

  const createAnalysisPDF = () => {
    if (!report || !report.sections.length) {
      throw new Error("There is no analysis available to export.");
    }

    const INDIGO = [67, 56, 202];
    const INK = [15, 23, 42];
    const TEXT = [51, 65, 85];
    const MUTED = [100, 116, 139];
    const LINE = [226, 232, 240];
    const SOFT = [248, 250, 252];

    const LEVEL_COLOR = {
      high: [220, 38, 38],
      mid: [234, 88, 12],
      low: [37, 99, 235],
      none: [99, 102, 241],
    };

    const doc = new jsPDF({ unit: "mm", format: "a4" });

    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const M = 14;
    const CW = W - M * 2;
    const LABEL_W = 34;

    let y = 0;

    const ensure = (height) => {
      if (y + height > H - 18) {
        doc.addPage();
        y = 18;
      }
    };

    const wrap = (text, width, size, style) => {
      doc.setFont("helvetica", style);
      doc.setFontSize(size);
      return doc.splitTextToSize(pdfSafe(text), width);
    };

    // ---------- Title band ----------

    doc.setFillColor(...INDIGO);
    doc.rect(0, 0, W, 40, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("VTU Previous Paper Analysis", M, 17);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);

    const subjectLine = doc.splitTextToSize(
      pdfSafe(`Subject: ${subject.trim()}`),
      CW
    )[0];

    doc.text(subjectLine, M, 26);

    doc.setFontSize(9.5);
    doc.setTextColor(199, 210, 254);

    doc.text(
      `Papers analysed: ${analysisInfo?.totalFiles ?? files.length}     |     Generated: ${new Date().toLocaleDateString()}`,
      M,
      33
    );

    y = 52;

    // ---------- Sections ----------

    report.sections.forEach((section) => {
      ensure(34);

      if (section.number) {
        doc.setFillColor(...INDIGO);
        doc.circle(M + 4.5, y - 1.8, 4.5, "F");

        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(String(section.number), M + 4.5, y - 0.2, {
          align: "center",
        });
      }

      doc.setTextColor(...INK);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13.5);
      doc.text(
        pdfSafe(section.title || "Report"),
        M + (section.number ? 12 : 0),
        y
      );

      y += 3;
      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.4);
      doc.line(M, y, W - M, y);

      y += 7;

      section.blocks.forEach((block) => {
        // ----- Question card -----

        if (block.type === "card") {
          const titleLines = wrap(block.title, CW - 12, 10.5, "bold");

          const rows = block.rows.map((row) =>
            row.label
              ? {
                  label: row.label,
                  lines: wrap(row.value, CW - 12 - LABEL_W, 9.5, "normal"),
                }
              : {
                  lines: wrap(row.text, CW - 18, 9.5, "normal"),
                }
          );

          const rowsHeight = rows.reduce(
            (total, row) => total + row.lines.length * 4.6 + 1.4,
            0
          );

          const height =
            5 + (block.title ? titleLines.length * 5 + 2 : 0) + rowsHeight + 2;

          ensure(height + 3);

          const importanceRow = block.rows.find(
            (row) => row.label && /importance/i.test(row.label)
          );

          const level = importanceLevel(importanceRow?.value);

          doc.setFillColor(...SOFT);
          doc.setDrawColor(...LINE);
          doc.setLineWidth(0.3);
          doc.roundedRect(M, y, CW, height, 1.8, 1.8, "FD");

          doc.setFillColor(...LEVEL_COLOR[level]);
          doc.rect(M, y + 0.4, 1.8, height - 0.8, "F");

          let cy = y + 6;

          if (block.title) {
            doc.setTextColor(...INK);
            doc.setFont("helvetica", "bold");
            doc.setFontSize(10.5);

            titleLines.forEach((line) => {
              doc.text(line, M + 6, cy);
              cy += 5;
            });

            cy += 1;
          }

          rows.forEach((row) => {
            if (row.label) {
              doc.setFont("helvetica", "bold");
              doc.setFontSize(9);
              doc.setTextColor(...MUTED);
              doc.text(pdfSafe(row.label), M + 6, cy);

              const isImportance = /importance/i.test(row.label);

              doc.setFont("helvetica", isImportance ? "bold" : "normal");
              doc.setFontSize(9.5);
              doc.setTextColor(
                ...(isImportance ? LEVEL_COLOR[level] : TEXT)
              );

              row.lines.forEach((line, i) => {
                doc.text(line, M + 6 + LABEL_W, cy + i * 4.6);
              });
            } else {
              doc.setFont("helvetica", "normal");
              doc.setFontSize(9.5);
              doc.setTextColor(...TEXT);

              doc.text("-", M + 6, cy);

              row.lines.forEach((line, i) => {
                doc.text(line, M + 11, cy + i * 4.6);
              });
            }

            cy += row.lines.length * 4.6 + 1.4;
          });

          y += height + 4;
          return;
        }

        // ----- Numbered / bullet / paragraph -----

        const row = block.row || {};

        const text = row.label ? `${row.label}: ${row.value}` : row.text;

        const lines = wrap(text, CW - 12, 10, "normal");
        const height = lines.length * 4.8 + 2.5;

        ensure(height + 1);

        if (block.type === "number") {
          doc.setFillColor(238, 242, 255);
          doc.circle(M + 3.5, y + 0.3, 3.5, "F");

          doc.setTextColor(...INDIGO);
          doc.setFont("helvetica", "bold");
          doc.setFontSize(8.5);
          doc.text(String(block.n), M + 3.5, y + 1.6, { align: "center" });
        } else if (block.type === "bullet") {
          doc.setFillColor(...INDIGO);
          doc.circle(M + 3, y + 0.2, 0.9, "F");
        }

        doc.setTextColor(...TEXT);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        const indent = block.type === "para" ? 0 : 10;

        lines.forEach((line, i) => {
          doc.text(line, M + indent, y + 1.5 + i * 4.8);
        });

        y += height;
      });

      y += 5;
    });

    // ---------- Footer ----------

    const pageCount = doc.internal.getNumberOfPages();

    for (let page = 1; page <= pageCount; page++) {
      doc.setPage(page);

      doc.setDrawColor(...LINE);
      doc.setLineWidth(0.3);
      doc.line(M, H - 13, W - M, H - 13);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...MUTED);

      doc.text("VTU AI Study Assistant", M, H - 8);
      doc.text(`Page ${page} of ${pageCount}`, W - M, H - 8, {
        align: "right",
      });
    }

    return doc;
  };

  const downloadAnalysisPDF = () => {
    try {
      const doc = createAnalysisPDF();

      doc.save(getPdfFilename());

      setMessage("Analysis PDF downloaded successfully!");
      setError("");
    } catch (err) {
      setError(err.message || "Could not generate the PDF.");
    }
  };

  const shareAnalysisPDF = async () => {
    try {
      const doc = createAnalysisPDF();

      const filename = getPdfFilename();

      const blob = doc.output("blob");

      const pdfFile = new File([blob], filename, {
        type: "application/pdf",
      });

      if (
        navigator.share &&
        navigator.canShare &&
        navigator.canShare({ files: [pdfFile] })
      ) {
        await navigator.share({
          title: `${subject} Previous Paper Analysis`,
          text: "VTU Previous Year Question Paper Analysis",
          files: [pdfFile],
        });

        setMessage("PDF shared successfully.");
      } else {
        doc.save(filename);

        setMessage(
          "PDF downloaded. Attach it to WhatsApp, email, or another app to share it."
        );
      }

      setError("");
    } catch (err) {
      if (err.name === "AbortError") return;

      console.error("PDF sharing error:", err);

      setError(err.message || "Unable to share the PDF.");
    }
  };

  const copyAnalysis = async () => {
    try {
      await navigator.clipboard.writeText(analysis);

      setMessage("Analysis copied to clipboard.");
      setError("");
    } catch {
      setError(
        "Could not copy automatically. Select the analysis text and copy it manually."
      );
    }
  };

  // =====================================================
  // REPORT PIECES
  // =====================================================

  const renderRow = (row, index) => {
    if (row.label) {
      const isImportance = /importance/i.test(row.label);
      const level = importanceLevel(row.value);

      return (
        <div className="pp-row" key={index}>
          <span className="pp-row-label">{row.label}</span>

          {isImportance && level !== "none" ? (
            <span className={`pp-pill pp-pill-${level}`}>
              {LEVEL_LABEL[level]}
            </span>
          ) : (
            <span className="pp-row-value">
              {highlight(row.value, searchTerm)}
            </span>
          )}
        </div>
      );
    }

    return (
      <div className="pp-row pp-row-plain" key={index}>
        <span className="pp-dot" />
        <span className="pp-row-value">
          {highlight(row.text, searchTerm)}
        </span>
      </div>
    );
  };

  const renderBlock = (block, index) => {
    if (block.type === "card") {
      const level = cardLevel(block);
      const done = Boolean(studied[studiedKey(block.id)]);

      return (
        <div
          className={`pp-qcard pp-qcard-${level} ${
            done ? "pp-qcard-done" : ""
          }`}
          key={index}
        >
          <div className="pp-qcard-top">
            {block.title && (
              <h4 className="pp-qcard-title">
                {highlight(block.title, searchTerm)}
              </h4>
            )}

            <label className="pp-study">
              <input
                type="checkbox"
                checked={done}
                onChange={() => toggleStudied(block.id)}
              />
              <span>{done ? "Studied" : "Mark studied"}</span>
            </label>
          </div>

          {block.rows.map(renderRow)}
        </div>
      );
    }

    const row = block.row || {};

    const text = row.label ? `${row.label}: ${row.value}` : row.text;

    return (
      <div className={`pp-item pp-kind-${block.type}`} key={index}>
        {block.type === "number" && (
          <span className="pp-item-number">{block.n}</span>
        )}

        {block.type === "bullet" && <span className="pp-dot" />}

        <span className="pp-item-text">{highlight(text, searchTerm)}</span>
      </div>
    );
  };

  const limitReached = files.length >= MAX_FILES;
  const wordCount = analysis.split(/\s+/).filter(Boolean).length;

  // =====================================================
  // USER INTERFACE
  // =====================================================

  return (
    <main className="pp-page">
      {/* HERO */}
      <section className="pp-hero">
        <div className="pp-hero-icon">📚</div>

        <div>
          <p className="pp-eyebrow">AI-POWERED STUDY TOOL</p>

          <h1>Previous Paper Analyzer</h1>

          <p className="pp-subtitle">
            Upload up to {MAX_FILES} previous-year question papers. The AI
            compares them, finds repeated questions, and shows what to
            study first.
          </p>
        </div>
      </section>

      {/* UPLOAD SECTION */}
      <section className="pp-card">
        <h2>1. Type the Subject Name</h2>

        <label className="pp-label" htmlFor="subject">
          Subject name
        </label>

        <input
          id="subject"
          className="pp-input"
          type="text"
          list="subject-suggestions"
          placeholder="Example: Database Management Systems"
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          maxLength={150}
          disabled={loading}
          autoComplete="off"
        />

        <datalist id="subject-suggestions">
          {SUBJECT_SUGGESTIONS.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>

        <p className="pp-help">
          Type any subject, or pick a suggestion while typing.
        </p>

        <div className="pp-divider" />

        <div className="pp-upload-heading">
          <div>
            <h2>2. Upload Question Papers</h2>

            <p className="pp-help">
              PDF only · Up to {MAX_FILES} files · 50 MB per file
            </p>
          </div>

          <span className="pp-count">
            {files.length}/{MAX_FILES} PDFs
          </span>
        </div>

        <input
          ref={fileInputRef}
          className="pp-hidden-input"
          type="file"
          accept=".pdf,application/pdf"
          multiple
          onChange={handleFileChange}
          disabled={loading || limitReached}
        />

        <div
          className={`pp-dropzone ${dragActive ? "pp-dropzone-active" : ""}`}
          onClick={() => {
            if (!loading && !limitReached) {
              fileInputRef.current?.click();
            }
          }}
          onDragOver={(event) => {
            event.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragActive(false);

            if (loading || limitReached) return;

            processFiles(Array.from(event.dataTransfer.files || []));
          }}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (
              (event.key === "Enter" || event.key === " ") &&
              !loading &&
              !limitReached
            ) {
              event.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <div className="pp-upload-icon">⬆️</div>

          <h3>Click or drag PDF files here</h3>

          <p>Add several PDFs at once, or add more later.</p>

          <span className="pp-browse-button">Browse PDF Files</span>
        </div>

        {files.length > 0 && (
          <div className="pp-file-summary">
            <div>
              <strong>{files.length} PDF(s) selected</strong>

              <p>{formatFileSize(totalFileSize)} total</p>
            </div>

            <button
              type="button"
              className="pp-text-button"
              onClick={clearFiles}
              disabled={loading}
            >
              Clear all
            </button>
          </div>
        )}

        {files.length > 0 && (
          <div className="pp-file-list">
            {files.map((file, index) => (
              <div className="pp-file-item" key={fileKey(file)}>
                <div className="pp-file-icon">📄</div>

                <div className="pp-file-details">
                  <strong title={file.name}>{file.name}</strong>

                  <span>{formatFileSize(file.size)}</span>
                </div>

                <button
                  type="button"
                  className="pp-remove-button"
                  onClick={() => removeFile(index)}
                  disabled={loading}
                  aria-label={`Remove ${file.name}`}
                  title="Remove PDF"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {!loading ? (
          <button
            type="button"
            className="pp-primary-button"
            onClick={handleAnalyze}
            disabled={!files.length || !subject.trim()}
          >
            ✨ Analyze Question Papers
          </button>
        ) : (
          <button
            type="button"
            className="pp-cancel-button"
            onClick={cancelAnalysis}
          >
            ✖ Cancel Analysis
          </button>
        )}

        {loading && (
          <div className="pp-loading">
            <div className="pp-spinner" />

            {uploadPercent < 100 ? (
              <>
                <p>Uploading PDFs... {uploadPercent}%</p>

                <div className="pp-progress">
                  <div
                    className="pp-progress-bar"
                    style={{ width: `${uploadPercent}%` }}
                  />
                </div>
              </>
            ) : (
              <p>
                Upload complete. Reading the PDFs and generating your
                analysis. This can take a few minutes, especially for
                scanned papers.
              </p>
            )}
          </div>
        )}

        {message && (
          <div className="pp-message" role="status">
            {message}
          </div>
        )}

        {error && (
          <div className="pp-error" role="alert">
            {error}
          </div>
        )}
      </section>

      {/* ANALYSIS RESULTS */}
      {report && (
        <section
          className="pp-card pp-results"
          id="analysis-results"
          ref={resultsRef}
        >
          <div className="pp-results-heading">
            <div>
              <p className="pp-eyebrow">YOUR STUDY REPORT</p>

              <h2>3. Analysis Results</h2>

              <p className="pp-help">
                Subject: <strong>{subject}</strong>
              </p>
            </div>

            <span className="pp-success-badge">✓ Completed</span>
          </div>

          {analysisInfo && (
            <div className="pp-stats">
              <div className="pp-stat">
                <strong>{analysisInfo.totalFiles}</strong>
                <span>Papers analysed</span>
              </div>

              <div className="pp-stat">
                <strong>{questionCount || "-"}</strong>
                <span>Questions listed</span>
              </div>

              <div className="pp-stat">
                <strong>{wordCount}</strong>
                <span>Words in report</span>
              </div>
            </div>
          )}

          {questionCount > 0 && (
            <div className="pp-progress-card">
              <div className="pp-progress-top">
                <strong>Study progress</strong>
                <span>
                  {studiedCount} of {questionCount} questions studied (
                  {progress}%)
                </span>
              </div>

              <div className="pp-progress">
                <div
                  className="pp-progress-bar"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {analysisInfo?.failedFiles?.length > 0 && (
            <div className="pp-warning">
              <strong>Some files could not be processed:</strong>

              <ul>
                {analysisInfo.failedFiles.map((file, index) => (
                  <li key={index}>
                    {typeof file === "string"
                      ? file
                      : `${file.fileName}: ${file.reason}`}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {analysisInfo?.ocrFiles?.length > 0 && (
            <p className="pp-help">
              OCR (text recognition) was used for{" "}
              {analysisInfo.ocrFiles.length} scanned file(s).
            </p>
          )}

          <div className="pp-action-buttons">
            <button
              type="button"
              className="pp-primary-button pp-action"
              onClick={downloadAnalysisPDF}
            >
              ⬇ Download PDF
            </button>

            <button
              type="button"
              className="pp-secondary-button"
              onClick={shareAnalysisPDF}
            >
              ↗ Share PDF
            </button>

            <button
              type="button"
              className="pp-secondary-button"
              onClick={copyAnalysis}
            >
              📋 Copy
            </button>

            <button
              type="button"
              className="pp-secondary-button"
              onClick={() => window.print()}
            >
              🖨 Print
            </button>

            <button
              type="button"
              className="pp-secondary-button"
              onClick={startNewAnalysis}
            >
              ➕ New Analysis
            </button>
          </div>

          <div className="pp-search-box">
            <label className="pp-label" htmlFor="analysis-search">
              Search inside the analysis
            </label>

            <input
              id="analysis-search"
              className="pp-input"
              type="search"
              placeholder="Search a topic, module, or question..."
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
            />

            {searchTerm && (
              <p className="pp-help">{matchCount} matching item(s)</p>
            )}
          </div>

          <div className="pp-toolbar">
            <div className="pp-chips">
              {FILTERS.map(([value, label]) => (
                <button
                  type="button"
                  key={value}
                  className={`pp-chip ${
                    levelFilter === value ? "pp-chip-active" : ""
                  }`}
                  onClick={() => setLevelFilter(value)}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="pp-chips">
              <button
                type="button"
                className="pp-chip"
                onClick={() => setCollapsed({})}
              >
                Expand all
              </button>

              <button
                type="button"
                className="pp-chip"
                onClick={() =>
                  setCollapsed(
                    Object.fromEntries(
                      visibleSections.map((section) => [section.id, true])
                    )
                  )
                }
              >
                Collapse all
              </button>
            </div>
          </div>

          {/* REPORT */}
          <div className="pp-report">
            {visibleSections.length > 0 ? (
              visibleSections.map((section) => {
                const isCollapsed =
                  Boolean(collapsed[section.id]) && !searchTerm;

                return (
                  <div className="pp-sec" key={section.id}>
                    <button
                      type="button"
                      className="pp-sec-head"
                      onClick={() => toggleSection(section.id)}
                      aria-expanded={!isCollapsed}
                    >
                      {section.number && (
                        <span className="pp-sec-num">{section.number}</span>
                      )}

                      <h3>{section.title || "Report"}</h3>

                      <span className="pp-sec-count">
                        {section.blocks.length}
                      </span>

                      <span
                        className={`pp-chev ${
                          isCollapsed ? "" : "pp-chev-open"
                        }`}
                      >
                        ▾
                      </span>
                    </button>

                    {!isCollapsed && (
                      <div className="pp-sec-body">
                        {section.blocks.map(renderBlock)}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="pp-empty">
                No matching items. Try a different filter or word.
              </p>
            )}
          </div>

          <p className="pp-footer-note">
            Tip: Verify important questions against your syllabus and
            official VTU materials. AI predictions are not guarantees of
            what will appear in your examination.
          </p>
        </section>
      )}
    </main>
  );
}

export default PreviousPaper;