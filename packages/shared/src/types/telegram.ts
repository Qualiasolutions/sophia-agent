/**
 * Telegram Bot API Types
 * Story 6.1: Telegram Bot Setup & Webhook Integration
 */

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
  edited_channel_post?: TelegramMessage;
  callback_query?: TelegramCallbackQuery;
}

export interface TelegramMessage {
  message_id: number;
  from?: TelegramUser;
  chat: TelegramChat;
  date: number;
  text?: string;
  photo?: TelegramPhotoSize[];
  document?: TelegramDocument;
  reply_to_message?: TelegramMessage;
}

export interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramChat {
  id: number;
  type: 'private' | 'group' | 'supergroup' | 'channel';
  title?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
}

export interface TelegramPhotoSize {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
  file_size?: number;
}

export interface TelegramDocument {
  file_id: string;
  file_unique_id: string;
  file_name?: string;
  mime_type?: string;
  file_size?: number;
}

export interface TelegramCallbackQuery {
  id: string;
  from: TelegramUser;
  message?: TelegramMessage;
  data?: string;
}

export interface SendMessageOptions {
  parse_mode?: 'Markdown' | 'MarkdownV2' | 'HTML';
  disable_web_page_preview?: boolean;
  disable_notification?: boolean;
  reply_to_message_id?: number;
}

export interface WebhookInfo {
  url: string;
  has_custom_certificate: boolean;
  pending_update_count: number;
  last_error_date?: number;
  last_error_message?: string;
  max_connections?: number;
  allowed_updates?: string[];
}

/**
 * Story 6.2: Telegram User Authentication Types
 */
export interface TelegramUserDB {
  id: string;
  agent_id: string;
  telegram_user_id: number;
  telegram_username?: string;
  telegram_first_name?: string;
  telegram_last_name?: string;
  chat_id: number;
  is_active: boolean;
  registered_at: string;
  last_active_at: string;
}

export type TelegramRegistrationState = 'awaiting_email' | 'completed';

/**
 * Story 6.3: Message Forwarding Types
 */
export interface MessageForward {
  id: string;
  agent_id: string;
  source_platform: 'telegram' | 'whatsapp';
  source_chat_id: string;
  destination_platform: 'telegram' | 'whatsapp';
  destination_identifier: string;
  message_content?: string;
  message_type: 'text' | 'photo' | 'document';
  forward_status: 'pending' | 'sent' | 'failed';
  error_message?: string;
  forwarded_at: string;
}

export interface ForwardRequest {
  recipient: string;
  message: string;
  messageType?: 'text' | 'photo' | 'document';
}

export interface ForwardResult {
  success: boolean;
  chatId?: number;
  error?: string;
}
