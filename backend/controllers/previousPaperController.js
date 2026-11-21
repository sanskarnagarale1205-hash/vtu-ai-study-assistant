const fs = require("fs");
const path = require("path");
const os = require("os");

const pdfParse = require("pdf-parse");
const { createWorker } = require("tesseract.js");
const pdfPoppler = require("pdf-poppler");
const PDFDocument = require("pdfkit");

const { GoogleGenAI } = require("@google/genai");

const Analysis = require("../models/Analysis");

// =====================================================
// GEMINI CONFIGURATION
// =====================================================

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// =====================================================
// CONFIGURATION
// =====================================================

const MAX_TOTAL_CHARACTERS = 100000;

const MIN_PDF_TEXT_LENGTH = 50;

const MIN_OCR_TEXT_LENGTH = 20;

// =====================================================
// HELPER: CLEAN TEMPORARY DIRECTORY
// =====================================================

function deleteTempDirectory(directory) {
  try {
    if (
      directory &&
      fs.existsSync(directory)
    ) {
      fs.rmSync(directory, {
        recursive: true,
        force: true,
      });
    }
  } catch (error) {
    console.error(
      "Temporary directory cleanup failed:",
      error.message
    );
  }
}

// =====================================================
// HELPER: DELETE UPLOADED FILES
// =====================================================

function deleteUploadedFiles(files = []) {
  for (const file of files) {
    try {
      if (
        file.path &&
        fs.existsSync(file.path)
      ) {
        fs.unlinkSync(file.path);
      }
    } catch (error) {
      console.error(
        `Could not delete uploaded file: ${file.originalname}`,
        error.message
      );
    }
  }
}

// =====================================================
// HELPER: CONVERT PDF TO IMAGES
// =====================================================

async function convertPDFToImages(
  pdfPath,
  fileName
) {
  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "vtu-paper-")
  );

  try {
    const options = {
      format: "png",
      out_dir: tempDir,
      out_prefix: "page",
      page: null,
      scale: 1500,
    };

    console.log(
      `Converting PDF to images: ${fileName}`
    );

    await pdfPoppler.convert(
      pdfPath,
      options
    );

    const imageFiles = fs
      .readdirSync(tempDir)
      .filter((file) =>
        file.toLowerCase().endsWith(".png")
      )
      .sort((a, b) => {
        const numberA = parseInt(
          a.match(/\d+/)?.[0] || "0",
          10
        );

        const numberB = parseInt(
          b.match(/\d+/)?.[0] || "0",
          10
        );

        return numberA - numberB;
      });

    console.log(
      `Converted ${imageFiles.length} pages from ${fileName}`
    );

    return {
      tempDir,
      images: imageFiles.map((file) =>
        path.join(tempDir, file)
      ),
    };
  } catch (error) {
    deleteTempDirectory(tempDir);
    throw error;
  }
}

// =====================================================
// HELPER: OCR SCANNED PDF
// =====================================================

async function runOCR(
  images,
  fileName
) {
  console.log(
    `Starting OCR: ${fileName}`
  );

  const worker = await createWorker("eng");

  let extractedText = "";

  try {
    for (
      let index = 0;
      index < images.length;
      index++
    ) {
      console.log(
        `OCR page ${index + 1}/${images.length}`
      );

      const result = await worker.recognize(
        images[index]
      );

      const pageText =
        result.data.text || "";

      extractedText +=
        `\n\n--- PAGE ${index + 1} ---\n\n` +
        pageText;
    }

    return extractedText.trim();
  } finally {
    await worker.terminate();
  }
}

// =====================================================
// HELPER: EXTRACT TEXT FROM PDF
// =====================================================

