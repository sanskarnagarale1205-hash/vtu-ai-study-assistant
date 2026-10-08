const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const { GoogleGenAI } = require("@google/genai");

// =====================================================
// GEMINI
// =====================================================

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// =====================================================
// SETTINGS
// =====================================================

const MAX_PDFS = 10;

// Maximum combined text sent to Gemini.
// This prevents extremely large requests.
const MAX_TEXT_FOR_AI = 50000;

// =====================================================
// WAIT
// =====================================================

const wait = (ms) => {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
};

// =====================================================
// DELETE LOCAL FILE
// =====================================================

const deleteFile = (filePath) => {
  try {
    if (
      filePath &&
      fs.existsSync(filePath)
    ) {
      fs.unlinkSync(filePath);

      console.log(
        "🗑️ Deleted:",
        path.basename(filePath)
      );
    }
  } catch (error) {
    console.log(
      "⚠️ File deletion failed:",
      error.message
    );
  }
};

// =====================================================
// DELETE MULTIPLE FILES
// =====================================================

const deleteFiles = (files) => {
  if (!files || !Array.isArray(files)) {
    return;
  }

  for (const file of files) {
    if (file && file.path) {
      deleteFile(file.path);
    }
  }
};

// =====================================================
// NORMAL PDF TEXT EXTRACTION
// =====================================================

const extractNormalPDFText = async (
  filePath,
  fileName
) => {
  try {
    console.log("----------------------------------------");

    console.log(
      `📖 Reading: ${fileName}`
    );

    const dataBuffer =
      fs.readFileSync(filePath);

    console.log(
      "🔍 Trying normal PDF extraction..."
    );

    const pdfData =
      await pdfParse(dataBuffer);

    const text =
      pdfData.text
        ? pdfData.text.trim()
        : "";

    const pages =
      pdfData.numpages || 0;

    console.log(
      `📄 Pages: ${pages}`
    );

    console.log(
      `📝 Normal extracted characters: ${text.length}`
    );

    return {
      text,
      pages,
    };

  } catch (error) {
    console.error(
      `❌ Normal extraction failed for ${fileName}:`,
      error.message
    );

    return {
      text: "",
      pages: 0,
    };
  }
};

// =====================================================
// GEMINI PDF EXTRACTION
//
// Used when normal PDF parser gets little/no text.
// This allows scanned/image-based PDFs to be processed.
// =====================================================

const extractPDFWithGemini = async (
  filePath,
  fileName
) => {
  console.log("----------------------------------------");

  console.log(
    `🤖 OCR fallback started: ${fileName}`
  );

  try {
    // -----------------------------------------------
    // UPLOAD PDF TO GEMINI
    // -----------------------------------------------

    console.log(
      "📤 Uploading PDF to Gemini..."
    );

    const uploadedFile =
      await ai.files.upload({
        file: filePath,

        config: {
          mimeType: "application/pdf",
        },
      });

    console.log(
      "✅ PDF uploaded to Gemini"
    );

    // -----------------------------------------------
    // EXTRACTION PROMPT
    // -----------------------------------------------

    const extractionPrompt = `
You are a PDF text extraction system.

Extract the readable content from this PDF.

IMPORTANT:

- Process every page.
- Extract headings.
- Extract paragraphs.
- Extract bullet points.
- Extract numbered lists.
- Extract tables in readable text form.
- Extract questions.
- Extract answers.
- Extract definitions.
- Extract formulas when readable.
- Read text from scanned/image-based pages.
- Preserve the original order as much as possible.
- Do not summarize.
- Do not explain.
- Do not add information.
- Do not invent missing text.
- Return only the extracted text.

If a page has no readable text, skip that page.

The goal is to obtain the actual study-material text from the PDF.
`;

    console.log(
      "🔍 Asking Gemini to extract text..."
    );

    const response =
      await ai.models.generateContent({
        model:
          "gemini-3.1-flash-lite",

        contents: [
          {
            role: "user",

            parts: [
              {
                text: extractionPrompt,
              },

              {
                fileData: {
                  fileUri:
                    uploadedFile.uri,

                  mimeType:
                    "application/pdf",
                },
              },
            ],
          },
        ],
      });

    const text =
      response.text
        ? response.text.trim()
        : "";

    console.log(
      `📝 Gemini extracted characters: ${text.length}`
    );

    // -----------------------------------------------
    // DELETE TEMPORARY GEMINI FILE
    // -----------------------------------------------

    try {
      if (uploadedFile.name) {
        await ai.files.delete({
          name: uploadedFile.name,
        });

        console.log(
          "🗑️ Gemini temporary file deleted"
        );
      }
    } catch (deleteError) {
      console.log(
        "⚠️ Gemini temporary file deletion failed:",
        deleteError.message
      );
    }

    return text;

  } catch (error) {
    console.error(
      `❌ Gemini extraction failed for ${fileName}:`,
      error.message
    );

    return "";
  }
};

