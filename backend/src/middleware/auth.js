// Authentication Middleware - Handles Supabase token verification and user authentication
// This file contains middleware functions for:
// - Supabase JWT token verification
// - User authentication
// - Role-based access control
// - Resource ownership verification
// - Optional authentication
// - Refresh token validation

const { createClient } = require('@supabase/supabase-js');

// Check for required environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error('Missing required Supabase environment variables: SUPABASE_URL, SUPABASE_ANON_KEY');
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing required Supabase environment variable: SUPABASE_SERVICE_ROLE_KEY');
}

// Initialize Supabase clients
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
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

    // Get additional user profile data from our users table
    const { data: profileData, error: profileError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single();

    // Add user info to request object
    req.user = {
      id: user.id,
      profile: profileData || null
    };

    // Add role information if profile exists
    if (profileData) {
      req.user.role = profileData.preferences?.role || 'user';
      req.user.is_active = profileData.is_active;
    }

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
 * Supports roles: 'admin', 'premium', 'user'
 */
const requireRole = (requiredRole) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Get user role (default to 'user' if not set)
      const userRole = req.user.role || 'user';

      // Define role hierarchy (higher number = more permissions)
      const roleHierarchy = {
        'user': 1,
        'premium': 2,
        'admin': 3
      };

      const userRoleLevel = roleHierarchy[userRole] || 1;
      const requiredRoleLevel = roleHierarchy[requiredRole] || 1;

      // Check if user has sufficient role level
      if (userRoleLevel < requiredRoleLevel) {
        return res.status(403).json({
          success: false,
          message: `Access denied. Required role: ${requiredRole}`,
          userRole: userRole
        });
      }

      // Check if user account is active
      if (req.user.is_active === false) {
        return res.status(403).json({
          success: false,
          message: 'Account is inactive'
        });
      }

      next();
    } catch (error) {
      console.error('Role check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization failed',
        error: error.message
      });
    }
  };
};

/**
 * Middleware to check if user owns the resource
 * Must be used after authenticateToken middleware
 * Supports resource types: 'account', 'transaction', 'budget', 'goal'
 */
const requireOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const userId = req.user.id;
      const resourceId = req.params.id || req.params.resourceId || req.body.id;

      if (!resourceId) {
        return res.status(400).json({
          success: false,
          message: 'Resource ID is required'
        });
      }

      let tableName;
      let userIdField = 'user_id'; // Default field name

      // Map resource types to table names
      switch (resourceType) {
        case 'account':
          tableName = 'accounts';
          break;
        case 'transaction':
          tableName = 'transactions';
          break;
        case 'budget':
          tableName = 'budgets';
          break;
        case 'goal':
          tableName = 'goals';
          break;
        case 'profile':
          tableName = 'users';
          userIdField = 'id';
          break;
        default:
          return res.status(400).json({
            success: false,
            message: `Unsupported resource type: ${resourceType}`
          });
      }

      // Check if resource exists and belongs to user
      const { data: resource, error } = await supabaseAdmin
        .from(tableName)
        .select(userIdField)
        .eq('id', resourceId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            message: `${resourceType} not found`
          });
        }
        throw error;
      }

      // Check ownership
      if (resource[userIdField] !== userId) {
        return res.status(403).json({
          success: false,
          message: `Access denied. You do not own this ${resourceType}`
        });
      }

      next();
    } catch (error) {
      console.error('Ownership check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization failed',
        error: error.message
      });
    }
  };
};


/**
 * Middleware to validate refresh tokens
 * Used specifically for token refresh endpoints
 * Validates the refresh token and extracts user info
 */
const validateRefreshToken = async (req, res, next) => {
  try {
    // Extract refresh token from request body
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Validate refresh token with Supabase
    const { data, error } = await supabase.auth.refreshSession({
      refresh_token: refresh_token
    });

    if (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired refresh token',
        error: error.message
      });
    }

    if (!data.session || !data.user) {
      return res.status(401).json({
        success: false,
        message: 'Failed to refresh session'
      });
    }

    // Add session data to request object for use in controller
    req.refreshedSession = {
      user: data.user,
      session: data.session
    };

    next();
  } catch (error) {
    console.error('Refresh token validation error:', error);
    return res.status(500).json({
      success: false,
      message: 'Token refresh failed',
      error: error.message
    });
  }
};


/**
 * Middleware to check if user account is active
 * Must be used after authenticateToken middleware
 */
const requireActiveAccount = (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    // Check if account is active
    if (req.user.is_active === false) {
      return res.status(403).json({
        success: false,
        message: 'Account is inactive. Please contact support.'
      });
    }

    next();
  } catch (error) {
    console.error('Active account check error:', error);
    return res.status(500).json({
      success: false,
      message: 'Account status check failed',
      error: error.message
    });
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  requireOwnership,
  validateRefreshToken,
  requireActiveAccount
}; 