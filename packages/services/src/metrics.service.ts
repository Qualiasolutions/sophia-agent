/**
 * Metrics Tracking Service
 * Tracks operational metrics for monitoring and alerting
 */

export interface MetricValue {
  count: number;
  sum?: number;
  min?: number;
  max?: number;
  lastUpdated: number;
}

export interface SystemMetrics {
  requests: {
    telegram: MetricValue;
    whatsapp: MetricValue;
    total: MetricValue;
  };
  errors: {
    telegram: MetricValue;
    whatsapp: MetricValue;
    total: MetricValue;
  };
  performance: {
    webhookResponseTime: MetricValue;
    aiResponseTime: MetricValue;
    messageProcessingTime: MetricValue;
  };
  rateLimits: {
    telegram: MetricValue;
    whatsapp: MetricValue;
  };
  users: {
    registrations: MetricValue;
    activeUsers: Set<string>;
  };
  messageForwards: {
    successful: MetricValue;
    failed: MetricValue;
  };
}

export class MetricsService {
  private metrics: SystemMetrics;
  private startTime: number;

  constructor() {
    this.startTime = Date.now();
    this.metrics = {
      requests: {
        telegram: this.createMetric(),
        whatsapp: this.createMetric(),
        total: this.createMetric(),
      },
      errors: {
        telegram: this.createMetric(),
        whatsapp: this.createMetric(),
        total: this.createMetric(),
      },
      performance: {
        webhookResponseTime: this.createMetric(),
        aiResponseTime: this.createMetric(),
        messageProcessingTime: this.createMetric(),
      },
      rateLimits: {
        telegram: this.createMetric(),
        whatsapp: this.createMetric(),
      },
      users: {
        registrations: this.createMetric(),
        activeUsers: new Set<string>(),
      },
      messageForwards: {
        successful: this.createMetric(),
        failed: this.createMetric(),
      },
    };
  }

