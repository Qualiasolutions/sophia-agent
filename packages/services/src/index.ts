// Services entry point
export * from './openai.service';
export * from './whatsapp.service';
export * from './assistant.service';
export * from './calculator.service';
export * from './document-validator.service';
export * from './document-collection.service';

// Telegram services with lazy loading
export {
  TelegramService,
  getTelegramService,
  telegramService,
} from './telegram.service';

export {
  TelegramAuthService,
  getTelegramAuthService,
  telegramAuthService,
} from './telegram-auth.service';

export {
  MessageForwardService,
  getMessageForwardService,
  messageForwardService,
} from './message-forward.service';

// Rate limiting
export {
  RateLimiterService,
  getTelegramRateLimiter,
  getWhatsAppRateLimiter,
} from './rate-limiter.service';
