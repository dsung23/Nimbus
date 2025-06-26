// Validation Middleware - Handles input validation for authentication requests
// This file will contain middleware functions for:
// - Request body validation
// - Query parameter validation
// - File upload validation
// - Custom validation rules

const Joi = require('joi');

/**
 * Generic validation middleware that accepts a validation schema
 * Validates request body, query parameters, and URL parameters
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errorDetails = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errorDetails
      });
    }

    // Replace request body with validated and sanitized data
    req.body = value;
    next();
  };
};

/**
 * Middleware to handle validation errors
 * Formats and returns validation error responses
 */
const handleValidationErrors = (req, res, next) => {
  // This middleware is now integrated into the validate function
  // Keeping for backward compatibility
  next();
};

/**
 * Custom validation for email format
 */
const validateEmail = (email) => {
  const emailSchema = Joi.string().email({ tlds: { allow: false } });
  const { error } = emailSchema.validate(email);
  
  if (error) {
    throw new Error('Invalid email format');
  }
  
  return true;
};

/**
 * Custom validation for password strength
 */
const validatePassword = (password) => {
  const passwordSchema = Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/);
  
  const { error } = passwordSchema.validate(password);
  
  if (error) {
    if (error.details[0].type === 'string.min') {
      throw new Error('Password must be at least 8 characters long');
    } else if (error.details[0].type === 'string.pattern.base') {
      throw new Error('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
    } else {
      throw new Error('Invalid password format');
    }
  }
  
  return true;
};

/**
 * Sanitize user input to prevent XSS attacks
 */
const sanitizeInput = (req, res, next) => {
  // Basic XSS prevention - remove script tags and dangerous characters
  const sanitizeString = (str) => {
    if (typeof str !== 'string') return str;
    
    return str
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .trim();
  };

  // Sanitize request body
  if (req.body) {
    Object.keys(req.body).forEach(key => {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitizeString(req.body[key]);
      }
    });
  }

  // Sanitize query parameters
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        req.query[key] = sanitizeString(req.query[key]);
      }
    });
  }

  // Sanitize URL parameters
  if (req.params) {
    Object.keys(req.params).forEach(key => {
      if (typeof req.params[key] === 'string') {
        req.params[key] = sanitizeString(req.params[key]);
      }
    });
  }

  next();
};

/**
 * Validate request headers
 */
const validateHeaders = (req, res, next) => {
  const requiredHeaders = ['content-type'];
  
  for (const header of requiredHeaders) {
    if (!req.headers[header]) {
      return res.status(400).json({
        success: false,
        message: `Missing required header: ${header}`
      });
    }
  }

  // Validate content-type for POST/PUT requests
  if ((req.method === 'POST' || req.method === 'PUT') && 
      !req.headers['content-type'].includes('application/json')) {
    return res.status(400).json({
      success: false,
      message: 'Content-Type must be application/json'
    });
  }

  next();
};

/**
 * Validate request size limits
 */
const validateRequestSize = (req, res, next) => {
  const maxSize = 1024 * 1024; // 1MB
  
  if (req.headers['content-length'] && parseInt(req.headers['content-length']) > maxSize) {
    return res.status(413).json({
      success: false,
      message: 'Request body too large. Maximum size is 1MB.'
    });
  }

  next();
};

module.exports = {
  validate,
  handleValidationErrors,
  validateEmail,
  validatePassword,
  sanitizeInput,
  validateHeaders,
  validateRequestSize
};

// Validation Schemas
const registrationSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email address'
    }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.empty': 'Password is required',
      'string.min': 'Password must be at least 8 characters long',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    }),
  first_name: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .required()
    .messages({
      'string.empty': 'First name is required',
      'string.min': 'First name must be at least 2 characters long',
      'string.max': 'First name cannot exceed 50 characters',
      'string.pattern.base': 'First name can only contain letters, spaces, hyphens, and apostrophes'
    }),
  last_name: Joi.string()
    .min(2)
    .max(50)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .required()
    .messages({
      'string.empty': 'Last name is required',
      'string.min': 'Last name must be at least 2 characters long',
      'string.max': 'Last name cannot exceed 50 characters',
      'string.pattern.base': 'Last name can only contain letters, spaces, hyphens, and apostrophes'
    }),
  phone: Joi.string()
    .pattern(/^\+?[\d\s\-\(\)]+$/)
    .min(10)
    .max(20)
    .required()
    .messages({
      'string.empty': 'Phone number is required',
      'string.min': 'Phone number must be at least 10 digits',
      'string.max': 'Phone number cannot exceed 20 characters',
      'string.pattern.base': 'Please enter a valid phone number'
    }),
  date_of_birth: Joi.date()
    .iso()
    .max('now')
    .required()
    .messages({
      'date.base': 'Please enter a valid date of birth',
      'date.max': 'Date of birth cannot be in the future',
      'any.required': 'Date of birth is required'
    })
});

const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Please enter a valid email address'
    }),
  password: Joi.string()
    .required()
    .messages({
      'string.empty': 'Password is required'
    })
});

// Export validation schemas
module.exports = {
  validate,
  handleValidationErrors,
  validateEmail,
  validatePassword,
  sanitizeInput,
  validateHeaders,
  validateRequestSize,
  registrationSchema,
  loginSchema
}; 