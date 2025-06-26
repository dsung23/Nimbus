// tests/auth-middleware.test.js

const {
  requireRole,
  requireOwnership,
  requireActiveAccount
} = require('../src/middleware/auth');

describe('Auth Middleware Functions', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      user: null,
      params: {},
      body: {},
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('requireRole', () => {
    it('should allow user with sufficient role', () => {
      req.user = {
        id: '123',
        role: 'admin',
        is_active: true
      };

      const middleware = requireRole('user');
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny user with insufficient role', () => {
      req.user = {
        id: '123',
        role: 'user',
        is_active: true
      };

      const middleware = requireRole('admin');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Required role: admin',
        userRole: 'user'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny inactive user', () => {
      req.user = {
        id: '123',
        role: 'admin',
        is_active: false
      };

      const middleware = requireRole('user');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Account is inactive'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny unauthenticated user', () => {
      req.user = null;

      const middleware = requireRole('user');
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });


  describe('requireActiveAccount', () => {
    it('should allow active user', () => {
      req.user = {
        id: '123',
        is_active: true
      };

      requireActiveAccount(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny inactive user', () => {
      req.user = {
        id: '123',
        is_active: false
      };

      requireActiveAccount(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Account is inactive. Please contact support.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny unauthenticated user', () => {
      req.user = null;

      requireActiveAccount(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Authentication required'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
}); 