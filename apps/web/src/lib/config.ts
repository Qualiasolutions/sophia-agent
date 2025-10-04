// Story 6.9: Configuration Utility Functions
import { createClient } from '@/lib/supabase/server';

// In-memory cache for configuration
const configCache = new Map<string, { value: unknown; timestamp: number }>();
const CACHE_TTL = 60000; // 1 minute

/**
 * Get configuration value by key with caching
 */
export async function getConfig<T = unknown>(key: string): Promise<T | null> {
  // Check cache first
  const cached = configCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.value as T;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('system_config')
      .select('value')
      .eq('key', key)
      .single();

    if (error || !data) {
      console.error(`Failed to get config key: ${key}`, error);
      return null;
    }

    const value = JSON.parse(data.value);
    configCache.set(key, { value, timestamp: Date.now() });
    return value as T;
  } catch (error) {
    console.error(`Error getting config key: ${key}`, error);
    return null;
  }
}

/**
 * Set configuration value by key
 */
export async function setConfig(
  key: string,
  value: unknown,
  userId?: string
): Promise<boolean> {
  try {
    const supabase = await createClient();
    const updateData: Record<string, string> = {
      value: JSON.stringify(value),
      updated_at: new Date().toISOString(),
    };

    if (userId) {
      updateData.updated_by = userId;
    }

    const { error } = await supabase
      .from('system_config')
      .update(updateData)
      .eq('key', key);

    if (error) {
      console.error(`Failed to set config key: ${key}`, error);
      return false;
    }

    // Invalidate cache
    configCache.delete(key);
    return true;
  } catch (error) {
    console.error(`Error setting config key: ${key}`, error);
    return false;
  }
}

/**
 * Get all configuration as key-value object
 */
export async function getAllConfig(): Promise<Record<string, unknown>> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('system_config')
      .select('key, value');

    if (error || !data) {
      console.error('Failed to get all config', error);
      return {};
    }

    const config: Record<string, unknown> = {};
    data.forEach((item) => {
      config[item.key] = JSON.parse(item.value);
    });

    return config;
  } catch (error) {
    console.error('Error getting all config', error);
    return {};
  }
}

/**
 * Invalidate cache for a specific key or all keys
 */
export function invalidateConfigCache(key?: string): void {
  if (key) {
    configCache.delete(key);
  } else {
    configCache.clear();
  }
}

/**
 * Validators for specific config keys
 */
export const configValidators: Record<string, (value: unknown) => boolean> = {
  openai_model: (value) =>
    typeof value === 'string' && ['gpt-4-turbo', 'gpt-4o', 'gpt-3.5-turbo'].includes(value),
  response_timeout_ms: (value) => typeof value === 'number' && value >= 1000 && value <= 60000,
  rate_limit_per_second: (value) => typeof value === 'number' && value > 0 && value <= 100,
  max_conversation_history: (value) => typeof value === 'number' && value > 0 && value <= 50,
  auto_archive_days: (value) => typeof value === 'number' && value > 0 && value <= 365,
  whatsapp_webhook_url: (value) => typeof value === 'string' && /^https?:\/\/.+/.test(value),
  telegram_webhook_url: (value) =>
    typeof value === 'string' && (value === '' || /^https?:\/\/.+/.test(value)),
};

/**
 * Validate config value before setting
 */
export function validateConfigValue(key: string, value: unknown): boolean {
  const validator = configValidators[key];
  return validator ? validator(value) : true;
}
