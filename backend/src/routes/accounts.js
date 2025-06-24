const express = require('express');
const router = express.Router();
const tellerController = require('../controllers/tellerController');
const { authenticateToken } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticateToken);

/**
 * GET /api/accounts
 * Get all connected accounts for the authenticated user (alias for /api/teller/accounts)
 */
router.get('/', tellerController.getAccounts);

/**
 * GET /api/accounts/:id/balance
 * Get the current/available balance for a specific account
 */
router.get('/:id/balance', tellerController.getAccountBalance);

/**
 * Health check endpoint
 */
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Accounts API',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;