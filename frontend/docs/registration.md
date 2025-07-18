# Registration Component Documentation

## Overview
The registration system connects the React Native frontend with the Node.js/Express backend for user account creation. The implementation includes comprehensive client-side validation that mirrors the backend's Joi validation schemas.

## Components

### SignUpScreen (`frontend/src/screens/SignUpScreen.tsx`)
Main registration form component with the following features:
- Real-time field validation
- Field-specific error display
- Password strength requirements
- Age verification (18+ requirement)
- Form state management

### AuthService (`frontend/src/api/authService.ts`)
API service layer that handles:
- Registration API calls
- Token storage
- Error handling for backend validation
- Response mapping to User type

### Validation Functions (`frontend/src/__tests__/validation.test.ts`)
Reusable validation functions that match backend Joi schemas:
- Email validation
- Password strength validation
- Name format validation
- Phone number validation
- Date of birth validation

## Validation Rules

### Frontend Validation (matches backend Joi schemas)

#### Email
- Required field
- Must be valid email format
- Regex: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`

#### Password
- Minimum 8 characters
- Must contain:
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (`@$!%*?&`)

#### First/Last Name
- Minimum 2 characters
- Maximum 50 characters
- Only letters, spaces, hyphens, and apostrophes allowed
- Regex: `/^[a-zA-Z\s'-]+$/`

#### Phone Number
- Minimum 10 digits
- Maximum 20 characters
- Allows: `+`, digits, spaces, hyphens, parentheses
- Regex: `/^\+?[\d\s\-\(\)]+$/`

#### Date of Birth
- Must be valid ISO date
- Cannot be in the future
- User must be at least 18 years old

## API Integration

### Backend Endpoint
- **URL**: `POST /api/auth/register`
- **Base URL**: `http://192.168.1.129:3789`
- **Content-Type**: `application/json`

### Request Payload
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1 (555) 123-4567",
  "date_of_birth": "1990-01-01"
}
```

### Response Structure
```json
{
  "success": true,
  "message": "User registered successfully! Please check your email to verify your account.",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1 (555) 123-4567",
    "date_of_birth": "1990-01-01",
    "is_active": true,
    "created_at": "2024-01-01T00:00:00.000Z"
  },
  "auth": {
    "session": {
      "access_token": "...",
      "refresh_token": "..."
    },
    "confirmation_sent_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### Error Handling
- **Validation Errors**: Field-specific errors returned in `errors` array
- **Network Errors**: Generic network error messages
- **Backend Errors**: Server error messages from backend

## User Experience Features

### Real-time Validation
- Fields validate as user types
- Error messages clear when user starts typing
- Field-specific error display

### Loading States
- Button shows "Creating Account..." during submission
- Form disabled during API calls

### Error Display
- General errors shown at top of form
- Field-specific errors shown below each input
- Clear error styling with red borders and text

## Security Features

### Input Sanitization
- XSS prevention (handled by backend)
- Input trimming and validation
- Secure token storage

### Password Security
- Strong password requirements
- Secure text entry for password field
- Password strength validation

## Navigation Flow
1. User fills registration form
2. Client-side validation runs
3. Form submits to backend
4. On success: Navigate to TellerConnect screen
5. On error: Display error messages
6. After TellerConnect: User signed in and redirected to main app

## Testing

### Manual Testing
See `testing-guide.md` for comprehensive manual testing scenarios including:
- Happy path testing
- Validation testing
- Error handling testing
- User experience testing

### Automated Testing
```bash
# Run validation tests
npm run test validation.test.ts

# Run all tests
npm run test

# Run tests with coverage
npm run test:coverage
```

### Test Coverage
- ✅ Email validation tests
- ✅ Password strength tests
- ✅ Name format tests
- ✅ Phone number tests
- ✅ Date of birth tests
- ✅ API integration tests
- ✅ Error handling tests

## Dependencies
- React Native
- Styled Components
- AsyncStorage (for token storage)
- React Navigation
- Expo Vector Icons
- Jest (for testing)

## Implementation Status

### ✅ Completed
- Frontend-backend integration
- Comprehensive validation
- Error handling
- User experience features
- Documentation
- Testing framework

### 🔄 Ready for Testing
- Manual testing scenarios
- Automated validation tests
- Integration testing
- Performance testing

### 📋 Next Steps
1. Run manual tests using testing guide
2. Execute automated validation tests
3. Test backend integration
4. Performance and security testing
5. Cross-platform testing

## Troubleshooting

### Common Issues
1. **Network Errors**: Check backend server is running on port 3789
2. **Validation Errors**: Ensure all fields meet requirements
3. **Token Issues**: Check AsyncStorage permissions
4. **Navigation Errors**: Verify React Navigation setup

### Debug Information
- Check console logs for API responses
- Verify network connectivity
- Test with different input data
- Check backend logs for errors

## Performance Considerations
- Form validation is optimized for real-time feedback
- API calls include proper error handling
- Token storage uses AsyncStorage for persistence
- Loading states prevent multiple submissions

## Security Considerations
- Passwords are validated on both frontend and backend
- Input sanitization prevents XSS attacks
- Tokens are stored securely in AsyncStorage
- Age verification prevents underage registrations 