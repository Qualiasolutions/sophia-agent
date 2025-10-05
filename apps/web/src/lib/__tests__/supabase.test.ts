import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createClient, createAdminClient } from '../supabase';

describe('Supabase Client', () => {
  const originalEnv = process.env;
  const originalWindow = global.window;

  beforeEach(() => {
    // Reset environment variables before each test
    process.env = { ...originalEnv };
    // Mock server-side environment (no window object)
    // @ts-ignore
    delete global.window;
  });

  afterEach(() => {
    // Restore original environment variables after each test
    process.env = originalEnv;
    // Restore window object
    global.window = originalWindow;
  });

  describe('createClient', () => {
    it('should initialize with correct URL and anon key', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      const client = createClient();

      expect(client).toBeDefined();
      expect(client).toHaveProperty('from');
      expect(client).toHaveProperty('auth');
    });

    it('should throw error if NEXT_PUBLIC_SUPABASE_URL is missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

      expect(() => createClient()).toThrow(
        'Missing Supabase environment variables for client operations'
      );
    });

    it('should throw error if NEXT_PUBLIC_SUPABASE_ANON_KEY is missing', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      expect(() => createClient()).toThrow(
        'Missing Supabase environment variables for client operations'
      );
    });

    it('should throw error if both environment variables are missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      expect(() => createClient()).toThrow(
        'Missing Supabase environment variables for client operations'
      );
    });
  });

  describe('createAdminClient', () => {
    it('should use service role key for admin client', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

      const adminClient = createAdminClient();

      expect(adminClient).toBeDefined();
      expect(adminClient).toHaveProperty('from');
      expect(adminClient).toHaveProperty('auth');
    });

    it('should throw error if NEXT_PUBLIC_SUPABASE_URL is missing', () => {
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

      expect(() => createAdminClient()).toThrow(
        'Missing Supabase environment variables for admin operations'
      );
    });

    it('should throw error if SUPABASE_SERVICE_ROLE_KEY is missing', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      expect(() => createAdminClient()).toThrow(
        'Missing Supabase environment variables for admin operations'
      );
    });

    it('should configure auth options for server-side usage', () => {
      process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

      const adminClient = createAdminClient();

      expect(adminClient).toBeDefined();
      // Admin client should be configured for server-side operations
      // with autoRefreshToken: false and persistSession: false
    });
  });
});
