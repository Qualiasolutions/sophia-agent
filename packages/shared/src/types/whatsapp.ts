// WhatsApp-related types for Sophia AI

export interface SendMessageParams {
  phoneNumber: string;  // E.164 format: +35799123456
  messageText: string;
}

export interface SendMessageResult {
  success: boolean;
  messageId?: string;     // Twilio SID (e.g., SM123abc...)
  error?: string;
  timestamp: Date;
}

export interface WhatsAppConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;     // Twilio WhatsApp number
  baseUrl: string;
}

export type MessageStatus = 'queued' | 'sent' | 'delivered' | 'read' | 'failed' | 'undelivered';

export interface MessageStatusUpdate {
  messageId: string;      // MessageSid from Twilio
  status: MessageStatus;
  timestamp: Date;
  errorCode?: number;
  errorMessage?: string;
}
