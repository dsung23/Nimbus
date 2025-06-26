const express = require('express');
const router = express.Router();
const { callGroq } = require('../services/groqService');

// POST /api/llm - normal chat endpoint
router.post('/', async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Missing 'message' in request body" });

  try {
    const reply = await callGroq(message);
    res.json({ reply });
  } catch (err) {
    console.error("Groq error:", err.message);
    res.status(500).json({ error: "Failed to generate reply from Groq" });
  }
});

// GET /api/llm/test - hardcoded prompt test endpoint
router.get('/test', async (req, res) => {
  const hardcodedPrompt = "Explain the difference between stocks and bonds in simple terms. 1-2 sentences.";

  try {
    const reply = await callGroq(hardcodedPrompt);
    res.json({ reply });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
