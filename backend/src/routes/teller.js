const express = require('express');
const router = express.Router();
const tellerController = require('../controllers/tellerController');
const { authenticateToken } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { tellerConnectSchema, syncAccountSchema } = require('../middleware/validationSchemas');

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * POST /api/teller/connect
 * Connect a user's bank account via Teller
 */
router.post('/connect', validate(tellerConnectSchema), tellerController.connectAccount);

/**
 * GET /api/teller/accounts
 * Get all connected accounts for the authenticated user
 */
router.get('/accounts', tellerController.getAccounts);

/**
 * GET /api/teller/accounts/:accountId/transactions
 * Get transactions for a specific account
 */
router.get('/accounts/:accountId/transactions', tellerController.getTransactions);

/**
 * POST /api/teller/accounts/:accountId/sync
 * Manually sync a specific account
 */
router.post('/accounts/:accountId/sync', tellerController.syncAccount);

/**
 * DELETE /api/teller/accounts/:accountId
 * Disconnect an account
 */
router.delete('/accounts/:accountId', tellerController.disconnectAccount);

/**
 * GET /api/teller/sync-status
 * Get sync status for all user accounts
 */
router.get('/sync-status', tellerController.getSyncStatus);

/**
 * GET /api/teller/connect-config
 * Get Teller Connect configuration for the authenticated user
 */
router.get('/connect-config', tellerController.getConnectConfig);

/**
 * GET /api/teller/nonce
 * Generate a secure nonce for Teller Connect
 */
router.get('/nonce', tellerController.generateNonce);

/**
 * POST /api/teller/sync
 * Manually trigger sync for the current user's accounts and transactions
 */
router.post('/sync', tellerController.triggerUserSync);

/**
 * GET /api/teller/sync-service-status
 * Get background sync service status
 */
router.get('/sync-service-status', tellerController.getSyncServiceStatus);

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Teller API Integration',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;