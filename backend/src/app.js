const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
require('dotenv').config();

const app = express();

// Middleware 
const webhookRoutes = require('./routes/webhooks');
app.use('/api/webhooks', webhookRoutes);
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

module.exports = app;