async function extractPDFText(file) {
  let tempOCRDir = null;

  try {
    const buffer = fs.readFileSync(
      file.path
    );

    let extractedText = "";

    // -----------------------------------------------
    // TRY NORMAL PDF TEXT EXTRACTION
    // -----------------------------------------------

    try {
      const pdfData = await pdfParse(buffer);

      extractedText =
        pdfData.text
          ? pdfData.text.trim()
          : "";
    } catch (error) {
      console.error(
        `Normal text extraction failed for ${file.originalname}:`,
        error.message
      );
    }

    if (
      extractedText.length >=
      MIN_PDF_TEXT_LENGTH
    ) {
      return {
        text: extractedText,
        method: "PDF text extraction",
        success: true,
      };
    }

    // -----------------------------------------------
    // FALL BACK TO OCR
    // -----------------------------------------------

    console.log(
      `Using OCR for scanned PDF: ${file.originalname}`
    );

    const converted =
      await convertPDFToImages(
        file.path,
        file.originalname
      );

    tempOCRDir = converted.tempDir;

    const ocrText = await runOCR(
      converted.images,
      file.originalname
    );

    if (
      ocrText.length >=
      MIN_OCR_TEXT_LENGTH
    ) {
      return {
        text: ocrText,
        method: "OCR",
        success: true,
      };
    }

    return {
      text: "",
      method: "OCR",
      success: false,
      message:
        "No readable text could be extracted.",
    };
  } finally {
    if (tempOCRDir) {
      deleteTempDirectory(tempOCRDir);
    }
  }
}

// =====================================================
// HELPER: GENERATE AI RESPONSE
// =====================================================

// Models are tried in this order. If the first is overloaded
// for a long time, the next one is used automatically.
const GEMINI_MODELS = [
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash",
];

const MAX_ATTEMPTS_PER_MODEL = 4;

function sleep(milliseconds) {
  return new Promise((resolve) =>
    setTimeout(resolve, milliseconds)
  );
}

// 429 = too many requests, 5xx = Google-side problems.
// These usually go away if we wait and try again.
function isTemporaryError(error) {
  return [429, 500, 502, 503, 504].includes(error?.status);
}

async function generateAI(prompt) {
  let lastError;

  for (const model of GEMINI_MODELS) {
    for (
      let attempt = 1;
      attempt <= MAX_ATTEMPTS_PER_MODEL;
      attempt++
    ) {
      try {
        console.log(
          `Gemini ${model}: request ${attempt}/${MAX_ATTEMPTS_PER_MODEL}`
        );

        const response = await ai.models.generateContent({
          model,
          contents: prompt,
        });

        const text = response.text || "";

        if (!text.trim()) {
          throw new Error("Gemini returned an empty response.");
        }

        console.log(`Gemini ${model}: success`);

        return text.trim();
      } catch (error) {
        lastError = error;

        console.error(
          `Gemini ${model} attempt ${attempt} failed:`,
          error.message
        );

        // Not a temporary problem (for example a wrong model
        // name): stop retrying this model and try the next one.
        if (!isTemporaryError(error)) {
          break;
        }

        // Wait 3s, 12s, 27s between attempts.
        if (attempt < MAX_ATTEMPTS_PER_MODEL) {
          await sleep(attempt * attempt * 3000);
        }
      }
    }
  }

  throw lastError;
}
// =====================================================
// HELPER: BUILD ANALYSIS PROMPT
// =====================================================

