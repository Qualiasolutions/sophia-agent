/**
 * Message Forwarding Service
 * Story 6.3: Telegram Message Forwarding
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { MessageForward, ForwardResult } from '@sophiaai/shared/types/telegram';
import { whatsappService } from './whatsapp.service';

export class MessageForwardService {
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
   * Forward message from Telegram to WhatsApp
   */
  async forwardToWhatsApp(params: {
    agentId: string;
    telegramChatId: string;
    recipientPhone: string;
    message: string;
    messageType?: 'text' | 'photo' | 'document';
  }): Promise<ForwardResult> {
    const { agentId, telegramChatId, recipientPhone, message, messageType = 'text' } = params;

    try {
      // Format phone number (ensure it has + prefix)
      const formattedPhone = recipientPhone.startsWith('+')
        ? recipientPhone
        : `+${recipientPhone}`;

      // Send message via WhatsApp
      await whatsappService.sendMessage(formattedPhone, message);

      // Log the forward
      await this.logMessageForward({
        agentId,
        sourcePlatform: 'telegram',
        sourceChatId: telegramChatId,
        destinationPlatform: 'whatsapp',
        destinationIdentifier: formattedPhone,
        messageContent: message,
        messageType,
        forwardStatus: 'sent',
      });

      return {
        success: true,
      };
    } catch (error) {
      console.error('Failed to forward message to WhatsApp:', error);

      // Log the failed forward
      await this.logMessageForward({
        agentId,
        sourcePlatform: 'telegram',
        sourceChatId: telegramChatId,
        destinationPlatform: 'whatsapp',
        destinationIdentifier: recipientPhone,
        messageContent: message,
        messageType,
        forwardStatus: 'failed',
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Log message forward to database
   */
  private async logMessageForward(params: {
    agentId: string;
    sourcePlatform: 'telegram' | 'whatsapp';
    sourceChatId: string;
    destinationPlatform: 'telegram' | 'whatsapp';
    destinationIdentifier: string;
    messageContent?: string;
    messageType: 'text' | 'photo' | 'document';
    forwardStatus: 'pending' | 'sent' | 'failed';
    errorMessage?: string;
  }): Promise<void> {
    try {
      await this.supabase.from('message_forwards').insert({
        agent_id: params.agentId,
        source_platform: params.sourcePlatform,
        source_chat_id: params.sourceChatId,
        destination_platform: params.destinationPlatform,
        destination_identifier: params.destinationIdentifier,
        message_content: params.messageContent,
        message_type: params.messageType,
        forward_status: params.forwardStatus,
        error_message: params.errorMessage,
      });
    } catch (error) {
      console.error('Failed to log message forward:', error);
    }
  }

  /**
   * Get forwarding history for an agent
   */
  async getForwardHistory(agentId: string, limit = 50): Promise<MessageForward[]> {
    const { data, error } = await this.supabase
      .from('message_forwards')
      .select('*')
      .eq('agent_id', agentId)
      .order('forwarded_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching forward history:', error);
      throw error;
    }

    return data || [];
  }

  /**
   * Parse forward command from message
   * Format: "forward to +35799123456: Your message here"
   * or: "/forward +35799123456 Your message here"
   */
  static parseForwardCommand(text: string): {
    isForwardCommand: boolean;
    recipient?: string;
    message?: string;
  } {
    // Pattern 1: "forward to +35799123456: message"
    const pattern1 = /^forward\s+to\s+(\+?\d+)\s*:\s*(.+)$/i;
    const match1 = text.match(pattern1);

    if (match1) {
      return {
        isForwardCommand: true,
        recipient: match1[1],
        message: match1[2].trim(),
      };
    }

    // Pattern 2: "/forward +35799123456 message"
    const pattern2 = /^\/forward\s+(\+?\d+)\s+(.+)$/i;
    const match2 = text.match(pattern2);

    if (match2) {
      return {
        isForwardCommand: true,
        recipient: match2[1],
        message: match2[2].trim(),
      };
    }

    return {
      isForwardCommand: false,
    };
  }

  /**
   * Validate phone number format (Cyprus)
   */
  static validatePhoneNumber(phone: string): boolean {
    // Cyprus phone: +357 followed by 8 digits
    // Also accept generic international format
    const phoneRegex = /^\+?(\d{1,4})?\d{8,15}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
  }
}

// Export singleton instance
export const messageForwardService = new MessageForwardService();
