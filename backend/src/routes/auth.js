// Authentication Routes - Defines API endpoints for user authentication
// This file will contain routes for:
// - User registration
// - User login
// - Password management
// - Profile management
// - Account management

const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 10, // 10 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes (no authentication required) with rate limiting
router.post('/register', authLimiter, userController.registerUser);
router.post('/login', authLimiter, userController.loginUser);
router.post('/forgot-password', authLimiter, userController.resetPassword);

// Protected routes (authentication required)
router.get('/profile', authenticateToken, userController.getUserProfile);
router.put('/profile', authenticateToken, userController.updateUserProfile);
router.put('/change-password', authenticateToken, userController.changePassword);
router.delete('/account', authenticateToken, userController.deleteUser);
// Token refresh route
router.post('/refresh-token', userController.refreshToken);

module.exports = router; 