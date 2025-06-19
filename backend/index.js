const express = require('express');
const cors = require('cors');
const apiRoutes = require('./src/routes/api');

const app = express();

// Middleware 
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', apiRoutes);

// Simple test route (keeping for backward compatibility)
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Hello from backend! 🚀', 
    timestamp: new Date().toISOString(),
    status: 'success'
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
