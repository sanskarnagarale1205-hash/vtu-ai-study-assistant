const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const chatWithAI = async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    const prompt = `
You are an AI Study Assistant for VTU CSE students.

Answer this question in simple language:

${question}

Give important points, examples where useful, and an exam-friendly explanation.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    res.json({
      success: true,
      answer: response.text,
    });
  } catch (error) {
    console.error("AI CHAT ERROR:", error);

    res.status(500).json({
      success: false,
      message: "AI service failed",
      error: error.message,
    });
  }
};


const generateImportantQuestions = async (req, res) => {
  try {
    const { subject, module } = req.body;

    if (!subject || !module) {
      return res.status(400).json({
        success: false,
        message: "Subject and module are required",
      });
    }

    const prompt = `
You are an AI Study Assistant for VTU CSE students.

Generate exactly 10 important VTU exam questions.

Subject: ${subject}
Module: ${module}

Rules:
- Give exactly 10 questions.
- Mark the 3 most important questions with ⭐.
- Questions only.
- No answers.
- Use simple language.
- Make them suitable for VTU semester exams.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    res.json({
      success: true,
      questions: response.text,
    });
  } catch (error) {
    console.error("IMPORTANT QUESTIONS ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate questions",
      error: error.message,
    });
  }
};


// ===============================
// GENERATE QUIZ
// ===============================
const generateQuiz = async (req, res) => {
  try {
    const { subject, module } = req.body;

    if (!subject || !module) {
      return res.status(400).json({
        success: false,
        message: "Subject and module are required",
      });
    }

    console.log(`Generating quiz: ${subject} - ${module}`);

    const prompt = `
You are an AI Study Assistant for VTU CSE students.

Create a quiz for:

Subject: ${subject}
Module: ${module}

Create exactly 10 multiple-choice questions.

Each question must have exactly 4 options.

Return ONLY valid JSON.

Use exactly this format:

[
  {
    "question": "Question text",
    "options": [
      "Option A",
      "Option B",
      "Option C",
      "Option D"
    ],
    "answer": 0
  }
]

Important:
- answer must be a number.
- 0 means first option.
- 1 means second option.
- 2 means third option.
- 3 means fourth option.
- Do not write A, B, C or D in answer.
- No markdown.
- No explanation.
- Exactly 10 questions.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });

    let text = response.text.trim();

    // Remove markdown code blocks if Gemini returns them
    text = text.replace(/^```json\s*/i, "");
    text = text.replace(/^```\s*/i, "");
    text = text.replace(/\s*```$/i, "");

    const quiz = JSON.parse(text);

    if (!Array.isArray(quiz) || quiz.length !== 10) {
      throw new Error("Invalid quiz format received from Gemini");
    }

    res.json({
      success: true,
      quiz,
    });

  } catch (error) {
    console.error("QUIZ ERROR:", error);

    res.status(500).json({
      success: false,
      message: "Failed to generate quiz",
      error: error.message,
    });
  }
};


module.exports = {
  chatWithAI,
  generateImportantQuestions,
  generateQuiz,
};