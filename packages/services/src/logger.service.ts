/**
 * Structured Logging Service
 * Provides consistent logging across the application with structured data
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogContext {
  [key: string]: unknown;
  timestamp?: string;
  service?: string;
  agentId?: string;
  userId?: string;
  requestId?: string;
}

export class LoggerService {
  constructor(private readonly serviceName: string) {}

  private log(level: LogLevel, message: string, context?: LogContext): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      service: this.serviceName,
      message,
      ...context,
    };

    // In production, send to logging service (Datadog, CloudWatch, etc.)
    // For now, use structured console logging
    const output = JSON.stringify(logEntry);

    switch (level) {
      case 'debug':
        console.debug(output);
        break;
      case 'info':
        console.info(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'error':
        console.error(output);
        break;
    }
  }

  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context);
  }

  error(message: string, context?: LogContext): void {
    this.log('error', message, context);
  }

  // Convenience method for performance tracking
  trackPerformance(
    operation: string,
    duration: number,
    context?: LogContext
  ): void {
    this.info(`Performance: ${operation}`, {
      ...context,
      operation,
      durationMs: duration,
    });
  }

  // Convenience method for tracking business events
  trackEvent(event: string, context?: LogContext): void {
    this.info(`Event: ${event}`, {
      ...context,
      event,
    });
  }
}

// Factory function for creating loggers
export function createLogger(serviceName: string): LoggerService {
  return new LoggerService(serviceName);
}
