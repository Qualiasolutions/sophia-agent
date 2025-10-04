// Story 6.9: Configuration Utility Tests
import { describe, it, expect } from 'vitest';
import { validateConfigValue, configValidators } from '../config';

describe('Configuration Utilities', () => {
  describe('validateConfigValue', () => {
    it('should validate openai_model values', () => {
      expect(validateConfigValue('openai_model', 'gpt-4-turbo')).toBe(true);
      expect(validateConfigValue('openai_model', 'gpt-4o')).toBe(true);
      expect(validateConfigValue('openai_model', 'gpt-3.5-turbo')).toBe(true);
      expect(validateConfigValue('openai_model', 'invalid-model')).toBe(false);
    });

    it('should validate response_timeout_ms values', () => {
      expect(validateConfigValue('response_timeout_ms', 5000)).toBe(true);
      expect(validateConfigValue('response_timeout_ms', 1000)).toBe(true);
      expect(validateConfigValue('response_timeout_ms', 60000)).toBe(true);
      expect(validateConfigValue('response_timeout_ms', 500)).toBe(false); // too low
      expect(validateConfigValue('response_timeout_ms', 100000)).toBe(false); // too high
    });

    it('should validate rate_limit_per_second values', () => {
      expect(validateConfigValue('rate_limit_per_second', 80)).toBe(true);
      expect(validateConfigValue('rate_limit_per_second', 1)).toBe(true);
      expect(validateConfigValue('rate_limit_per_second', 100)).toBe(true);
      expect(validateConfigValue('rate_limit_per_second', 0)).toBe(false);
      expect(validateConfigValue('rate_limit_per_second', 101)).toBe(false);
    });

    it('should validate max_conversation_history values', () => {
      expect(validateConfigValue('max_conversation_history', 10)).toBe(true);
      expect(validateConfigValue('max_conversation_history', 1)).toBe(true);
      expect(validateConfigValue('max_conversation_history', 50)).toBe(true);
      expect(validateConfigValue('max_conversation_history', 0)).toBe(false);
      expect(validateConfigValue('max_conversation_history', 51)).toBe(false);
    });

    it('should validate auto_archive_days values', () => {
      expect(validateConfigValue('auto_archive_days', 30)).toBe(true);
      expect(validateConfigValue('auto_archive_days', 1)).toBe(true);
      expect(validateConfigValue('auto_archive_days', 365)).toBe(true);
      expect(validateConfigValue('auto_archive_days', 0)).toBe(false);
      expect(validateConfigValue('auto_archive_days', 400)).toBe(false);
    });

    it('should validate webhook URL values', () => {
      expect(
        validateConfigValue('whatsapp_webhook_url', 'https://example.com/webhook')
      ).toBe(true);
      expect(
        validateConfigValue('whatsapp_webhook_url', 'http://example.com/webhook')
      ).toBe(true);
      expect(validateConfigValue('whatsapp_webhook_url', 'invalid-url')).toBe(
        false
      );
      expect(validateConfigValue('telegram_webhook_url', '')).toBe(true); // empty is allowed for telegram
      expect(
        validateConfigValue('telegram_webhook_url', 'https://example.com')
      ).toBe(true);
    });

    it('should return true for unknown config keys', () => {
      expect(validateConfigValue('unknown_key', 'any-value')).toBe(true);
    });
  });

  describe('configValidators', () => {
    it('should have validators for all expected config keys', () => {
      const expectedKeys = [
        'openai_model',
        'response_timeout_ms',
        'rate_limit_per_second',
        'max_conversation_history',
        'auto_archive_days',
        'whatsapp_webhook_url',
        'telegram_webhook_url',
      ];

      expectedKeys.forEach((key) => {
        expect(configValidators).toHaveProperty(key);
        expect(typeof configValidators[key]).toBe('function');
      });
    });
  });
});
