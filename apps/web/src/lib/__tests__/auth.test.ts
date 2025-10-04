/**
 * Authentication Utilities Tests
 * Epic 6, Story 6.5: Admin Dashboard Authentication
 */

import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../auth';

describe('Authentication Utilities', () => {
  describe('hashPassword', () => {
    it('should generate a bcrypt hash from a password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      // Bcrypt hashes start with $2b$ and are 60 characters
      expect(hash).toMatch(/^\$2[aby]\$/);
      expect(hash.length).toBe(60);
    });

    it('should generate different hashes for the same password (salting)', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      // Same password should produce different hashes due to random salt
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password against hash', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword('WrongPassword', hash);
      expect(isValid).toBe(false);
    });

    it('should reject empty password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword('', hash);
      expect(isValid).toBe(false);
    });

    it('should handle case-sensitive passwords', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword('testpassword123!', hash);
      expect(isValid).toBe(false);
    });
  });

  describe('Password Security', () => {
    it('should work with special characters', async () => {
      const password = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should work with long passwords', async () => {
      const password = 'a'.repeat(100); // 100 character password
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should work with unicode characters', async () => {
      const password = 'Пароль123!密码';
      const hash = await hashPassword(password);

      const isValid = await verifyPassword(password, hash);
      expect(isValid).toBe(true);
    });
  });
});
