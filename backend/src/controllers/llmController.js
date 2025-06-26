const { callGroq } = require('../services/groqService');

const handleLLMRequest = async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Missing 'message' in body." });
  }

  try {
    const reply = await callGroq(message);
    res.json({ reply });
  } catch (err) {
    console.error("LLM Controller Error:", err.message);
    res.status(500).json({ error: "Failed to process LLM response." });
  }
};

module.exports = { handleLLMRequest };
