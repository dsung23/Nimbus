const express = require('express');
const router = express.Router();

// Test route
router.get('/test', (req, res) => {
  res.json({ 
    message: 'Hello from backend! 🚀', 
    timestamp: new Date().toISOString(),
    status: 'success'
  });
});

module.exports = router;
