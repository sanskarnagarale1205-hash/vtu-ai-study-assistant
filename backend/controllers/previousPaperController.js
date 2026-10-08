const fs = require("fs");
const path = require("path");
const os = require("os");
const pdfParse = require("pdf-parse");
const { createWorker } = require("tesseract.js");
const pdfPoppler = require("pdf-poppler");
const { GoogleGenAI } = require("@google/genai");

const Analysis = require("../models/Analysis");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// =====================================================
// CONVERT PDF TO IMAGES
// =====================================================

async function convertPDFToImages(pdfPath, fileName) {
  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "vtu-pdf-")
  );

  const options = {
    format: "png",
    out_dir: tempDir,
    out_prefix: "page",
    page: null,
    scale: 1500,
  };

  console.log(`🖼️ Converting ${fileName} to images...`);

  await pdfPoppler.convert(pdfPath, options);

  const files = fs
    .readdirSync(tempDir)
    .filter((file) => file.endsWith(".png"))
    .sort((a, b) => {
      const numA = parseInt(a.match(/\d+/)?.[0] || "0");
      const numB = parseInt(b.match(/\d+/)?.[0] || "0");
      return numA - numB;
    });

  console.log(
    `✅ Converted ${files.length} page(s) from ${fileName}`
  );

  return {
    tempDir,
    images: files.map((file) =>
      path.join(tempDir, file)
    ),
  };
}

// =====================================================
// OCR
// =====================================================

async function runOCR(images, fileName) {
  console.log(`🔍 Starting OCR for ${fileName}`);

  const worker = await createWorker("eng");

  let fullText = "";

  try {
    for (let i = 0; i < images.length; i++) {
      console.log(
        `🔎 OCR page ${i + 1}/${images.length}`
      );

      const result = await worker.recognize(
        images[i]
      );

      const text = result.data.text || "";

      fullText += `\n\n--- PAGE ${i + 1} ---\n\n`;
      fullText += text;

      console.log(
        `✅ Page ${i + 1}: ${text.length} characters`
      );
    }

    return fullText.trim();
  } finally {
    await worker.terminate();
  }
}

// =====================================================
// DELETE TEMP DIRECTORY
// =====================================================

function deleteTempDirectory(dir) {
  try {
    if (dir && fs.existsSync(dir)) {
      fs.rmSync(dir, {
        recursive: true,
        force: true,
      });
    }
  } catch (error) {
    console.log(
      "⚠️ Could not delete temporary OCR files"
    );
  }
}

// =====================================================
// GEMINI
// =====================================================

async function generateAI(prompt) {
  let lastError = null;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(
        `Gemini attempt ${attempt}/3`
      );

      const response =
        await ai.models.generateContent({
          model: "gemini-3.1-flash-lite",
          contents: prompt,
        });

      console.log(
        "✅ Gemini response received"
      );

      return response.text;
    } catch (error) {
      lastError = error;

      console.log(
        `❌ Gemini attempt ${attempt} failed:`,
        error.message
      );

      if (attempt < 3) {
        await new Promise((resolve) =>
          setTimeout(
            resolve,
            2000 * attempt
          )
        );
      }
    }
  }

  throw lastError;
}

// =====================================================
// ANALYZE MULTIPLE PREVIOUS PAPERS
// =====================================================

