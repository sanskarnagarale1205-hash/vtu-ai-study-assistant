const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

// =====================================================
// HELPER: CALL GEMINI
// =====================================================

const generateAIText = async (prompt) => {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: prompt,
  });

  if (
    !response.text ||
    typeof response.text !== "string" ||
    !response.text.trim()
  ) {
    throw new Error("Gemini returned an empty response.");
  }

  return response.text.trim();
};

// =====================================================
// HELPER: CLEAN JSON RESPONSE
// =====================================================

const cleanJSON = (text) => {
  return text
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
};

// =====================================================
// AI CHAT
// =====================================================

const chatWithAI = async (req, res) => {
  try {
    const { question } = req.body;

    if (
      typeof question !== "string" ||
      !question.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Question is required.",
      });
    }

    const prompt = `
You are an AI Study Assistant for VTU students.

Answer the following question in simple language.

QUESTION:
${question.trim()}

Instructions:
- Explain concepts clearly.
- Use important points and examples where useful.
- Make the answer useful for university examinations.
- Use headings when appropriate.
- Do not invent facts.
`;

    const answer = await generateAIText(prompt);

    return res.json({
      success: true,
      answer,
    });
  } catch (error) {
    console.error("AI CHAT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "AI service failed.",
      error: error.message,
    });
  }
};

// =====================================================
// GENERATE IMPORTANT QUESTIONS
// =====================================================

const generateImportantQuestions = async (req, res) => {
  try {
    const { subject, module } = req.body;

    if (
      typeof subject !== "string" ||
      !subject.trim() ||
      typeof module !== "string" ||
      !module.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Subject and module are required.",
      });
    }

    const prompt = `
You are an AI Study Assistant for VTU students.

Generate exactly 10 important university examination questions.

Subject: ${subject.trim()}
Module: ${module.trim()}

Rules:
- Generate exactly 10 questions.
- Mark the 3 most important questions with ⭐.
- Return questions only. Do not provide answers.
- Use clear, simple language.
- Make questions appropriate for university examinations.
- Avoid duplicate questions.
`;

    const questions = await generateAIText(prompt);

    return res.json({
      success: true,
      questions,
    });
  } catch (error) {
    console.error("IMPORTANT QUESTIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate important questions.",
      error: error.message,
    });
  }
};

// =====================================================
// GENERATE QUIZ
// =====================================================