  private createMetric(): MetricValue {
    return {
      count: 0,
      sum: 0,
      min: Infinity,
      max: -Infinity,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Track a request
   */
  trackRequest(platform: 'telegram' | 'whatsapp'): void {
    this.incrementMetric(this.metrics.requests[platform]);
    this.incrementMetric(this.metrics.requests.total);
  }

  /**
   * Track an error
   */
  trackError(platform: 'telegram' | 'whatsapp'): void {
    this.incrementMetric(this.metrics.errors[platform]);
    this.incrementMetric(this.metrics.errors.total);
  }

  /**
   * Track performance metric (in milliseconds)
   */
  trackPerformance(
    metric: 'webhookResponseTime' | 'aiResponseTime' | 'messageProcessingTime',
    duration: number
  ): void {
    this.updateMetricValue(this.metrics.performance[metric], duration);
  }

  /**
   * Track rate limit hit
   */
  trackRateLimit(platform: 'telegram' | 'whatsapp'): void {
    this.incrementMetric(this.metrics.rateLimits[platform]);
  }

  /**
   * Track user registration
   */
  trackRegistration(): void {
    this.incrementMetric(this.metrics.users.registrations);
  }

  /**
   * Track active user
   */
  trackActiveUser(userId: string): void {
    this.metrics.users.activeUsers.add(userId);
  }

  /**
   * Track message forward
   */
  trackMessageForward(success: boolean): void {
    if (success) {
      this.incrementMetric(this.metrics.messageForwards.successful);
    } else {
      this.incrementMetric(this.metrics.messageForwards.failed);
    }
  }

  /**
   * Increment a metric counter
   */
  private incrementMetric(metric: MetricValue): void {
    metric.count++;
    metric.lastUpdated = Date.now();
  }

  /**
   * Update a metric with a new value
   */
  private updateMetricValue(metric: MetricValue, value: number): void {
    metric.count++;
    metric.sum = (metric.sum || 0) + value;
    metric.min = Math.min(metric.min || Infinity, value);
    metric.max = Math.max(metric.max || -Infinity, value);
    metric.lastUpdated = Date.now();
  }

  /**
   * Get error rate (percentage)
   */
  getErrorRate(platform?: 'telegram' | 'whatsapp'): number {
    const requests = platform
      ? this.metrics.requests[platform].count
      : this.metrics.requests.total.count;
    const errors = platform
      ? this.metrics.errors[platform].count
      : this.metrics.errors.total.count;

    return requests > 0 ? (errors / requests) * 100 : 0;
  }

  /**
   * Get average performance metric
   */
  getAveragePerformance(
    metric: 'webhookResponseTime' | 'aiResponseTime' | 'messageProcessingTime'
  ): number {
    const m = this.metrics.performance[metric];
    return m.count > 0 ? (m.sum || 0) / m.count : 0;
  }

  /**
   * Get uptime in milliseconds
   */
  getUptime(): number {
    return Date.now() - this.startTime;
  }

  /**
   * Get all metrics snapshot
   */
  getMetricsSnapshot(): {
    timestamp: string;
    uptime: number;
    requests: {
      telegram: number;
      whatsapp: number;
      total: number;
    };
    errors: {
      telegram: number;
      whatsapp: number;
      total: number;
      errorRate: number;
    };
    performance: {
      webhookResponseTime: {
        avg: number;
        min: number;
        max: number;
      };
      aiResponseTime: {
        avg: number;
        min: number;
        max: number;
      };
      messageProcessingTime: {
        avg: number;
        min: number;
        max: number;
      };
    };
    rateLimits: {
      telegram: number;
      whatsapp: number;
    };
    users: {
      registrations: number;
      activeUsers: number;
    };
    messageForwards: {
      successful: number;
      failed: number;
      successRate: number;
    };
  } {
    const totalForwards =
      this.metrics.messageForwards.successful.count +
      this.metrics.messageForwards.failed.count;

    return {
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
      requests: {
        telegram: this.metrics.requests.telegram.count,
        whatsapp: this.metrics.requests.whatsapp.count,
        total: this.metrics.requests.total.count,
      },
      errors: {
        telegram: this.metrics.errors.telegram.count,
        whatsapp: this.metrics.errors.whatsapp.count,
        total: this.metrics.errors.total.count,
        errorRate: this.getErrorRate(),
      },
      performance: {
        webhookResponseTime: {
          avg: this.getAveragePerformance('webhookResponseTime'),
          min: this.metrics.performance.webhookResponseTime.min || 0,
          max: this.metrics.performance.webhookResponseTime.max || 0,
        },
        aiResponseTime: {
          avg: this.getAveragePerformance('aiResponseTime'),
          min: this.metrics.performance.aiResponseTime.min || 0,
          max: this.metrics.performance.aiResponseTime.max || 0,
        },
        messageProcessingTime: {
          avg: this.getAveragePerformance('messageProcessingTime'),
          min: this.metrics.performance.messageProcessingTime.min || 0,
          max: this.metrics.performance.messageProcessingTime.max || 0,
        },
      },
      rateLimits: {
        telegram: this.metrics.rateLimits.telegram.count,
        whatsapp: this.metrics.rateLimits.whatsapp.count,
      },
      users: {
        registrations: this.metrics.users.registrations.count,
        activeUsers: this.metrics.users.activeUsers.size,
      },
      messageForwards: {
        successful: this.metrics.messageForwards.successful.count,
        failed: this.metrics.messageForwards.failed.count,
        successRate:
          totalForwards > 0
            ? (this.metrics.messageForwards.successful.count / totalForwards) * 100
            : 0,
      },
    };
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    this.metrics = {
      requests: {
        telegram: this.createMetric(),
        whatsapp: this.createMetric(),
        total: this.createMetric(),
      },
      errors: {
        telegram: this.createMetric(),
        whatsapp: this.createMetric(),
        total: this.createMetric(),
      },
      performance: {
        webhookResponseTime: this.createMetric(),
        aiResponseTime: this.createMetric(),
        messageProcessingTime: this.createMetric(),
      },
      rateLimits: {
        telegram: this.createMetric(),
        whatsapp: this.createMetric(),
      },
      users: {
        registrations: this.createMetric(),
        activeUsers: new Set<string>(),
      },
      messageForwards: {
        successful: this.createMetric(),
        failed: this.createMetric(),
      },
    };
    this.startTime = Date.now();
  }
}

// Singleton instance
let _metricsService: MetricsService | null = null;

export function getMetricsService(): MetricsService {
  if (!_metricsService) {
    _metricsService = new MetricsService();
  }
  return _metricsService;
}
