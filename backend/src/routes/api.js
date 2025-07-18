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

// Import existing route modules
const llmRoutes = require('./llmRoutes');
const persistentChatRoutes = require('./persistentChatRoutes');

// Import route modules
const authRoutes = require('./authRoutes');
const adminRoutes = require('./admin');
const tellerRoutes = require('./teller');
const accountRoutes = require('./accounts');
// TODO: Import additional route modules when they are created
// const userRoutes = require('./user');
// const transactionRoutes = require('./transaction');
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

// Legacy test endpoint for backward compatibility
router.get('/test', (req, res) => {
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
router.use('/admin', adminRoutes);
router.use('/teller', tellerRoutes);
router.use('/accounts', accountRoutes);
// TODO: Mount additional route modules when they are created
// router.use('/users', userRoutes);
// router.use('/transactions', transactionRoutes);
// router.use('/chat', chatRoutes);
// router.use('/analytics', analyticsRoutes);

// Mount existing route modules
router.use('/llm', llmRoutes);
router.use('/chat', persistentChatRoutes);

// 404 handler for undefined routes
router.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.originalUrl} does not exist`,
    availableRoutes: [
      '/health',
      '/version',
      '/auth/register',
      '/auth/signup',
      '/auth/login',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/auth/profile',
      '/auth/refresh-token',
      '/auth/refresh',
      '/admin/users',
      '/admin/system/stats',
      '/admin/analytics/users',
      '/teller/connect',
      '/teller/link',
      '/teller/exchange',
      '/teller/accounts',
      '/teller/accounts/:accountId/transactions',
      '/teller/accounts/:accountId/sync',
      '/teller/sync-status',
      '/accounts',
      '/accounts/:id/balance'
    ]
  });
});




// Mount route modules
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/teller', tellerRoutes);
router.use('/accounts', accountRoutes);
// TODO: Mount additional route modules when they are created
// router.use('/users', userRoutes);
// router.use('/transactions', transactionRoutes);
// router.use('/analytics', analyticsRoutes);

// 404 handler for undefined routes
router.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.originalUrl} does not exist`,
    availableRoutes: [
      '/health',
      '/version',
      '/test',
      '/llm',
      '/chat',
      '/auth/register',
      '/auth/signup',
      '/auth/login',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/auth/profile',
      '/auth/refresh-token',
      '/auth/refresh',
      '/auth/sync',
      '/admin/users',
      '/admin/system/stats',
      '/admin/analytics/users',
      '/teller/connect',
      '/teller/connect-config',
      '/teller/nonce',
      '/teller/accounts',
      '/teller/accounts/:accountId/transactions',
      '/teller/accounts/:accountId/sync',
      '/teller/sync-status',
      '/accounts',
      '/accounts/:id/balance'
    ]
  });
});

module.exports = router;
