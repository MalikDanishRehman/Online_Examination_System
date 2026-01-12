const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI("AIzaSyC3y2OwxenI83eJgefRa9kApN6We4yyWLc");

async function listModels() {
  try {
    // Model fetch karne ka tarika (Library version ke hisab se)
    // Agar ye fail ho, to bas upar wala server.js use karein, wo standard hai.
    console.log("Checking available models (if supported by key)...");
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent("Hello");
    console.log("Response:", result.response.text());
  } catch (error) {
    console.log("Error:", error.message);
  }
}
listModels();