// =====================================================
// EXTRACT ONE PDF
// =====================================================

const processSinglePDF = async (
  file
) => {
  const fileName =
    file.originalname;

  console.log("========================================");

  console.log(
    `📄 Processing: ${fileName}`
  );

  // -----------------------------------------------
  // STEP 1: NORMAL EXTRACTION
  // -----------------------------------------------

  const normalResult =
    await extractNormalPDFText(
      file.path,
      fileName
    );

  let extractedText =
    normalResult.text;

  let pages =
    normalResult.pages;

  let extractionMethod =
    "pdf-parse";

  // -----------------------------------------------
  // STEP 2: FALLBACK
  // -----------------------------------------------

  if (
    !extractedText ||
    extractedText.length < 20
  ) {
    console.log(
      "⚠️ Little/no text detected."
    );

    console.log(
      "🔄 Using Gemini PDF extraction fallback..."
    );

    const fallbackText =
      await extractPDFWithGemini(
        file.path,
        fileName
      );

    if (fallbackText) {
      extractedText =
        fallbackText;

      extractionMethod =
        "gemini-pdf-extraction";
    }
  }

  // -----------------------------------------------
  // RESULT
  // -----------------------------------------------

  console.log(
    `✅ Final characters: ${extractedText.length}`
  );

  return {
    fileName,
    pages,
    characters:
      extractedText.length,

    extractionMethod,

    text:
      extractedText,
  };
};

// =====================================================
// ANALYZE COMBINED TEXT
// =====================================================

const analyzeCombinedText =
  async (allText) => {
    console.log("========================================");

    console.log(
      "🤖 Sending combined PDF text to Gemini..."
    );

    console.log(
      `📝 Total text characters: ${allText.length}`
    );

    console.log("========================================");

    const textForAI =
      allText.substring(
        0,
        MAX_TEXT_FOR_AI
      );

    const prompt = `
You are an AI Study Assistant for VTU CSE students.

The student has uploaded one or more PDF study materials.

Analyze the combined study material.

Give the answer in this format:

# 📚 VTU STUDY MATERIAL ANALYSIS

## 1. EASY SUMMARY

Explain the uploaded material in very simple language.

## 2. IMPORTANT CONCEPTS

List the important concepts.

For each concept:
- Give the concept name.
- Give a short and easy explanation.

## 3. IMPORTANT EXAM QUESTIONS

Give 10 important questions based only on the uploaded material.

Focus on questions useful for VTU CSE exams.

## 4. QUICK REVISION

Give short points that a student can revise quickly before an exam.

## 5. IMPORTANT DEFINITIONS

List important definitions found in the material.

## 6. IMPORTANT FORMULAS

List important formulas if present in the material.

## 7. MODULE/TOPIC-WISE POINTS

Organize the material topic-wise when possible.

IMPORTANT RULES:

- Use simple language.
- Focus on VTU CSE exam preparation.
- Use information from the uploaded PDFs.
- Do not invent unrelated topics.
- Do not assume information that is not present.
- If information is unclear, say that it is unclear.
- Combine information from multiple PDFs when relevant.
- Avoid unnecessary long explanations.
- Make the result useful for exam preparation.

UPLOADED PDF MATERIAL:

${textForAI}
`;

    const maxRetries = 3;

    for (
      let attempt = 1;
      attempt <= maxRetries;
      attempt++
    ) {
      try {
        console.log(
          `Gemini analysis attempt ${attempt}/${maxRetries}`
        );

        const response =
          await ai.models.generateContent({
            model:
              "gemini-3.1-flash-lite",

            contents: prompt,
          });

        const result =
          response.text
            ? response.text.trim()
            : "";

        if (!result) {
          throw new Error(
            "Gemini returned empty analysis"
          );
        }

        console.log(
          "✅ AI analysis completed"
        );

        return result;

      } catch (error) {
        console.error(
          `❌ Gemini attempt ${attempt} failed:`,
          error.message
        );

        if (
          attempt < maxRetries
        ) {
          const delay =
            2000 * attempt;

          console.log(
            `⏳ Retrying in ${delay / 1000} seconds...`
          );

          await wait(delay);
        } else {
          throw error;
        }
      }
    }

    throw new Error(
      "AI analysis failed"
    );
  };

// =====================================================
// MAIN: MULTIPLE PDF UPLOAD
// =====================================================

