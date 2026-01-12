// list_models.js
const apiKey = "AIzaSyC3y2OwxenI83eJgefRa9kApN6We4yyWLc"; 
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function checkAccess() {
    console.log("🔍 Checking available models for this API Key...");
    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.error) {
            console.error("❌ API KEY ERROR:", data.error.message);
            console.log("👉 SOLUTION: Aapko Nayi API Key leni padegi.");
        } else {
            console.log("✅ Available Models:");
            // Sirf 'generateContent' wale models filter karein
            const validModels = data.models.filter(m => m.supportedGenerationMethods.includes("generateContent"));
            validModels.forEach(m => console.log(` - ${m.name}`));
        }
    } catch (err) {
        console.error("Network Error:", err);
    }
}

checkAccess();