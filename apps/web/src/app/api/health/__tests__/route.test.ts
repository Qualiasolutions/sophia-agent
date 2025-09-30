import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GET } from '../route';

describe('Health Check API', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.VERCEL_ENV;
  });

  afterEach(() => {
    process.env.VERCEL_ENV = originalEnv;
  });

  it('should return 200 status', async () => {
    const response = await GET();
    expect(response.status).toBe(200);
  });

  it('should return correct JSON structure', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('environment');
  });

  it('should return healthy status', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data.status).toBe('healthy');
  });

  it('should return valid ISO 8601 timestamp', async () => {
    const response = await GET();
    const data = await response.json();

    const timestamp = new Date(data.timestamp);
    expect(timestamp.toISOString()).toBe(data.timestamp);
  });

  it('should return development environment when VERCEL_ENV is not set', async () => {
    delete process.env.VERCEL_ENV;

    const response = await GET();
    const data = await response.json();

    expect(data.environment).toBe('development');
  });

  it('should return correct environment when VERCEL_ENV is set', async () => {
    process.env.VERCEL_ENV = 'production';

    const response = await GET();
    const data = await response.json();

    expect(data.environment).toBe('production');
  });
});
