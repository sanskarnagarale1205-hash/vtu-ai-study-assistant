const { GoogleGenAI } = require("@google/genai");

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

const generateImportantQuestions = async (req, res) => {
  try {
    console.log("========================================");
    console.log("📚 Important Questions Generation Started");

    const { subject, module } = req.body;

    console.log("Subject:", subject);
    console.log("Module:", module);

    // Check subject
    if (!subject) {
      return res.status(400).json({
        success: false,
        message: "Subject is required",
      });
    }

    // Check module
    if (!module) {
      return res.status(400).json({
        success: false,
        message: "Module is required",
      });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "Gemini API key is missing",
      });
    }

    const prompt = `
You are an AI Study Assistant for VTU CSE students.

Generate important VTU exam questions.

Subject: ${subject}
Module: ${module}

Give the answer in this format:

IMPORTANT VTU QUESTIONS

1. Question
2. Question
3. Question
4. Question
5. Question

VERY IMPORTANT QUESTIONS

1. Question
2. Question
3. Question

SHORT REVISION TOPICS

- Topic
- Topic
- Topic
- Topic

Rules:
- Focus on VTU university examination preparation.
- Keep questions clear and easy to understand.
- Include commonly asked and important questions.
- Include both theory and problem-based questions when suitable.
- Do not give answers.
- Do not use unnecessary explanations.
`;

    console.log("🤖 Sending request to Gemini...");

    let response;

    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`Gemini attempt ${attempt}/${maxRetries}`);

        response = await ai.models.generateContent({
          model: "gemini-3.6-flash",
          contents: prompt,
        });

        break;
      } catch (error) {
        console.error(
          `Gemini attempt ${attempt} failed:`,
          error.message
        );

        if (
          error.status === 503 &&
          attempt < maxRetries
        ) {
          const delay = 5000 * Math.pow(2, attempt - 1);

          console.log(
            `Retrying in ${delay / 1000} seconds...`
          );

          await new Promise((resolve) =>
            setTimeout(resolve, delay)
          );
        } else {
          throw error;
        }
      }
    }

    if (!response) {
      throw new Error("Gemini did not return a response");
    }

    const questions = response.text;

    console.log("✅ Gemini response received");
    console.log("========================================");

    return res.status(200).json({
      success: true,
      message: "Important questions generated successfully",
      subject,
      module,
      questions,
    });
  } catch (error) {
    console.error("❌ Important Questions Error:");
    console.error(error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate important questions",
      error: error.message,
    });
  }
};

module.exports = {
  generateImportantQuestions,
};