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
const { 
  authenticateToken, 
  validateRefreshToken, 
  requireOwnership, 
  requireActiveAccount 
} = require('../middleware/auth');
const { validate, sanitizeInput, validateHeaders, validateRequestSize } = require('../middleware/validation');
const {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshTokenSchema,
  deleteAccountSchema
} = require('../middleware/validationSchemas');

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 5 requests per window
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting for password reset requests (more lenient)
const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: {
    success: false,
    message: 'Too many password reset requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Public routes (no authentication required) with rate limiting and validation
router.post('/register', 
  validateRequestSize,
  validateHeaders,
  sanitizeInput,
  authLimiter,
  validate(registerSchema),
  userController.registerUser
);

router.post('/login', 
  validateRequestSize,
  validateHeaders,
  sanitizeInput,
  authLimiter,
  validate(loginSchema),
  userController.loginUser
);

router.post('/forgot-password', 
  validateRequestSize,
  validateHeaders,
  sanitizeInput,
  passwordResetLimiter,
  validate(forgotPasswordSchema),
  userController.forgotPassword
);

router.post('/reset-password', 
  validateRequestSize,
  validateHeaders,
  sanitizeInput,
  passwordResetLimiter,
  validate(resetPasswordSchema),
  userController.resetPassword
);

// Protected routes (authentication required) with validation
router.get('/profile', 
  authenticateToken,
  requireActiveAccount,
  userController.getUserProfile
);

router.put('/profile', 
  authenticateToken,
  requireActiveAccount,
  requireOwnership('profile'),
  validateRequestSize,
  validateHeaders,
  sanitizeInput,
  validate(updateProfileSchema),
  userController.updateUserProfile
);

router.put('/change-password', 
  authenticateToken,
  requireActiveAccount,
  validateRequestSize,
  validateHeaders,
  sanitizeInput,
  validate(changePasswordSchema),
  userController.changePassword
);

router.delete('/account', 
  authenticateToken,
  requireActiveAccount,
  requireOwnership('profile'),
  validateRequestSize,
  validateHeaders,
  sanitizeInput,
  validate(deleteAccountSchema),
  userController.deleteUser
);

// Token refresh route
router.post('/refresh-token', 
  validateRequestSize,
  validateHeaders,
  sanitizeInput,
  validate(refreshTokenSchema),
  validateRefreshToken,
  userController.refreshToken
);

module.exports = router; 