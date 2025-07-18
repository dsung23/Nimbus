/// <reference types="jest" />

// Validation function tests for SignUpScreen
// These tests validate the client-side validation logic

import {
  validateEmail,
  validatePassword,
  validateName,
  validatePhone,
  validateDateOfBirth,
} from '../utils/validation';

// Jest tests
describe('Validation Functions', () => {
  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(validateEmail('testexample.com')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      expect(validatePassword('SecurePass123!').isValid).toBe(true);
      expect(validatePassword('MyP@ssw0rd').isValid).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(validatePassword('Short1!').isValid).toBe(false);
      expect(validatePassword('securepass123!').isValid).toBe(false);
      expect(validatePassword('SECUREPASS123!').isValid).toBe(false);
      expect(validatePassword('SecurePass!').isValid).toBe(false);
      expect(validatePassword('SecurePass123').isValid).toBe(false);
    });
  });

  describe('validateName', () => {
    it('should validate correct name formats', () => {
      expect(validateName('John').isValid).toBe(true);
      expect(validateName('Mary Jane').isValid).toBe(true);
      expect(validateName('Jean-Pierre').isValid).toBe(true);
    });

    it('should reject invalid name formats', () => {
      expect(validateName('A').isValid).toBe(false);
      expect(validateName('A'.repeat(51)).isValid).toBe(false);
      expect(validateName('John123').isValid).toBe(false);
    });
  });

  describe('validatePhone', () => {
    it('should validate correct phone formats', () => {
      expect(validatePhone('+1 (555) 123-4567').isValid).toBe(true);
      expect(validatePhone('1 (555) 123-4567').isValid).toBe(true);
      expect(validatePhone('1 555 123 4567').isValid).toBe(true);
    });

    it('should reject invalid phone formats', () => {
      expect(validatePhone('123').isValid).toBe(false);
      expect(validatePhone('1'.repeat(21)).isValid).toBe(false);
      expect(validatePhone('abc123').isValid).toBe(false);
    });
  });

  describe('validateDateOfBirth', () => {
    it('should validate correct date formats', () => {
      const today = new Date();
      const eighteenYearsAgo = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
      expect(validateDateOfBirth(eighteenYearsAgo.toISOString().split('T')[0]).isValid).toBe(true);
    });

    it('should reject invalid date formats', () => {
      const today = new Date();
      const seventeenYearsAgo = new Date(today.getFullYear() - 17, today.getMonth(), today.getDate());
      const futureDate = new Date(today.getFullYear() + 1, today.getMonth(), today.getDate());
      
      expect(validateDateOfBirth(seventeenYearsAgo.toISOString().split('T')[0]).isValid).toBe(false);
      expect(validateDateOfBirth(futureDate.toISOString().split('T')[0]).isValid).toBe(false);
      expect(validateDateOfBirth('invalid-date').isValid).toBe(false);
      expect(validateDateOfBirth('').isValid).toBe(false);
    });
  });
});

// Export validation functions for use in components
export {
  validateEmail,
  validatePassword,
  validateName,
  validatePhone,
  validateDateOfBirth,
}; 