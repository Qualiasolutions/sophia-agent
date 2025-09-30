import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '../route';

// Mock the Supabase client
vi.mock('@/lib/supabase', () => ({
  createAdminClient: vi.fn(),
}));

describe('Database Test Endpoint', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 200 status with valid database connection', async () => {
    const mockAgents = [
      {
        id: 'test-uuid-1',
        phone_number: '+35799123456',
        name: 'Test Agent One',
        email: 'agent1@test.com',
        is_active: true,
        created_at: '2025-09-30T00:00:00Z',
        updated_at: '2025-09-30T00:00:00Z',
      },
      {
        id: 'test-uuid-2',
        phone_number: '+35799654321',
        name: 'Test Agent Two',
        email: 'agent2@test.com',
        is_active: true,
        created_at: '2025-09-30T00:00:00Z',
        updated_at: '2025-09-30T00:00:00Z',
      },
    ];

    const mockSupabaseClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockAgents,
            error: null,
            count: 2,
          }),
        }),
      }),
    };

    const { createAdminClient } = await import('@/lib/supabase');
    vi.mocked(createAdminClient).mockReturnValue(
      mockSupabaseClient as ReturnType<typeof createAdminClient>
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('connected');
    expect(data.agentCount).toBe(2);
    expect(data.agents).toHaveLength(2);
  });

  it('should return correct JSON structure with agentCount and agents array', async () => {
    const mockAgents = [
      {
        id: 'test-uuid-1',
        phone_number: '+35799123456',
        name: 'Test Agent One',
        email: 'agent1@test.com',
        is_active: true,
        created_at: '2025-09-30T00:00:00Z',
        updated_at: '2025-09-30T00:00:00Z',
      },
    ];

    const mockSupabaseClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: mockAgents,
            error: null,
            count: 1,
          }),
        }),
      }),
    };

    const { createAdminClient } = await import('@/lib/supabase');
    vi.mocked(createAdminClient).mockReturnValue(
      mockSupabaseClient as ReturnType<typeof createAdminClient>
    );

    const response = await GET();
    const data = await response.json();

    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('agentCount');
    expect(data).toHaveProperty('agents');
    expect(Array.isArray(data.agents)).toBe(true);
    expect(data.agentCount).toBe(1);
    expect(data.agents[0]).toHaveProperty('id');
    expect(data.agents[0]).toHaveProperty('phone_number');
    expect(data.agents[0]).toHaveProperty('name');
    expect(data.agents[0]).toHaveProperty('email');
  });

  it('should handle database connection errors gracefully', async () => {
    const mockSupabaseClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Connection failed' },
            count: null,
          }),
        }),
      }),
    };

    const { createAdminClient } = await import('@/lib/supabase');
    vi.mocked(createAdminClient).mockReturnValue(
      mockSupabaseClient as ReturnType<typeof createAdminClient>
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.status).toBe('error');
    expect(data.message).toBe('Failed to query database');
    expect(data.error).toBe('Connection failed');
  });

  it('should handle client initialization errors gracefully', async () => {
    const { createAdminClient } = await import('@/lib/supabase');
    vi.mocked(createAdminClient).mockImplementation(() => {
      throw new Error('Failed to initialize client');
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.status).toBe('error');
    expect(data.message).toBe('Database connection failed');
    expect(data.error).toBe('Failed to initialize client');
  });

  it('should return empty array when no agents exist', async () => {
    const mockSupabaseClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({
            data: [],
            error: null,
            count: 0,
          }),
        }),
      }),
    };

    const { createAdminClient } = await import('@/lib/supabase');
    vi.mocked(createAdminClient).mockReturnValue(
      mockSupabaseClient as ReturnType<typeof createAdminClient>
    );

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('connected');
    expect(data.agentCount).toBe(0);
    expect(data.agents).toEqual([]);
  });
});