function buildAnalysisPrompt(subject, combinedText) {
  return `
You are an expert VTU CSE examination assistant.

Analyze ALL the uploaded previous-year question papers.

Subject: ${subject}

RULES:
1. Compare every uploaded paper and find repeated questions.
2. Treat differently worded questions about the same concept as repeated.
3. Never invent questions that are not in the papers.
4. Only give a number of appearances when the papers clearly support it.
5. Correct obvious OCR spelling mistakes when the meaning is clear.
6. If a module is uncertain, say it is an estimate.
7. Use simple language. Do not promise that any question will appear.
8. Do NOT use emojis, stars, tables, bold markers (**) or horizontal lines.
9. Follow the format below EXACTLY, with these heading markers.

FORMAT:

# VTU Previous Year Paper Analysis

## 1. Super Important Questions

### Q1. <the question>
- Importance: Extremely Important
- Why it matters: <one short sentence>
- Repeated in: <paper names or years>

(Give up to 15 questions. Importance must be exactly one of: Extremely Important, Very Important, Important.)

## 2. Most Repeated Questions

### Q1. <the question or concept>
- Appearances: <number>
- Importance: <one of the three levels>

## 3. Module-wise Important Questions

### Module 1
- <question>
- <question>

(Repeat for Module 2, 3, 4 and 5. Skip a module if the papers do not support it.)

## 4. Top 10 Questions to Study First

1. <question>
2. <question>

(Rank from highest to lowest priority, up to 10.)

## 5. Exam Preparation Tips

1. <tip>
2. <tip>

(Exactly 5 simple, subject-relevant tips. Mention diagrams, algorithms, programs, examples or time complexity where relevant.)

## 6. Paper Coverage and Limitations

- <which papers were analysed>
- <any text that looked incomplete>

ALL PAPERS:

${combinedText}
`;
}

// =====================================================
// POST: ANALYZE PREVIOUS YEAR PAPERS
// =====================================================

const analyzePreviousPapers = async (
  req,
  res
) => {
  const uploadedFiles = req.files || [];

  console.log(
    "========================================"
  );

  console.log(
    "Previous Year Paper Analysis Started"
  );

  try {
    // -----------------------------------------------
    // VALIDATE FILES
    // -----------------------------------------------

    if (uploadedFiles.length === 0) {
      return res.status(400).json({
        success: false,
        message:
          "Please upload at least one PDF.",
      });
    }

    // -----------------------------------------------
    // VALIDATE SUBJECT
    // -----------------------------------------------

    const subject =
      typeof req.body.subject === "string"
        ? req.body.subject.trim()
        : "";

    if (!subject) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a subject name.",
      });
    }

    if (subject.length > 150) {
      return res.status(400).json({
        success: false,
        message:
          "Subject name cannot exceed 150 characters.",
      });
    }

    console.log("Subject:", subject);

    console.log(
      `PDF files received: ${uploadedFiles.length}`
    );

    // -----------------------------------------------
    // PROCESS FILES
    // -----------------------------------------------

    let combinedText = "";

    const processedFiles = [];
    const ocrFiles = [];
    const failedFiles = [];

    for (const file of uploadedFiles) {
      console.log(
        `Processing: ${file.originalname}`
      );

      try {
        const result =
          await extractPDFText(file);

        if (!result.success) {
          failedFiles.push({
            fileName: file.originalname,
            reason:
              result.message ||
              "Text extraction failed.",
          });

          continue;
        }

        if (result.method === "OCR") {
          ocrFiles.push(
            file.originalname
          );
        } else {
          processedFiles.push(
            file.originalname
          );
        }

        const remainingCharacters =
          MAX_TOTAL_CHARACTERS -
          combinedText.length;

        if (remainingCharacters <= 0) {
          failedFiles.push({
            fileName: file.originalname,
            reason:
              "The report's text-processing limit was reached before this file could be included.",
          });

          continue;
        }

        const fileText =
          result.text.substring(
            0,
            remainingCharacters
          );

        combinedText +=
          `\n\n========================================\n` +
          `PAPER: ${file.originalname}\n` +
          `EXTRACTION METHOD: ${result.method}\n` +
          `========================================\n\n` +
          fileText;

        console.log(
          `Extracted ${fileText.length} characters from ${file.originalname}`
        );
      } catch (error) {
        console.error(
          `Could not process ${file.originalname}:`,
          error.message
        );

        failedFiles.push({
          fileName: file.originalname,
          reason: error.message,
        });
      }
    }

    // -----------------------------------------------
    // CHECK EXTRACTED CONTENT
    // -----------------------------------------------

    if (!combinedText.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "No readable text was extracted. Check the PDFs and try again.",
        totalFiles: uploadedFiles.length,
        processedFiles,
        ocrFiles,
        failedFiles,
      });
    }

    console.log(
      "Total extracted characters:",
      combinedText.length
    );

    // -----------------------------------------------
    // GENERATE ANALYSIS
    // -----------------------------------------------

    console.log(
      "Sending extracted paper content to Gemini..."
    );

    const prompt = buildAnalysisPrompt(
      subject,
      combinedText
    );

    const analysis = await generateAI(prompt);

    // -----------------------------------------------
    // SAVE ANALYSIS TO MONGODB
    // -----------------------------------------------

    const userId =
      req.user && req.user.id
        ? req.user.id
        : undefined;

    const savedAnalysis =
      await Analysis.create({
        ...(userId
          ? { userId }
          : {}),

        subject,

        fileNames: uploadedFiles.map(
          (file) => file.originalname
        ),

        analysis,

        totalFiles: uploadedFiles.length,
      });

    console.log(
      "Analysis saved:",
      savedAnalysis._id.toString()
    );

    // -----------------------------------------------
    // RESPONSE
    // -----------------------------------------------

    return res.status(200).json({
      success: true,

      message:
        "Previous-year papers analyzed successfully.",

      analysisId:
        savedAnalysis._id,

      subject,

      totalFiles:
        uploadedFiles.length,

      processedFiles,

      ocrFiles,

      failedFiles,

      totalCharacters:
        combinedText.length,

      analysis,
    });
  } catch (error) {
    console.error(
      "PREVIOUS PAPER ANALYSIS ERROR:",
      error
    );

       const isBusy =
      error.status === 429 || error.status === 503;

    return res.status(isBusy ? 503 : 500).json({
      success: false,

      message: isBusy
        ? "The AI service is busy right now. Your PDFs were read successfully. Please wait a minute and click Analyze again."
        : "Previous-year paper analysis failed.",

      error:
        error.message ||
        "Unknown server error.",
    });
  } finally {
    // Always remove uploaded source PDFs.
    // The saved MongoDB analysis remains available.
    deleteUploadedFiles(uploadedFiles);
  }
};

