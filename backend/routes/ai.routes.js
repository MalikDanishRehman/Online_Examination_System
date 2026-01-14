const express = require('express');
const router = express.Router();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { authenticate, allowRoles } = require('../middleware/auth');

router.use(authenticate, allowRoles('examiner'));

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

router.post('/generate', async (req, res) => {
    const { topic, count } = req.body;

    const prompt = `Create ${count} MCQs on "${topic}". Return JSON only.`;

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);

    const clean = result.response.text().replace(/```json|```/g, '');
    res.json(JSON.parse(clean));
});

module.exports = router;
