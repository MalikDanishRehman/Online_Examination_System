const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { authenticate, allowRoles } = require('../middleware/auth');

router.use(authenticate, allowRoles('examiner', 'admin'));

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

router.post('/generate', async (req, res) => {
  try {
    const { topic, count = 5 } = req.body;
    if (!topic) return res.status(400).json({ error: 'Topic required' });

    const prompt = `
Return ONLY valid JSON array.
Each item:
{ "question":"", "A":"", "B":"", "C":"", "D":"", "correct":"A" }
Topic: ${topic}
Count: ${count}
`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);

    let text = result.response.text();
    text = text.replace(/```json|```/g, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      return res.status(500).json({
        error: 'AI returned invalid JSON',
        raw: text
      });
    }

    res.json(parsed);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'AI generation failed' });
  }
});

module.exports = router;
