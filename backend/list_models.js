require('dotenv').config();

const url =
  `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GOOGLE_API_KEY}`;

async function checkAccess() {
    console.log("Checking available models...");
    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.error) {
            console.error("API key error:", data.error.message);
        } else {
            console.log("Available models:");
            const validModels = data.models.filter(m =>
                m.supportedGenerationMethods.includes("generateContent")
            );
            validModels.forEach(m => console.log(m.name));
        }
    } catch (err) {
        console.error("Network error:", err.message);
    }
}

checkAccess();
