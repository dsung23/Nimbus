# CoFund Authentication System

This document explains the file structure and responsibilities of the user authentication system for the CoFund personal finance app.

## File Structure Overview

```
backend/src/
├── controllers/
│   └── userController.js          # Business logic for user operations
├── routes/
│   ├── auth.js                    # Authentication API endpoints
│   └── api.js                     # Main API route aggregator
├── middleware/
│   ├── auth.js                    # JWT authentication middleware
│   ├── validation.js              # Input validation middleware
│   └── validationSchemas.js       # Validation rule definitions
└── utils/
    └── auth.js                    # Authentication utility functions
```

## File Descriptions

### 1. `controllers/userController.js`
**Purpose**: Contains all business logic for user authentication operations.

**Responsibilities**:
- User registration with email/password
- User login and JWT token generation
- Password hashing and verification
- User profile management (get, update)
- Password change and reset functionality
- Account deletion
- JWT token refresh

**Key Functions**:
- `registerUser()` - Creates new user accounts
- `loginUser()` - Authenticates users and returns tokens
- `getUserProfile()` - Retrieves user profile information
- `updateUserProfile()` - Updates user profile data
- `changePassword()` - Allows users to change their password
- `resetPassword()` - Handles password reset requests
- `deleteUser()` - Deletes user accounts
- `generateJWT()` - Creates JWT tokens
- `verifyJWT()` - Validates JWT tokens

### 2. `routes/auth.js`
**Purpose**: Defines all authentication-related API endpoints.

**Responsibilities**:
- Maps HTTP requests to controller functions
- Applies middleware (authentication, validation)
- Handles route-specific logic

**API Endpoints**:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/forgot-password` - Password reset request
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)
- `PUT /api/auth/change-password` - Change password (protected)
- `DELETE /api/auth/account` - Delete account (protected)
- `POST /api/auth/refresh-token` - Refresh JWT token

### 3. `middleware/auth.js`
**Purpose**: Handles JWT token verification and user authentication.

**Responsibilities**:
- Extracts and validates JWT tokens from requests
- Adds user information to request objects
- Implements role-based access control
- Handles token refresh validation

**Key Middleware Functions**:
- `authenticateToken()` - Verifies JWT tokens and authenticates users
- `requireRole()` - Checks if user has required permissions
- `requireOwnership()` - Verifies resource ownership
- `optionalAuth()` - Optional authentication (doesn't fail if no token)
- `validateRefreshToken()` - Validates refresh tokens

### 4. `middleware/validation.js`
**Purpose**: Handles input validation for authentication requests.

**Responsibilities**:
- Validates request bodies, query parameters, and URL parameters
- Sanitizes user input to prevent XSS attacks
- Provides custom validation rules
- Formats validation error responses

**Key Functions**:
- `validate()` - Generic validation middleware
- `handleValidationErrors()` - Processes validation errors
- `validateEmail()` - Email format validation
- `validatePassword()` - Password strength validation
- `sanitizeInput()` - Input sanitization

### 5. `middleware/validationSchemas.js`
**Purpose**: Defines validation rules and schemas for authentication requests.

**Responsibilities**:
- Defines Joi schemas for different request types
- Specifies validation rules for each field
- Ensures data integrity and security

**Validation Schemas**:
- `registerSchema` - User registration validation
- `loginSchema` - User login validation
- `updateProfileSchema` - Profile update validation
- `changePasswordSchema` - Password change validation
- `forgotPasswordSchema` - Password reset request validation
- `resetPasswordSchema` - Password reset with token validation
- `refreshTokenSchema` - Token refresh validation
- `deleteAccountSchema` - Account deletion validation

### 6. `utils/auth.js`
**Purpose**: Contains utility functions for authentication operations.

**Responsibilities**:
- Password hashing and verification using bcrypt
- JWT token generation and verification
- Email validation
- Password strength checking
- Token management utilities

**Key Utility Functions**:
- `hashPassword()` - Hashes passwords with bcrypt
- `verifyPassword()` - Verifies passwords against hashes
- `generateAccessToken()` - Creates JWT access tokens
- `generateRefreshToken()` - Creates JWT refresh tokens
- `verifyToken()` - Verifies JWT tokens
- `generateResetToken()` - Creates password reset tokens
- `checkPasswordStrength()` - Analyzes password strength
- `isValidEmail()` - Validates email format
- `generateRandomString()` - Creates secure random strings

### 7. `routes/api.js`
**Purpose**: Main API route aggregator that combines all route modules.

**Responsibilities**:
- Imports and mounts all route modules
- Provides health check and version endpoints
- Handles 404 errors for undefined routes
- Centralizes API structure

**Features**:
- Health check endpoint (`/api/health`)
- API version endpoint (`/api/version`)
- Route mounting for all modules
- 404 error handling with available routes list

## Authentication Flow

1. **Registration**: User submits email/password → validation → password hashing → user creation → JWT tokens
2. **Login**: User submits credentials → validation → password verification → JWT tokens
3. **Protected Routes**: Request includes JWT → token verification → user authentication → route access
4. **Token Refresh**: Refresh token → validation → new access token
5. **Password Reset**: Email request → reset token → password update

## Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token-based authentication
- **Input Validation**: Comprehensive request validation
- **XSS Protection**: Input sanitization
- **Rate Limiting**: (To be implemented)
- **CORS**: Cross-origin resource sharing configuration
- **Environment Variables**: Secure configuration management

## Next Steps

1. Install required dependencies (bcrypt, jsonwebtoken, joi)
2. Implement the TODO sections in each file
3. Set up environment variables for JWT secrets
4. Test authentication endpoints
5. Add rate limiting and additional security measures
6. Integrate with frontend application

## Dependencies Needed

```json
{
  "bcrypt": "^5.1.0",
  "jsonwebtoken": "^9.0.0",
  "joi": "^17.9.0"
}
```

This authentication system provides a solid foundation for secure user management in the CoFund application. 