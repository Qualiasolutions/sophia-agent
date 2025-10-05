import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';

// Helper to create a mock NextRequest
function createMockRequest(url: string = 'http://localhost:3000/api/health'): NextRequest {
  return new NextRequest(url);
}

describe('Health Check API', () => {
  let originalEnv: string | undefined;

  beforeEach(() => {
    originalEnv = process.env.VERCEL_ENV;
  });

  afterEach(() => {
    process.env.VERCEL_ENV = originalEnv;
  });

  it('should return 200 status', async () => {
    const request = createMockRequest();
    const response = await GET(request);
    expect(response.status).toBe(200);
  });

  it('should return correct JSON structure', async () => {
    const request = createMockRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('timestamp');
    expect(data).toHaveProperty('environment');
    expect(data).toHaveProperty('uptime');
    expect(data).toHaveProperty('uptimeMs');
  });

  it('should return healthy status', async () => {
    const request = createMockRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(data.status).toBe('healthy');
  });

  it('should return valid ISO 8601 timestamp', async () => {
    const request = createMockRequest();
    const response = await GET(request);
    const data = await response.json();

    const timestamp = new Date(data.timestamp);
    expect(timestamp.toISOString()).toBe(data.timestamp);
  });

  it('should return development environment when VERCEL_ENV is not set', async () => {
    delete process.env.VERCEL_ENV;

    const request = createMockRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(data.environment).toBe('development');
  });

  it('should return correct environment when VERCEL_ENV is set', async () => {
    process.env.VERCEL_ENV = 'production';

    const request = createMockRequest();
    const response = await GET(request);
    const data = await response.json();

    expect(data.environment).toBe('production');
  });
});
