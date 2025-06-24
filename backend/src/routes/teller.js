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
 * GET /api/teller/link
 * Create a Teller Connect link for the authenticated user
 */
router.get('/link', tellerController.createConnectLink);

/**
 * POST /api/teller/exchange
 * Exchange a public token for an access token
 */
// TODO: Add validation middleware for /exchange endpoint if not present
router.post('/exchange', /* validate(tellerExchangeSchema), */ tellerController.exchangeToken);

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