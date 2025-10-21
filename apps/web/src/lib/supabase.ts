import { createClient as createSupabaseClient } from '@supabase/supabase-js';

/**
 * Validates required environment variables and throws descriptive error if missing
 */
function validateEnvVars(vars: Record<string, string | undefined>, context: string): void {
  const missing = Object.entries(vars)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(
      `Missing Supabase environment variables for ${context}: ${missing.join(', ')} are required`
    );
  }
}

/**
 * Runtime check to ensure admin client is only used server-side
 * Throws error if called in browser environment
 */
function assertServerSideOnly(functionName: string): void {
  if (typeof window !== 'undefined') {
    throw new Error(
      `${functionName} can only be used in server-side contexts (API routes, Server Components, Server Actions). ` +
      'Use createClient() for client-side operations instead.'
    );
  }
}

/**
 * Creates a Supabase client for client-side operations
 * Uses the anon key which respects Row Level Security policies
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  validateEnvVars(
    {
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseAnonKey,
    },
    'client operations'
  );

  return createSupabaseClient(supabaseUrl!, supabaseAnonKey!);
}

/**
 * Creates a Supabase admin client for server-side operations
 * Uses the service role key which bypasses Row Level Security policies
 *
 * IMPORTANT: Can only be used in server-side contexts (API routes, Server Components, Server Actions)
 * Will throw error if called in browser environment
 */
export function createAdminClient() {
  assertServerSideOnly('createAdminClient');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  validateEnvVars(
    {
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
      SUPABASE_SERVICE_ROLE_KEY: supabaseServiceRoleKey,
    },
    'admin operations'
  );

  return createSupabaseClient(supabaseUrl!, supabaseServiceRoleKey!, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Attempts to create a Supabase admin client without throwing if configuration is missing.
 * Useful for build-time imports where environment variables might not be set.
 */
export function tryCreateAdminClient() {
  try {
    return createAdminClient();
  } catch (error) {
    console.warn(
      '[Supabase] Admin client unavailable. Check environment configuration if this occurs outside local builds.',
      error instanceof Error ? error.message : error
    );
    return null;
  }
}
