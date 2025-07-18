const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');
const syncService = require('./services/syncService');
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

// Start background sync service in production
if (process.env.NODE_ENV === 'production' || process.env.ENABLE_BACKGROUND_SYNC === 'true') {
  console.log('🚀 Starting background sync service...');
  syncService.start();
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('📛 SIGTERM received, stopping sync service...');
  syncService.stop();
});

process.on('SIGINT', () => {
  console.log('📛 SIGINT received, stopping sync service...');
  syncService.stop();
});

module.exports = app;
