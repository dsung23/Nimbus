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

// Public routes (no authentication required)
router.post('/register', userController.registerUser);
router.post('/login', userController.loginUser);
router.post('/forgot-password', userController.resetPassword);

// Protected routes (authentication required) - temporarily without auth middleware
router.get('/profile', userController.getUserProfile);
router.put('/profile', userController.updateUserProfile);
router.put('/change-password', userController.changePassword);
router.delete('/account', userController.deleteUser);
// Token refresh route
router.post('/refresh-token', userController.refreshToken);

module.exports = router; 