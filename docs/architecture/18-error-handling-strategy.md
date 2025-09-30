# 18. Error Handling Strategy

## 18.1 Error Class Hierarchy

```typescript
// packages/shared/src/errors/base.error.ts

export abstract class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational: boolean = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class ExternalAPIError extends AppError {
  constructor(service: string, originalError: unknown) {
    super(`External API error: ${service}`, 503, true);
  }
}

export class DatabaseError extends AppError {
  constructor(operation: string, originalError: unknown) {
    super(`Database error during ${operation}`, 500, true);
  }
}
```

## 18.2 Retry Strategy

**Exponential Backoff**:

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt < maxRetries) {
        const delay = initialDelay * Math.pow(2, attempt - 1);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}
```

**Circuit Breaker Pattern**:

```typescript
class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount = 0;

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN');
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

## 18.3 Error Recovery Checklist

| Error Type | Detection | Recovery |
|------------|-----------|----------|
| **Database Connection Lost** | Health check fails | Reconnect with backoff |
| **OpenAI API Down** | Circuit breaker opens | Use fallback classification |
| **WhatsApp Timeout** | No response in 5s | Queue message for retry |
| **Rate Limit Exceeded** | 429 response | Exponential backoff |

---
