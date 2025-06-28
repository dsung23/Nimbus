# Registration Testing Guide

## Overview
This guide provides comprehensive testing scenarios for the user registration functionality, covering both manual testing and automated validation tests.

## Manual Testing Scenarios

### 1. Happy Path Testing

#### Successful Registration
**Steps:**
1. Navigate to Sign Up screen
2. Fill in all fields with valid data:
   - First Name: "John"
   - Last Name: "Doe"
   - Email: "test@example.com"
   - Phone: "+1 (555) 123-4567"
   - Date of Birth: Select date (18+ years ago)
   - Password: "SecurePass123!"
3. Tap "Create Account"
4. Verify navigation to TellerConnect screen

**Expected Result:** User should be registered successfully and redirected to TellerConnect screen.

### 2. Validation Testing

#### Email Validation
- **Valid:** test@example.com, user.name@domain.co.uk
- **Invalid:** test@, @example.com, test.example.com, empty field

#### Password Validation
- **Valid:** SecurePass123!, MyP@ssw0rd, Str0ng#Pass
- **Invalid:** 
  - Too short: "Short1!"
  - No uppercase: "securepass123!"
  - No lowercase: "SECUREPASS123!"
  - No number: "SecurePass!"
  - No special char: "SecurePass123"

#### Name Validation
- **Valid:** John, Mary Jane, Jean-Pierre, O'Connor
- **Invalid:**
  - Too short: "A"
  - Too long: 51+ characters
  - Invalid chars: "John123", "User@Name"

#### Phone Validation
- **Valid:** +1 (555) 123-4567, 1 555 123 4567, +1234567890
- **Invalid:**
  - Too short: "123"
  - Too long: 21+ characters
  - Invalid chars: "abc123", "phone@number"

#### Date of Birth Validation
- **Valid:** Any date 18+ years ago
- **Invalid:**
  - Under 18 years old
  - Future date
  - Invalid format: "invalid-date"
  - Empty field

### 3. Error Handling Testing

#### Network Error
**Steps:**
1. Disconnect from internet
2. Attempt registration
3. Verify error message: "A network error occurred."

#### Backend Validation Error
**Steps:**
1. Use existing email address
2. Submit form
3. Verify error message from backend

#### Field-Specific Errors
**Steps:**
1. Leave required fields empty
2. Submit form
3. Verify field-specific error messages appear below each input

### 4. User Experience Testing

#### Real-time Validation
**Steps:**
1. Start typing in any field
2. Verify error messages clear when typing begins
3. Verify validation occurs as user types

#### Loading States
**Steps:**
1. Fill form with valid data
2. Submit form
3. Verify button shows "Creating Account..." and is disabled

#### Error Display
**Steps:**
1. Trigger validation errors
2. Verify errors appear with red styling
3. Verify general error appears at top of form

## Automated Testing

### Running Validation Tests

```bash
# Navigate to frontend directory
cd frontend

# Run validation tests
npm run test validation.test.ts
```

### Test Coverage

The validation tests cover:
- Email format validation
- Password strength requirements
- Name format and length validation
- Phone number format validation
- Date of birth validation (18+ requirement)

### Test Results

All tests should pass with the following validation rules:

#### Email Tests
- ✅ Valid email formats
- ❌ Invalid formats (no @, no domain, empty)

#### Password Tests
- ✅ Strong passwords (8+ chars, uppercase, lowercase, number, special char)
- ❌ Weak passwords (too short, missing requirements)

#### Name Tests
- ✅ Valid names (2-50 chars, letters/spaces/hyphens/apostrophes)
- ❌ Invalid names (too short, too long, invalid characters)

#### Phone Tests
- ✅ Valid phone numbers (10+ digits, formatting allowed)
- ❌ Invalid numbers (too short, too long, invalid characters)

#### Date of Birth Tests
- ✅ Valid dates (18+ years old, not in future)
- ❌ Invalid dates (under 18, future date, invalid format)

## Integration Testing

### Backend Integration
**Prerequisites:**
- Backend server running on port 3789
- Supabase database configured
- Network connectivity

**Test Steps:**
1. Start backend server
2. Start frontend app
3. Complete registration flow
4. Verify user created in database
5. Verify email confirmation sent

### API Endpoint Testing
**Endpoint:** `POST /api/auth/register`

**Test Cases:**
1. **Valid Request:**
   ```json
   {
     "email": "test@example.com",
     "password": "SecurePass123!",
     "first_name": "John",
     "last_name": "Doe",
     "phone": "+1 (555) 123-4567",
     "date_of_birth": "1990-01-01"
   }
   ```

2. **Invalid Request (Missing Fields):**
   ```json
   {
     "email": "test@example.com",
     "password": "SecurePass123!"
   }
   ```

3. **Invalid Request (Weak Password):**
   ```json
   {
     "email": "test@example.com",
     "password": "weak",
     "first_name": "John",
     "last_name": "Doe",
     "phone": "+1 (555) 123-4567",
     "date_of_birth": "1990-01-01"
   }
   ```

## Performance Testing

### Load Testing
- Test with multiple concurrent registrations
- Verify backend handles rate limiting
- Check for memory leaks during registration

### Network Testing
- Test with slow network connections
- Test with intermittent connectivity
- Verify timeout handling

## Security Testing

### Input Validation
- Test XSS prevention
- Test SQL injection attempts
- Test special character handling

### Token Security
- Verify tokens are stored securely
- Test token expiration handling
- Verify refresh token functionality

## Accessibility Testing

### Screen Reader Support
- Test with VoiceOver (iOS)
- Test with TalkBack (Android)
- Verify error messages are announced

### Keyboard Navigation
- Test tab order through form fields
- Verify keyboard shortcuts work
- Test form submission with keyboard

## Cross-Platform Testing

### iOS Testing
- Test on different iOS versions
- Test on different screen sizes
- Test with different accessibility settings

### Android Testing
- Test on different Android versions
- Test on different screen densities
- Test with different input methods

## Bug Reporting

When reporting bugs, include:
1. **Steps to reproduce**
2. **Expected behavior**
3. **Actual behavior**
4. **Device/OS information**
5. **Network conditions**
6. **Screenshots/videos if applicable**

## Test Data Management

### Test Accounts
- Use unique email addresses for each test
- Clean up test data after testing
- Use realistic but fake data

### Database Cleanup
- Remove test users after testing
- Reset test data between test runs
- Verify no production data is affected 