# CoFund Authentication System

This document explains the file structure and responsibilities of the user authentication system for the CoFund personal finance app using Supabase Auth.

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
**Purpose**: Contains all business logic for user authentication operations using Supabase Auth.

**Responsibilities**:
- User registration via Supabase Auth
- User login via Supabase Auth
- User profile management (get, update)
- Email verification handling
- Account deletion
- Session management

**Key Functions**:
- `registerUser()` - Creates new user accounts via Supabase Auth
- `loginUser()` - Authenticates users via Supabase Auth
- `getUserProfile()` - Retrieves user profile information
- `updateUserProfile()` - Updates user profile data
- `verifyEmail()` - Handles email verification
- `deleteUser()` - Deletes user accounts
- `refreshSession()` - Refreshes Supabase sessions
- `logoutUser()` - Handles user logout

### 2. `routes/auth.js`
**Purpose**: Defines all authentication-related API endpoints.

**Responsibilities**:
- Maps HTTP requests to controller functions
- Applies middleware (authentication, validation)
- Handles route-specific logic

**API Endpoints**:
- `POST /api/auth/register` - User registration via Supabase Auth
- `POST /api/auth/login` - User login via Supabase Auth
- `POST /api/auth/logout` - User logout
- `POST /api/auth/verify-email` - Email verification
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update user profile (protected)
- `DELETE /api/auth/account` - Delete account (protected)
- `POST /api/auth/refresh-session` - Refresh Supabase session

### 3. `middleware/auth.js`
**Purpose**: Handles Supabase session verification and user authentication.

**Responsibilities**:
- Extracts and validates Supabase access tokens from requests
- Adds user information to request objects
- Implements role-based access control
- Handles session refresh validation

**Key Middleware Functions**:
- `authenticateSupabase()` - Verifies Supabase tokens and authenticates users
- `requireRole()` - Checks if user has required permissions
- `requireOwnership()` - Verifies resource ownership
- `optionalAuth()` - Optional authentication (doesn't fail if no token)
- `validateSession()` - Validates Supabase sessions

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
- `verifyEmailSchema` - Email verification validation
- `deleteAccountSchema` - Account deletion validation

### 6. `utils/auth.js`
**Purpose**: Contains utility functions for Supabase authentication operations.

**Responsibilities**:
- Supabase client initialization and configuration
- Session validation and refresh
- User data synchronization
- Email validation
- Token management utilities

**Key Utility Functions**:
- `initSupabaseClient()` - Initializes Supabase client
- `getSupabaseUser()` - Gets user from Supabase session
- `validateSupabaseSession()` - Validates Supabase sessions
- `refreshSupabaseSession()` - Refreshes Supabase sessions
- `syncUserProfile()` - Syncs user data between auth and profile tables
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

1. **Registration**: User submits email/password → Supabase Auth registration → email verification → user profile creation
2. **Login**: User submits credentials → Supabase Auth login → session creation → user data retrieval
3. **Protected Routes**: Request includes Supabase token → token verification → user authentication → route access
4. **Session Refresh**: Refresh token → Supabase session refresh → new access token
5. **Email Verification**: Email link → Supabase verification → account activation

## Security Features

- **Supabase Auth**: Built-in secure authentication with password hashing
- **Session Management**: Secure token-based authentication via Supabase
- **Email Verification**: Built-in email verification system
- **Input Validation**: Comprehensive request validation
- **XSS Protection**: Input sanitization
- **Row Level Security**: Supabase RLS policies
- **Rate Limiting**: Built-in Supabase rate limiting
- **CORS**: Cross-origin resource sharing configuration
- **Environment Variables**: Secure configuration management

## Next Steps

1. Set up Supabase project and configure authentication
2. Configure environment variables for Supabase connection
3. Implement the TODO sections in each file
4. Set up user profile table to sync with Supabase auth.users
5. Test authentication endpoints
6. Configure Row Level Security (RLS) policies
7. Integrate with frontend application

## Dependencies Needed

```json
{
  "@supabase/supabase-js": "^2.50.0",
  "joi": "^17.9.0"
}
```

This authentication system provides a solid foundation for secure user management in the CoFund application using Supabase Auth. 