/**
 * TelegramAuthService Tests
 * Story 6.2: Telegram User Authentication & Registration
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock Supabase BEFORE importing services
const mockFrom = vi.fn();
const mockSupabaseClient = {
  from: mockFrom,
};

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabaseClient),
}));

// Now import the service
import { TelegramAuthService, getTelegramAuthService } from '../telegram-auth.service';

describe('TelegramAuthService', () => {
  let service: TelegramAuthService;

  beforeEach(() => {
    // Set up environment
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Constructor', () => {
    it('should throw error if Supabase credentials are missing', () => {
      const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;

      expect(() => new TelegramAuthService()).toThrow(
        'Supabase credentials are required'
      );

      // Restore
      process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    });
  });

  describe('isUserRegistered', () => {
    beforeEach(() => {
      service = getTelegramAuthService();
    });

    it('should return true for registered user', async () => {
      const mockData = { id: 'user-123' };

      mockFrom.mockReturnValueOnce({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: mockData, error: null })),
            })),
          })),
        })),
      }));

      const result = await service.isUserRegistered(123456);

      expect(result).toBe(true);
    });

    it('should return false for unregistered user', async () => {
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: null, error: { code: 'PGRST116' } })
              ),
            })),
          })),
        })),
      }));

      const result = await service.isUserRegistered(999999);

      expect(result).toBe(false);
    });

    it('should throw error on database failure', async () => {
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({
                  data: null,
                  error: { code: 'PGRST500', message: 'Database error' }
                })
              ),
            })),
          })),
        })),
      }));

      await expect(service.isUserRegistered(123456)).rejects.toThrow();
    });
  });

  describe('getTelegramUser', () => {
    it('should return user data for registered user', async () => {
      const mockUser = {
        id: 'user-123',
        agent_id: 'agent-456',
        telegram_user_id: 123456,
        telegram_username: 'testuser',
        chat_id: 789,
        is_active: true,
      };

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: mockUser, error: null })),
            })),
          })),
        })),
      }));

      const result = await service.getTelegramUser(123456);

      expect(result).toEqual(mockUser);
    });

    it('should return null for unregistered user', async () => {
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: null, error: { code: 'PGRST116' } })
              ),
            })),
          })),
        })),
      }));

      const result = await service.getTelegramUser(999999);

      expect(result).toBeNull();
    });
  });

  describe('getAgentByEmail', () => {
    it('should return agent for valid email', async () => {
      const mockAgent = {
        id: 'agent-123',
        email: 'test@zyprus.com',
      };

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({ data: mockAgent, error: null })),
            })),
          })),
        })),
      }));

      const result = await service.getAgentByEmail('test@zyprus.com');

      expect(result).toEqual(mockAgent);
    });

    it('should normalize email to lowercase', async () => {
      const mockAgent = {
        id: 'agent-123',
        email: 'test@zyprus.com',
      };

      let capturedEmail = '';

      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn((column: string, value: string) => {
            if (column === 'email') {
              capturedEmail = value;
            }
            return {
              eq: vi.fn(() => ({
                single: vi.fn(() => Promise.resolve({ data: mockAgent, error: null })),
              })),
            };
          }),
        })),
      }));

      await service.getAgentByEmail('TEST@ZYPRUS.COM');

      expect(capturedEmail).toBe('test@zyprus.com');
    });

    it('should return null for non-existent email', async () => {
      mockSupabase.from = vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() =>
                Promise.resolve({ data: null, error: { code: 'PGRST116' } })
              ),
            })),
          })),
        })),
      }));

      const result = await service.getAgentByEmail('nonexistent@example.com');

      expect(result).toBeNull();
    });
  });

  describe('registerTelegramUser', () => {
    it('should register new user successfully', async () => {
      const mockRegisteredUser = {
        id: 'user-123',
        agent_id: 'agent-456',
        telegram_user_id: 123456,
        telegram_username: 'testuser',
        chat_id: 789,
        is_active: true,
        registered_at: new Date().toISOString(),
      };

      mockSupabase.from = vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({ data: mockRegisteredUser, error: null })
            ),
          })),
        })),
      }));

      const result = await service.registerTelegramUser({
        telegramUserId: 123456,
        chatId: 789,
        agentId: 'agent-456',
        username: 'testuser',
        firstName: 'Test',
        lastName: 'User',
      });

      expect(result).toEqual(mockRegisteredUser);
    });

    it('should throw error on registration failure', async () => {
      mockSupabase.from = vi.fn(() => ({
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(() =>
              Promise.resolve({
                data: null,
                error: { message: 'Duplicate user' }
              })
            ),
          })),
        })),
      }));

      await expect(
        service.registerTelegramUser({
          telegramUserId: 123456,
          chatId: 789,
          agentId: 'agent-456',
        })
      ).rejects.toThrow();
    });
  });

  describe('updateLastActive', () => {
    it('should update last active timestamp', async () => {
      mockSupabase.from = vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      }));

      await service.updateLastActive(123456);

      expect(mockSupabase.from).toHaveBeenCalledWith('telegram_users');
    });
  });

  describe('deactivateTelegramUser', () => {
    it('should deactivate user successfully', async () => {
      mockSupabase.from = vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => Promise.resolve({ error: null })),
        })),
      }));

      await service.deactivateTelegramUser(123456);

      expect(mockSupabase.from).toHaveBeenCalledWith('telegram_users');
    });

    it('should throw error on deactivation failure', async () => {
      mockSupabase.from = vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() =>
            Promise.resolve({ error: { message: 'User not found' } })
          ),
        })),
      }));

      await expect(service.deactivateTelegramUser(999999)).rejects.toThrow();
    });
  });

  describe('validateEmail', () => {
    it('should validate correct email formats', () => {
      expect(TelegramAuthService.validateEmail('test@example.com')).toBe(true);
      expect(TelegramAuthService.validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(TelegramAuthService.validateEmail('test+tag@example.com')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(TelegramAuthService.validateEmail('invalid')).toBe(false);
      expect(TelegramAuthService.validateEmail('test@')).toBe(false);
      expect(TelegramAuthService.validateEmail('@example.com')).toBe(false);
      expect(TelegramAuthService.validateEmail('test @example.com')).toBe(false);
      expect(TelegramAuthService.validateEmail('')).toBe(false);
    });
  });
});
