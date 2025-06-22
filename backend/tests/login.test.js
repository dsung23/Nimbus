// tests/login.test.js

const request = require('supertest');
const express = require('express');

// Mock Supabase before importing the app
jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      signInWithPassword: jest.fn(),
      getUser: jest.fn()
    },
    from: jest.fn(() => ({
      update: jest.fn(() => ({
        eq: jest.fn(() => ({
          select: jest.fn(() => ({
            single: jest.fn()
          }))
        }))
      })),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn()
        }))
      }))
    }))
  }))
}));

// Import the mocked Supabase
const { createClient } = require('@supabase/supabase-js');

// Create Express app for testing
const app = express();
app.use(express.json());

// Import routes
const apiRoutes = require('../src/routes/api');
app.use('/api', apiRoutes);

// Mock data
const mockUser = {
  id: '123',
  email: 'test@foo.com',
  email_confirmed_at: null,
  first_name: 'Test',
  last_name: 'User',
  phone: '+1-555-123-4567',
  date_of_birth: '1990-01-01',
  email_verified: false,
  is_active: true,
  preferences: {},
  last_login: '2024-01-15T10:30:00Z',
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T10:30:00Z'
};

const mockSession = {
  access_token: 'mock-access-token',
  refresh_token: 'mock-refresh-token',
  expires_at: 999
};

describe('POST /api/auth/login', () => {
  let supabase;
  let supabaseAdmin;

  beforeAll(() => {
    // Create mock Supabase clients
    supabase = createClient();
    supabaseAdmin = createClient();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Successful login', () => {
    it('should return 200 with user data and auth tokens when credentials are valid', async () => {
      // Mock successful authentication
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: '123',
            email: 'test@foo.com',
            email_confirmed_at: null
          },
          session: mockSession
        },
        error: null
      });

      // Mock successful profile update
      supabaseAdmin.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      });

      // Mock successful profile fetch
      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUser,
              error: null
            })
          })
        })
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@foo.com',
          password: 'SecurePass123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        first_name: mockUser.first_name,
        last_name: mockUser.last_name,
        phone: mockUser.phone,
        date_of_birth: mockUser.date_of_birth,
        email_verified: mockUser.email_verified,
        is_active: mockUser.is_active,
        preferences: mockUser.preferences,
        last_login: mockUser.last_login,
        created_at: mockUser.created_at
      });
      expect(response.body.auth).toEqual({
        access_token: mockSession.access_token,
        refresh_token: mockSession.refresh_token,
        expires_at: mockSession.expires_at
      });

      // Verify Supabase calls
      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@foo.com',
        password: 'SecurePass123!'
      });
    });
  });

  describe('Invalid credentials', () => {
    it('should return 401 when credentials are invalid', async () => {
      // Mock failed authentication
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: null,
        error: { message: 'Invalid login credentials' }
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@foo.com',
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Invalid login credentials');

      expect(supabase.auth.signInWithPassword).toHaveBeenCalledWith({
        email: 'test@foo.com',
        password: 'WrongPassword123!'
      });
    });
  });

  describe('Missing fields', () => {
    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'SecurePass123!'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(error => error.field === 'email')).toBe(true);
    });

    it('should return 400 when password is missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@foo.com'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.some(error => error.field === 'password')).toBe(true);
    });

    it('should return 400 when both email and password are missing', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Profile fetch failure', () => {
    it('should return 200 with basic user data when profile fetch fails', async () => {
      // Mock successful authentication
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: '123',
            email: 'test@foo.com',
            email_confirmed_at: null
          },
          session: mockSession
        },
        error: null
      });

      // Mock successful profile update
      supabaseAdmin.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ error: null })
        })
      });

      // Mock failed profile fetch
      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Profile not found' }
            })
          })
        })
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@foo.com',
          password: 'SecurePass123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.user).toEqual({
        id: '123',
        email: 'test@foo.com',
        email_verified: false
      });
      expect(response.body.auth).toEqual({
        access_token: mockSession.access_token,
        refresh_token: mockSession.refresh_token,
        expires_at: mockSession.expires_at
      });
    });
  });

  describe('Profile update failure', () => {
    it('should still succeed when profile update fails', async () => {
      // Mock successful authentication
      supabase.auth.signInWithPassword.mockResolvedValue({
        data: {
          user: {
            id: '123',
            email: 'test@foo.com',
            email_confirmed_at: null
          },
          session: mockSession
        },
        error: null
      });

      // Mock failed profile update
      supabaseAdmin.from.mockReturnValue({
        update: jest.fn().mockReturnValue({
          eq: jest.fn().mockResolvedValue({ 
            error: { message: 'Update failed' } 
          })
        })
      });

      // Mock successful profile fetch
      supabaseAdmin.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUser,
              error: null
            })
          })
        })
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@foo.com',
          password: 'SecurePass123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
    });
  });

  describe('Server error', () => {
    it('should return 500 when an unexpected error occurs', async () => {
      // Mock authentication to throw an error
      supabase.auth.signInWithPassword.mockRejectedValue(
        new Error('Database connection failed')
      );

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@foo.com',
          password: 'SecurePass123!'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Internal server error');
      expect(response.body.error).toBe('Database connection failed');
    });
  });

  describe('Rate limiting', () => {
    it('should return 429 when too many requests are made', async () => {
      // Make multiple requests to trigger rate limiting
      const requests = Array(6).fill().map(() =>
        request(app)
          .post('/api/auth/login')
          .send({
            email: 'test@foo.com',
            password: 'SecurePass123!'
          })
      );

      const responses = await Promise.all(requests);
      
      // The last request should be rate limited
      const lastResponse = responses[responses.length - 1];
      expect(lastResponse.status).toBe(429);
      expect(lastResponse.body.success).toBe(false);
      expect(lastResponse.body.message).toContain('Too many authentication attempts');
    });
  });
});