# Authentication API Contract

## User Registration

**Endpoint:**
POST /api/auth/register

**Request Body:**
```json
{
  "email": "user@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "phone": "+1234567890",
  "date_of_birth": "1990-01-01",
  "password": "yourPassword123"
}
```
- **All fields are required.**
- `email` must be a valid email.
- `date_of_birth` format: YYYY-MM-DD
- `phone` must be a string (E.164 format recommended)

**Response (Success):**
```json
{
  "success": true,
  "message": "Registration successful.",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "date_of_birth": "1990-01-01",
    "email_verified": false,
    "created_at": "2025-06-23T12:34:56.789Z",
    "is_active": true,
    "preferences": { "role": "user" }
  },
  "token": "jwt_token"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Email already exists."
}
```

---

## User Login

**Endpoint:**
POST /api/auth/login

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "yourPassword123"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful.",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "phone": "+1234567890",
    "date_of_birth": "1990-01-01",
    "email_verified": false,
    "created_at": "2025-06-23T12:34:56.789Z",
    "is_active": true,
    "preferences": { "role": "user" }
  },
  "token": "jwt_token",
  "refreshToken": "refresh_token"
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid email or password."
}
```

---

**Notes:**
- All requests and responses are JSON.
- All registration fields are now required: `first_name`, `last_name`, `phone`, `date_of_birth`, `email`, `password`.
- The user object matches the schema in `userSchema.js`.
- Error messages are always in the `message` field, and `success` is a boolean. 