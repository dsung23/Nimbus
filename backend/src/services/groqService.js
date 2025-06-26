const axios = require("axios");

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama3-70b-8192"; // Or 'mixtral-8x7b-32768'

const callGroq = async (userMessage) => {
    console.log("Loaded GROQ_API_KEY:", !!process.env.GROQ_API_KEY);

    const payload = {
        model: MODEL,
        messages: [
        { role: "system", content: "You are a helpful finance assistant." },
        { role: "user", content: userMessage }
        ],
        temperature: 0.3,
        
    };

    const headers = {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
    };

    try {
        const res = await axios.post(GROQ_API_URL, payload, { headers });
        return res.data.choices[0].message.content;
    } catch (err) {
        console.error("❌ Groq API error:", err.response?.data || err.message);
        throw new Error("Groq LLM request failed");
    }
};

// Enhanced function that accepts full conversation context
const callGroqWithContext = async (messages) => {
    console.log("Loaded GROQ_API_KEY:", !!process.env.GROQ_API_KEY);

    const payload = {
        model: MODEL,
        messages: messages, // Use provided messages array
        temperature: 0.3,
    };

    const headers = {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
    };

    try {
        const res = await axios.post(GROQ_API_URL, payload, { headers });
        return res.data.choices[0].message.content;
    } catch (err) {
        console.error("❌ Groq API error:", err.response?.data || err.message);
        throw new Error("Groq LLM request failed");
    }
};

module.exports = { callGroq, callGroqWithContext };
