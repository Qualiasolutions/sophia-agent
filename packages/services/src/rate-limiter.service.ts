/**
 * Rate Limiter Service
 * Implements simple in-memory rate limiting
 *
 * For production, consider using Redis-backed rate limiting
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export class RateLimiterService {
  private requests: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor(
    private readonly maxRequests: number = 30, // 30 requests
    private readonly windowMs: number = 60000 // per minute
  ) {
    // Clean up expired entries every minute
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.requests.entries()) {
        if (entry.resetAt < now) {
          this.requests.delete(key);
        }
      }
    }, this.windowMs);
  }

  /**
   * Check if request is allowed for given identifier
   * @param identifier Unique identifier (e.g., user ID, IP address)
   * @returns Object with allowed status and retry information
   */
  checkLimit(identifier: string): {
    allowed: boolean;
    remaining: number;
    resetAt: number;
  } {
    const now = Date.now();
    const entry = this.requests.get(identifier);

    // No existing entry or expired entry
    if (!entry || entry.resetAt < now) {
      const resetAt = now + this.windowMs;
      this.requests.set(identifier, {
        count: 1,
        resetAt,
      });

      return {
        allowed: true,
        remaining: this.maxRequests - 1,
        resetAt,
      };
    }

    // Check if limit exceeded
    if (entry.count >= this.maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: entry.resetAt,
      };
    }

    // Increment counter
    entry.count++;

    return {
      allowed: true,
      remaining: this.maxRequests - entry.count,
      resetAt: entry.resetAt,
    };
  }

  /**
   * Reset rate limit for identifier (useful for testing or manual resets)
   */
  reset(identifier: string): void {
    this.requests.delete(identifier);
  }

  /**
   * Clear all rate limit data
   */
  clearAll(): void {
    this.requests.clear();
  }

  /**
   * Get current stats for identifier
   */
  getStats(identifier: string): {
    requests: number;
    limit: number;
    resetAt: number | null;
  } {
    const entry = this.requests.get(identifier);

    return {
      requests: entry?.count || 0,
      limit: this.maxRequests,
      resetAt: entry?.resetAt || null,
    };
  }

  /**
   * Cleanup interval (call on service shutdown)
   */
  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.requests.clear();
  }
}

// Singleton instance for Telegram webhook rate limiting
let _telegramRateLimiter: RateLimiterService | null = null;

export function getTelegramRateLimiter(): RateLimiterService {
  if (!_telegramRateLimiter) {
    // 30 messages per minute per user (Telegram's limit)
    _telegramRateLimiter = new RateLimiterService(30, 60000);
  }
  return _telegramRateLimiter;
}

// Singleton instance for WhatsApp webhook rate limiting
let _whatsappRateLimiter: RateLimiterService | null = null;

export function getWhatsAppRateLimiter(): RateLimiterService {
  if (!_whatsappRateLimiter) {
    // 80 messages per second for WhatsApp Business API
    _whatsappRateLimiter = new RateLimiterService(80, 1000);
  }
  return _whatsappRateLimiter;
}
