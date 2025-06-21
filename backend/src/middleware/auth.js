// Authentication Middleware - Handles Supabase token verification and user authentication
// This file contains middleware functions for:
// - Supabase JWT token verification
// - User authentication
// - Role-based access control
// - Token refresh validation

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

/**
 * Middleware to authenticate Supabase JWT tokens
 * Extracts token from Authorization header and verifies it
 * Adds user information to request object if valid
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired token'
      });
    }

    // Add user info to request object
    req.user = {
      id: user.id,
      email: user.email,
      email_verified: user.email_confirmed_at ? true : false
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};

/**
 * Middleware to check if user has required role
 * Must be used after authenticateToken middleware
 */
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    // TODO: Implement role-based access control
    // 1. Check if user has required role
    // 2. Allow or deny access accordingly
  };
};

/**
 * Middleware to check if user owns the resource
 * Must be used after authenticateToken middleware
 */
const requireOwnership = (resourceType) => {
  return async (req, res, next) => {
    // TODO: Implement resource ownership verification
    // 1. Check if user owns the requested resource
    // 2. Allow or deny access accordingly
  };
};

/**
 * Optional authentication middleware
 * Similar to authenticateToken but doesn't fail if no token provided
 */
const optionalAuth = async (req, res, next) => {
  // TODO: Implement optional authentication
  // 1. Try to authenticate token if present
  // 2. Continue without user info if no token
};

/**
 * Middleware to validate refresh tokens
 * Used specifically for token refresh endpoints
 */
const validateRefreshToken = async (req, res, next) => {
  // TODO: Implement refresh token validation
  // 1. Extract refresh token from request
  // 2. Verify refresh token
  // 3. Check if refresh token is valid and not expired
};

module.exports = {
  authenticateToken,
  requireRole,
  requireOwnership,
  optionalAuth,
  validateRefreshToken
}; 