const uploadPDFs = async (
  req,
  res
) => {
  let uploadedFiles =
    req.files || [];

  try {
    console.log("");
    console.log("========================================");
    console.log("📚 MULTIPLE PDF UPLOAD STARTED");
    console.log("========================================");

    // =================================================
    // CHECK API KEY
    // =================================================

    if (!process.env.GEMINI_API_KEY) {
      deleteFiles(uploadedFiles);

      return res.status(500).json({
        success: false,
        message:
          "Gemini API key is missing",
      });
    }

    // =================================================
    // CHECK FILES
    // =================================================

    if (
      !uploadedFiles ||
      uploadedFiles.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please upload at least one PDF",
      });
    }

    // =================================================
    // MAX FILE CHECK
    // =================================================

    if (
      uploadedFiles.length >
      MAX_PDFS
    ) {
      deleteFiles(uploadedFiles);

      return res.status(400).json({
        success: false,
        message:
          `Maximum ${MAX_PDFS} PDFs can be uploaded at once`,
      });
    }

    console.log(
      `📚 Total PDFs received: ${uploadedFiles.length}`
    );

    // =================================================
    // PROCESS EACH PDF
    // =================================================

    const results = [];

    for (
      let i = 0;
      i < uploadedFiles.length;
      i++
    ) {
      const file =
        uploadedFiles[i];

      console.log("");
      console.log(
        `📄 PDF ${i + 1}/${uploadedFiles.length}`
      );

      try {
        const result =
          await processSinglePDF(
            file
          );

        results.push(result);

      } catch (error) {
        console.error(
          `❌ Failed processing ${file.originalname}:`,
          error.message
        );

        results.push({
          fileName:
            file.originalname,

          pages: 0,

          characters: 0,

          extractionMethod:
            "failed",

          text: "",

          error:
            error.message,
        });
      }
    }

    // =================================================
    // REMOVE FAILED/EMPTY FILES
    // =================================================

    const successfulResults =
      results.filter(
        (item) =>
          item.text &&
          item.text.length > 0
      );

    console.log("");
    console.log("========================================");

    console.log(
      `✅ Successfully extracted: ${successfulResults.length}/${results.length}`
    );

    console.log("========================================");

    // =================================================
    // CHECK WHETHER ANY TEXT WAS EXTRACTED
    // =================================================

    if (
      successfulResults.length ===
      0
    ) {
      deleteFiles(uploadedFiles);

      return res.status(400).json({
        success: false,

        message:
          "Could not extract readable text from any of the uploaded PDFs.",

        files: results.map(
          (item) => ({
            fileName:
              item.fileName,

            pages:
              item.pages,

            characters:
              item.characters,

            extractionMethod:
              item.extractionMethod,

            error:
              item.error || null,
          })
        ),
      });
    }

    // =================================================
    // COMBINE ALL PDF TEXT
    // =================================================

    console.log(
      "📚 Combining extracted text..."
    );

    let combinedText = "";

    for (
      const result of successfulResults
    ) {
      combinedText += `

==================================================
PDF: ${result.fileName}
==================================================

${result.text}

`;
    }

    console.log(
      `📝 Combined characters: ${combinedText.length}`
    );

    // =================================================
    // GEMINI ANALYSIS
    // =================================================

    const aiSummary =
      await analyzeCombinedText(
        combinedText
      );

    // =================================================
    // DELETE LOCAL PDFs
    // =================================================

    deleteFiles(uploadedFiles);

    // =================================================
    // RESPONSE
    // =================================================

    console.log("");
    console.log("========================================");
    console.log("✅ ALL PDF PROCESSING COMPLETED");
    console.log("========================================");

    return res.status(200).json({
      success: true,

      message:
        "PDFs uploaded, text extracted and analyzed successfully",

      totalFiles:
        uploadedFiles.length,

      successfulFiles:
        successfulResults.length,

      failedFiles:
        results.length -
        successfulResults.length,

      totalCharacters:
        successfulResults.reduce(
          (
            total,
            item
          ) =>
            total +
            item.characters,
          0
        ),

      files:
        results.map(
          (item) => ({
            fileName:
              item.fileName,

            pages:
              item.pages,

            characters:
              item.characters,

            extractionMethod:
              item.extractionMethod,

            error:
              item.error || null,
          })
        ),

      // First 10,000 chars only for frontend preview
      extractedText:
        combinedText.substring(
          0,
          10000
        ),

      aiSummary,
    });

  } catch (error) {
    console.error("");
    console.error("========================================");
    console.error("❌ MULTIPLE PDF PROCESSING ERROR");
    console.error("========================================");

    console.error(
      error
    );

    // =================================================
    // CLEANUP
    // =================================================

    deleteFiles(uploadedFiles);

    // =================================================
    // ERROR RESPONSE
    // =================================================

    return res.status(500).json({
      success: false,

      message:
        "Failed to process PDFs",

      error:
        error.message ||
        "Unknown server error",
    });
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  uploadPDF: uploadPDFs,
};