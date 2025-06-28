// Validation Schemas - Defines validation rules for authentication requests
// This file will contain Joi schemas for:
// - User registration
// - User login
// - Profile updates
// - Password changes
// - Password reset

const Joi = require('joi');


/**
 * Schema for profile updates
 * Validates optional profile fields
 */
const updateProfileSchema = Joi.object({
  first_name: Joi.string()
    .min(1)
    .max(50)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .optional()
    .messages({
      'string.min': 'First name cannot be empty',
      'string.max': 'First name must be 50 characters or less',
      'string.pattern.base': 'First name can only contain letters, spaces, hyphens, and apostrophes'
    }),
  last_name: Joi.string()
    .min(1)
    .max(50)
    .pattern(/^[a-zA-Z\s'-]+$/)
    .optional()
    .messages({
      'string.min': 'Last name cannot be empty',
      'string.max': 'Last name must be 50 characters or less',
      'string.pattern.base': 'Last name can only contain letters, spaces, hyphens, and apostrophes'
    }),
  phone: Joi.string()
    .pattern(/^\+?[\d\s\-\(\)]{10,15}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Please provide a valid phone number'
    }),
  date_of_birth: Joi.date()
    .max('now')
    .optional()
    .messages({
      'date.max': 'Date of birth cannot be in the future'
    }),
  preferences: Joi.object().optional()
});

/**
 * Schema for password changes
 * Validates current password and new password
 */
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.min': 'Current password cannot be empty',
      'any.required': 'Current password is required'
    }),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .required()
    .messages({
      'string.min': 'New password must be at least 8 characters long',
      'string.pattern.base': 'New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
      'any.required': 'New password is required'
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Password confirmation is required'
    })
});


/**
 * Schema for token refresh
 * Validates refresh token
 */
const refreshTokenSchema = Joi.object({
  refresh_token: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.min': 'Refresh token cannot be empty',
      'any.required': 'Refresh token is required'
    })
});

/**
 * Schema for account deletion
 * Validates password confirmation
 */
const deleteAccountSchema = Joi.object({
  password: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.min': 'Password cannot be empty',
      'any.required': 'Password is required for account deletion'
    }),
  confirmDeletion: Joi.boolean()
    .valid(true)
    .required()
    .messages({
      'any.only': 'You must confirm account deletion',
      'any.required': 'Account deletion confirmation is required'
    })
});

/**
 * Schema for Teller account connection
 * Validates enrollment ID and access token
 */
const tellerConnectSchema = Joi.object({
  enrollment: Joi.object({
    accessToken: Joi.string().required(),
    user: Joi.object({
      id: Joi.string().required(),
    }).required(),
    enrollment: Joi.object({
      id: Joi.string().required(),
      institution: Joi.object({
        name: Joi.string().required(),
        id: Joi.string().optional(),
      }).required(),
    }).required(),
    signatures: Joi.array().items(Joi.string()).required(),
  }).required(),
});

/**
 * Schema for account sync operations
 * Validates optional parameters for sync
 */
const syncAccountSchema = Joi.object({
  force_sync: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'Force sync must be a boolean'
    }),
  sync_transactions: Joi.boolean()
    .optional()
    .messages({
      'boolean.base': 'Sync transactions must be a boolean'
    }),
  date_range: Joi.object({
    start_date: Joi.date()
      .optional()
      .messages({
        'date.base': 'Start date must be a valid date'
      }),
    end_date: Joi.date()
      .optional()
      .min(Joi.ref('start_date'))
      .messages({
        'date.base': 'End date must be a valid date',
        'date.min': 'End date must be after start date'
      })
  }).optional()
});

module.exports = {
  updateProfileSchema,
  changePasswordSchema,
  refreshTokenSchema,
  deleteAccountSchema,
  tellerConnectSchema,
  syncAccountSchema
}; 