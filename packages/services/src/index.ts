// Services entry point
export * from './openai.service';
export * from './whatsapp.service';
export * from './assistant.service';
export * from './calculator.service';
export * from './document-validator.service';
export * from './document-collection.service';

// Optimized Document Generation Services
export * from './template-intent.service';
export * from './template-optimizer.service';
export * from './template-instructions.service';
export * from './template-cache.service';
export * from './document-optimized.service';

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

// Logging
export {
  LoggerService,
  createLogger,
  type LogLevel,
  type LogContext,
} from './logger.service';

// Metrics
export {
  MetricsService,
  getMetricsService,
  type MetricValue,
  type SystemMetrics,
} from './metrics.service';

// Analytics and Enhanced Document Services
export * from './template-analytics.service';
export * from './enhanced-document.service';

// Performance Analytics
export * from './performance-analytics.service';
export * from './flow-performance.service';
export * from './openai-optimizer.service';
