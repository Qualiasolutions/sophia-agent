/**
 * Telegram Authentication Service
 * Story 6.2: Telegram User Authentication & Registration
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { TelegramUserDB } from '@sophiaai/shared';

export class TelegramAuthService {
  private supabase: SupabaseClient;

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials are required');
    }

    this.supabase = createClient(supabaseUrl, supabaseKey);
  }

  /**
   * Check if a Telegram user is registered
   */
  async isUserRegistered(telegramUserId: number): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('telegram_users')
      .select('id')
      .eq('telegram_user_id', telegramUserId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows returned"
      console.error('Error checking registration:', error);
      throw error;
    }

    return !!data;
  }

  /**
   * Get Telegram user by telegram_user_id
   */
  async getTelegramUser(telegramUserId: number): Promise<TelegramUserDB | null> {
    const { data, error } = await this.supabase
      .from('telegram_users')
      .select('*')
      .eq('telegram_user_id', telegramUserId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error getting Telegram user:', error);
      throw error;
    }

    return data;
  }

  /**
   * Get agent by email (for registration)
   */
  async getAgentByEmail(email: string): Promise<{ id: string; email: string } | null> {
    const { data, error } = await this.supabase
      .from('agents')
      .select('id, email')
      .eq('email', email.toLowerCase().trim())
      .eq('status', 'active')
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error getting agent:', error);
      throw error;
    }

    return data;
  }

  /**
   * Register a new Telegram user
   */
  async registerTelegramUser(params: {
    telegramUserId: number;
    chatId: number;
    agentId: string;
    username?: string;
    firstName?: string;
    lastName?: string;
  }): Promise<TelegramUserDB> {
    const { data, error } = await this.supabase
      .from('telegram_users')
      .insert({
        agent_id: params.agentId,
        telegram_user_id: params.telegramUserId,
        telegram_username: params.username,
        telegram_first_name: params.firstName,
        telegram_last_name: params.lastName,
        chat_id: params.chatId,
        is_active: true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error registering Telegram user:', error);
      throw error;
    }

    return data;
  }

  /**
   * Update last active timestamp
   */
  async updateLastActive(telegramUserId: number): Promise<void> {
    const { error } = await this.supabase
      .from('telegram_users')
      .update({ last_active_at: new Date().toISOString() })
      .eq('telegram_user_id', telegramUserId);

    if (error) {
      console.error('Error updating last active:', error);
    }
  }

  /**
   * Deactivate a Telegram user
   */
  async deactivateTelegramUser(telegramUserId: number): Promise<void> {
    const { error } = await this.supabase
      .from('telegram_users')
      .update({ is_active: false })
      .eq('telegram_user_id', telegramUserId);

    if (error) {
      console.error('Error deactivating Telegram user:', error);
      throw error;
    }
  }

  /**
   * Validate email format
   */
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Lazy singleton instance
let _instance: TelegramAuthService | null = null;

export function getTelegramAuthService(): TelegramAuthService {
  if (!_instance) {
    _instance = new TelegramAuthService();
  }
  return _instance;
}

// Deprecated: use getTelegramAuthService() instead
// This is for backward compatibility
export const telegramAuthService = {
  get isUserRegistered() { return getTelegramAuthService().isUserRegistered.bind(getTelegramAuthService()); },
  get getTelegramUser() { return getTelegramAuthService().getTelegramUser.bind(getTelegramAuthService()); },
  get getAgentByEmail() { return getTelegramAuthService().getAgentByEmail.bind(getTelegramAuthService()); },
  get registerTelegramUser() { return getTelegramAuthService().registerTelegramUser.bind(getTelegramAuthService()); },
  get updateLastActive() { return getTelegramAuthService().updateLastActive.bind(getTelegramAuthService()); },
  get deactivateTelegramUser() { return getTelegramAuthService().deactivateTelegramUser.bind(getTelegramAuthService()); },
};