// =====================================================
// GET: SAVED ANALYSES
// =====================================================

const getSavedAnalyses = async (
  req,
  res
) => {
  try {
    const analyses = await Analysis.find({ userId: req.user.id })
      .sort({ createdAt: -1 })
      .select(
        "subject fileNames totalFiles createdAt analysis"
      );

    return res.status(200).json({
      success: true,
      count: analyses.length,
      analyses,
    });
  } catch (error) {
    console.error(
      "GET SAVED ANALYSES ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to retrieve saved analyses.",
    });
  }
};

// =====================================================
// GET: DOWNLOAD SAVED ANALYSIS AS PDF
// =====================================================

const getAnalysisPDF = async (
  req,
  res
) => {
  try {
    const { id } = req.params;

    if (
      !/^[a-f\d]{24}$/i.test(id)
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid analysis ID.",
      });
    }

    const savedAnalysis =
     await Analysis.findOne({ _id: id, userId: req.user.id })

    if (!savedAnalysis) {
      return res.status(404).json({
        success: false,
        message:
          "Saved analysis not found.",
      });
    }

    const filename =
      `VTU_Analysis_${String(
        savedAnalysis.subject || "Subject"
      )
        .replace(/[^a-z0-9_-]/gi, "_")
        .substring(0, 60)}.pdf`;

    res.setHeader(
      "Content-Type",
      "application/pdf"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${filename}"`
    );

    const document = new PDFDocument({
      size: "A4",
      margins: {
        top: 55,
        bottom: 55,
        left: 55,
        right: 55,
      },
      bufferPages: true,
      info: {
        Title: `VTU Previous Paper Analysis - ${savedAnalysis.subject}`,
        Author: "VTU AI Study Assistant",
      },
    });

    document.on("error", (error) => {
      console.error(
        "PDF generation error:",
        error.message
      );

      if (!res.headersSent) {
        res.status(500).end(
          "Could not generate the PDF."
        );
      } else {
        res.end();
      }
    });

    document.pipe(res);

    // -----------------------------------------------
    // PDF TITLE
    // -----------------------------------------------

    document
      .font("Helvetica-Bold")
      .fontSize(20)
      .text(
        "VTU PREVIOUS YEAR PAPER ANALYSIS",
        {
          align: "center",
        }
      );

    document.moveDown();

    document
      .font("Helvetica-Bold")
      .fontSize(13)
      .text("Subject:");

    document
      .font("Helvetica")
      .fontSize(12)
      .text(
        savedAnalysis.subject || "Not specified"
      );

    document.moveDown();

    document
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("Uploaded Papers:");

    const fileNames =
      savedAnalysis.fileNames || [];

    if (fileNames.length > 0) {
      fileNames.forEach((fileName, index) => {
        document
          .font("Helvetica")
          .fontSize(10)
          .text(`${index + 1}. ${fileName}`);
      });
    } else {
      document
        .font("Helvetica")
        .fontSize(10)
        .text("No filenames recorded.");
    }

    document.moveDown();

    document
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("Analysis Report");

    document.moveDown(0.5);

    // -----------------------------------------------
    // ANALYSIS TEXT
    // -----------------------------------------------

    const analysisText =
      savedAnalysis.analysis ||
      "No analysis content available.";

    const lines = analysisText.split(/\r?\n/);

    for (const rawLine of lines) {
      const line = rawLine.trim();

      if (!line) {
        document.moveDown(0.35);
        continue;
      }

      // Remove common Markdown markers for cleaner PDF output.
      const cleanedLine = line
        .replace(/^#{1,6}\s*/, "")
        .replace(/^\*\*(.*?)\*\*$/, "$1")
        .replace(/^\*\s+/, "• ")
        .replace(/^-{3,}$/, "");

      if (
        /^#{1,6}\s/.test(rawLine)
      ) {
        document
          .font("Helvetica-Bold")
          .fontSize(13)
          .text(cleanedLine, {
            continued: false,
          });

        document.moveDown(0.3);
      } else {
        document
          .font("Helvetica")
          .fontSize(10)
          .text(cleanedLine, {
            lineGap: 3,
          });
      }
    }

    // -----------------------------------------------
    // FOOTER
    // -----------------------------------------------

    const range = document.bufferedPageRange();

    for (
      let pageIndex = range.start;
      pageIndex < range.start + range.count;
      pageIndex++
    ) {
      document.switchToPage(pageIndex);

      document
        .font("Helvetica")
        .fontSize(8)
        .text(
          "Generated by VTU AI Study Assistant",
          55,
          document.page.height - 35,
          {
            width:
              document.page.width - 110,
            align: "center",
          }
        );
    }

    document.end();
  } catch (error) {
    console.error(
      "DOWNLOAD ANALYSIS PDF ERROR:",
      error
    );

    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message:
          "Failed to generate the analysis PDF.",
      });
    }

    res.end();
  }
};
// =====================================================
// DELETE: SAVED ANALYSIS
// =====================================================

const deleteAnalysis = async (req, res) => {
  try {
    const { id } = req.params;

    if (!/^[a-f\d]{24}$/i.test(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid analysis ID.",
      });
    }

    const deleted = await Analysis.findOneAndDelete({ _id: id, userId: req.user.id });

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "Saved analysis not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Analysis deleted successfully.",
    });
  } catch (error) {
    console.error("DELETE ANALYSIS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete the analysis.",
    });
  }
};

// =====================================================
// EXPORT CONTROLLERS
// =====================================================
module.exports = {
  analyzePreviousPapers,
  getSavedAnalyses,
  getAnalysisPDF,
  deleteAnalysis,
};
