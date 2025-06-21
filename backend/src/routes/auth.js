// Authentication Routes - Defines API endpoints for user authentication
// This file will contain routes for:
// - User registration
// - User login
// - Password management
// - Profile management
// - Account management

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middleware/auth');
const validationMiddleware = require('../middleware/validation');

// TODO: Import validation schemas
// const { registerSchema, loginSchema, updateProfileSchema, changePasswordSchema } = require('../middleware/validationSchemas');

// Public routes (no authentication required)
router.post('/register', 
  // validationMiddleware(registerSchema),
  userController.registerUser
);

router.post('/login', 
  // validationMiddleware(loginSchema),
  userController.loginUser
);

router.post('/forgot-password', 
  // validationMiddleware(forgotPasswordSchema),
  userController.resetPassword
);

// Protected routes (authentication required)
router.get('/profile', 
  authMiddleware.authenticateToken,
  userController.getUserProfile
);

router.put('/profile', 
  authMiddleware.authenticateToken,
  // validationMiddleware(updateProfileSchema),
  userController.updateUserProfile
);

router.put('/change-password', 
  authMiddleware.authenticateToken,
  // validationMiddleware(changePasswordSchema),
  userController.changePassword
);

router.delete('/account', 
  authMiddleware.authenticateToken,
  userController.deleteUser
);

// Token refresh route
router.post('/refresh-token', 
  // validationMiddleware(refreshTokenSchema),
  userController.refreshToken
);

module.exports = router; 