// Main API Routes Aggregator - Combines all route modules
// This file will import and use all route modules:
// - Authentication routes
// - User routes
// - Account routes (Plaid)
// - Transaction routes
// - Chat routes
// - Analytics routes

const express = require('express');
const router = express.Router();

// TODO: Import route modules
const authRoutes = require('./auth');
// const userRoutes = require('./user');
// const accountRoutes = require('./account');
// const transactionRoutes = require('./transaction');
// const chatRoutes = require('./chat');
// const analyticsRoutes = require('./analytics');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'CoFund API'
  });
});

// API version endpoint
router.get('/version', (req, res) => {
  res.json({ 
    version: '1.0.0',
    name: 'CoFund API'
  });
});

// Mount route modules
router.use('/auth', authRoutes);
// router.use('/users', userRoutes);
// router.use('/accounts', accountRoutes);
// router.use('/transactions', transactionRoutes);
// router.use('/chat', chatRoutes);
// router.use('/analytics', analyticsRoutes);

// 404 handler for undefined routes
router.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.originalUrl} does not exist`,
    availableRoutes: [
      '/api/health',
      '/api/version',
      '/api/auth/register',
      '/api/auth/login'
    ]
  });
});

module.exports = router;