const analyzePreviousPapers = async (req, res) => {
  console.log(
    "========================================"
  );

  console.log(
    "📚 Previous Year Paper Analysis Started"
  );

  try {
    if (
      !req.files ||
      req.files.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please upload at least one PDF.",
      });
    }

    console.log(
      `📄 ${req.files.length} PDF(s) received`
    );

    const subject =
      req.body.subject || "General";

    let combinedText = "";

    const processedFiles = [];
    const ocrFiles = [];
    const failedFiles = [];

    // =================================================
    // PROCESS ALL PDFS
    // =================================================

    for (const file of req.files) {
      console.log(
        `\n📖 Reading: ${file.originalname}`
      );

      let tempOCRDir = null;

      try {
        const buffer = fs.readFileSync(
          file.path
        );

        // =============================================
        // NORMAL PDF TEXT
        // =============================================

        let pdfText = "";

        try {
          const pdfData =
            await pdfParse(buffer);

          pdfText = pdfData.text
            ? pdfData.text.trim()
            : "";
        } catch (error) {
          console.log(
            "⚠️ Normal PDF extraction failed"
          );
        }

        if (pdfText.length >= 50) {
          console.log(
            `✅ Extracted ${pdfText.length} characters from ${file.originalname}`
          );

          combinedText +=
            `\n\n========================================\n` +
            `QUESTION PAPER: ${file.originalname}\n` +
            `========================================\n\n` +
            pdfText;

          processedFiles.push(
            file.originalname
          );

          continue;
        }

        // =============================================
        // OCR FOR SCANNED PDF
        // =============================================

        console.log(
          "⚠️ No useful text found."
        );

        console.log(
          "🔍 PDF appears to be scanned. Starting OCR..."
        );

        const converted =
          await convertPDFToImages(
            file.path,
            file.originalname
          );

        tempOCRDir =
          converted.tempDir;

        const ocrText =
          await runOCR(
            converted.images,
            file.originalname
          );

        if (ocrText.length >= 20) {
          console.log(
            `✅ OCR extracted ${ocrText.length} characters from ${file.originalname}`
          );

          combinedText +=
            `\n\n========================================\n` +
            `QUESTION PAPER: ${file.originalname}\n` +
            `OCR EXTRACTED PAPER\n` +
            `========================================\n\n` +
            ocrText;

          ocrFiles.push(
            file.originalname
          );
        } else {
          console.log(
            `❌ OCR failed for ${file.originalname}`
          );

          failedFiles.push(
            file.originalname
          );
        }
      } catch (error) {
        console.log(
          `❌ Error processing ${file.originalname}:`,
          error.message
        );

        failedFiles.push(
          file.originalname
        );
      } finally {
        if (tempOCRDir) {
          deleteTempDirectory(
            tempOCRDir
          );
        }
      }
    }

    console.log(
      "\n========================================"
    );

    console.log(
      `📝 Total extracted text: ${combinedText.length} characters`
    );

    console.log(
      "========================================"
    );

    if (!combinedText.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Could not extract readable text from the papers.",
        processedFiles,
        ocrFiles,
        failedFiles,
      });
    }

    // =================================================
    // LIMIT TEXT
    // =================================================

    const MAX_CHARACTERS = 100000;

    if (
      combinedText.length >
      MAX_CHARACTERS
    ) {
      combinedText =
        combinedText.substring(
          0,
          MAX_CHARACTERS
        );
    }

    // =================================================
    // AI PROMPT
    // =================================================

    const prompt = `
You are an expert VTU CSE examination assistant.

Analyze ALL uploaded previous-year question papers.

Subject: ${subject}

Your job is to identify the questions the student should study first.

IMPORTANT:

1. Analyze every uploaded paper.
2. Find repeated questions.
3. Treat differently worded questions about the same concept as repeated.
4. Give higher priority to frequently repeated concepts.
5. Do not invent unrelated questions.
6. Correct obvious OCR spelling mistakes mentally.
7. Identify module-wise important questions.
8. Give SUPER IMPORTANT questions first.
9. Keep the language simple.
10. Focus on VTU exam preparation.

Return exactly these sections:

# 📚 VTU PREVIOUS YEAR PAPER ANALYSIS

## 1. 🔥 SUPER IMPORTANT QUESTIONS

Give TOP 15.

Use:

⭐⭐⭐⭐⭐ Extremely Important
⭐⭐⭐⭐ Very Important
⭐⭐⭐ Important

For each:

Question:
Importance:
Why it is important:
Repeated in:

---

## 2. 🔁 MOST REPEATED QUESTIONS

For each:

Question:
Number of appearances:
Importance:

---

## 3. 📖 MODULE-WISE IMPORTANT QUESTIONS

### MODULE 1

### MODULE 2

### MODULE 3

### MODULE 4

### MODULE 5

---

## 4. 🎯 TOP 10 QUESTIONS TO STUDY FIRST

Give exactly 10.

Rank from highest priority to lowest priority.

---

## 5. 📝 EXAM PREPARATION TIPS

Give 5 simple VTU exam tips.

Mention diagrams, algorithms, programs, examples and time complexity where appropriate.

ALL PAPERS:

${combinedText}
`;

    // =================================================
    // GEMINI
    // =================================================

    console.log(
      "\n🤖 Sending papers to Gemini..."
    );

    const analysis =
      await generateAI(prompt);

    if (
      !analysis ||
      !analysis.trim()
    ) {
      throw new Error(
        "Gemini returned an empty response."
      );
    }

    // =================================================
    // SAVE TO MONGODB
    // =================================================

    console.log(
      "\n💾 Saving analysis to MongoDB..."
    );

    let userId = null;

    // If JWT middleware provides req.user.id
    if (req.user && req.user.id) {
      userId = req.user.id;
    }

    const savedAnalysis =
      await Analysis.create({
        userId: userId,

        subject: subject,

        fileNames:
          req.files.map(
            (file) =>
              file.originalname
          ),

        analysis: analysis,

        totalFiles:
          req.files.length,
      });

    console.log(
      "✅ Analysis saved to MongoDB"
    );

    console.log(
      `🆔 Analysis ID: ${savedAnalysis._id}`
    );

    // =================================================
    // DELETE UPLOADED FILES
    // =================================================

    for (const file of req.files) {
      try {
        if (
          fs.existsSync(
            file.path
          )
        ) {
          fs.unlinkSync(
            file.path
          );
        }
      } catch (error) {
        console.log(
          `⚠️ Could not delete ${file.originalname}`
        );
      }
    }

    // =================================================
    // RESPONSE
    // =================================================

    console.log(
      "========================================"
    );

    console.log(
      "✅ Previous Paper Analysis Completed"
    );

    console.log(
      "========================================"
    );

    return res.status(200).json({
      success: true,

      message:
        "All previous year papers analyzed and saved successfully.",

      analysisId:
        savedAnalysis._id,

      totalFiles:
        req.files.length,

      processedFiles,

      ocrFiles,

      failedFiles,

      totalCharacters:
        combinedText.length,

      analysis,
    });

  } catch (error) {
    console.error(
      "\n❌ PREVIOUS PAPER ERROR:",
      error
    );

    // =================================================
    // CLEANUP FILES
    // =================================================

    if (req.files) {
      for (const file of req.files) {
        try {
          if (
            fs.existsSync(
              file.path
            )
          ) {
            fs.unlinkSync(
              file.path
            );
          }
        } catch (cleanupError) {
          // Ignore cleanup errors
        }
      }
    }

    return res.status(500).json({
      success: false,

      message:
        "Previous year paper analysis failed.",

      error:
        error.message ||
        "Unknown server error",
    });
  }
};

// =====================================================
// EXPORT
// =====================================================
const getSavedAnalyses = async (req, res) => {
  try {
    const analyses = await Analysis.find()
      .sort({ createdAt: -1 })
      .select("subject fileNames totalFiles createdAt analysis");

    res.status(200).json({
      success: true,
      count: analyses.length,
      analyses,
    });
  } catch (error) {
    console.error("GET SAVED ANALYSES ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to get saved analyses",
      error: error.message,
    });
  }
};
module.exports = {
  analyzePreviousPapers,
  getSavedAnalyses,
};