const generateQuiz = async (req, res) => {
  try {
    const {
      subject,
      module,
      numberOfQuestions = 10,
      difficulty = "Mixed",
    } = req.body;

    // -----------------------------------------------
    // VALIDATE SUBJECT
    // -----------------------------------------------

    if (
      typeof subject !== "string" ||
      !subject.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please enter a subject name.",
      });
    }

    // -----------------------------------------------
    // VALIDATE MODULE
    // -----------------------------------------------

    if (
      typeof module !== "string" ||
      !module.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please select a module.",
      });
    }

    // -----------------------------------------------
    // VALIDATE QUESTION COUNT: 1 TO 50
    // -----------------------------------------------

    const count = Number(numberOfQuestions);

    if (
      !Number.isInteger(count) ||
      count < 1 ||
      count > 50
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a whole number between 1 and 50.",
      });
    }

    // -----------------------------------------------
    // VALIDATE DIFFICULTY
    // -----------------------------------------------

    const allowedDifficulties = [
      "Easy",
      "Medium",
      "Hard",
      "Mixed",
    ];

    if (!allowedDifficulties.includes(difficulty)) {
      return res.status(400).json({
        success: false,
        message:
          "Difficulty must be Easy, Medium, Hard, or Mixed.",
      });
    }

    // -----------------------------------------------
    // LOG QUIZ SETTINGS
    // -----------------------------------------------

    console.log("====================================");
    console.log("📝 QUIZ GENERATION STARTED");
    console.log("Subject:", subject.trim());
    console.log("Module:", module.trim());
    console.log("Questions:", count);
    console.log("Difficulty:", difficulty);
    console.log("====================================");

    // -----------------------------------------------
    // GEMINI PROMPT
    // -----------------------------------------------

    const difficultyInstruction =
      difficulty === "Mixed"
        ? "Include a balanced mixture of easy, medium, and hard questions."
        : `Make every question ${difficulty.toLowerCase()} difficulty.`;

    const prompt = `
You are an expert university quiz generator and tutor.

Create a multiple-choice quiz using these settings.

SUBJECT: ${subject.trim()}
MODULE: ${module.trim()}
NUMBER OF QUESTIONS: ${count}
DIFFICULTY: ${difficulty}

REQUIREMENTS:

1. Generate exactly ${count} different questions.
2. Every question must have exactly four options.
3. Every question must have exactly one correct answer.
4. The answer must be an integer from 0 to 3.
5. Index 0 represents the first option.
6. Index 1 represents the second option.
7. Index 2 represents the third option.
8. Index 3 represents the fourth option.
9. Include a short explanation for every correct answer.
10. Avoid duplicate or nearly identical questions.
11. Keep every question relevant to the specified subject and module.
12. Do not invent specific syllabus details.
13. Use definitions, concepts, applications, and examples where appropriate.
14. ${difficultyInstruction}
15. Return valid JSON only.
16. Do not include Markdown code fences.
17. Do not add text outside the JSON object.

Return this JSON structure:

{
  "quiz": [
    {
      "question": "Question text",
      "options": [
        "First option",
        "Second option",
        "Third option",
        "Fourth option"
      ],
      "answer": 0,
      "explanation": "Brief explanation of the correct answer."
    }
  ]
}

IMPORTANT:
- The quiz array must contain exactly ${count} questions.
- Every question must have four non-empty options.
- Every answer must be an integer from 0 to 3.
- Every explanation must be a non-empty string.
- Do not add properties other than question, options, answer, and explanation.
`;

    // -----------------------------------------------
    // REQUEST GEMINI
    // -----------------------------------------------

    const text = await generateAIText(prompt);

    // -----------------------------------------------
    // PARSE JSON
    // -----------------------------------------------

    let parsed;

    try {
      parsed = JSON.parse(cleanJSON(text));
    } catch (parseError) {
      console.error(
        "Quiz JSON parsing failed:",
        parseError.message
      );

      throw new Error(
        "AI returned invalid quiz data. Please try again."
      );
    }

    // Support both a JSON object and a direct array.

    const quiz = Array.isArray(parsed)
      ? parsed
      : parsed?.quiz;

    // -----------------------------------------------
    // VALIDATE QUESTION COUNT
    // -----------------------------------------------

    if (
      !Array.isArray(quiz) ||
      quiz.length !== count
    ) {
      throw new Error(
        `AI returned ${
          Array.isArray(quiz) ? quiz.length : 0
        } questions instead of ${count}. Please try again.`
      );
    }

    // -----------------------------------------------
    // VALIDATE EACH QUESTION
    // -----------------------------------------------

    const validatedQuiz = quiz.map(
      (item, index) => {
        if (
          !item ||
          typeof item.question !== "string" ||
          !item.question.trim()
        ) {
          throw new Error(
            `Question ${index + 1} has invalid question text.`
          );
        }

        if (
          !Array.isArray(item.options) ||
          item.options.length !== 4 ||
          item.options.some(
            (option) =>
              typeof option !== "string" ||
              !option.trim()
          )
        ) {
          throw new Error(
            `Question ${index + 1} must contain exactly four valid options.`
          );
        }

        if (
          !Number.isInteger(item.answer) ||
          item.answer < 0 ||
          item.answer > 3
        ) {
          throw new Error(
            `Question ${index + 1} has an invalid correct answer.`
          );
        }

        if (
          typeof item.explanation !== "string" ||
          !item.explanation.trim()
        ) {
          throw new Error(
            `Question ${index + 1} is missing its explanation.`
          );
        }

        return {
          question: item.question.trim(),

          options: item.options.map(
            (option) => option.trim()
          ),

          answer: item.answer,

          explanation: item.explanation.trim(),
        };
      }
    );

    // -----------------------------------------------
    // SUCCESS RESPONSE
    // -----------------------------------------------

    console.log(
      `✅ Quiz generated successfully: ${validatedQuiz.length} questions`
    );

    return res.json({
      success: true,
      subject: subject.trim(),
      module,
      numberOfQuestions: validatedQuiz.length,
      difficulty,
      quiz: validatedQuiz,
    });
  } catch (error) {
    console.error("QUIZ ERROR:", error);

    return res.status(500).json({
      success: false,
      message:
        error.message || "Failed to generate quiz.",
    });
  }
};

// =====================================================
// EXPORT CONTROLLERS
// =====================================================

module.exports = {
  chatWithAI,
  generateImportantQuestions,
  generateQuiz,
};