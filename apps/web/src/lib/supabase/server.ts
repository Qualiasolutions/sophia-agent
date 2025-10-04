// Server-side Supabase client
// This module exports a createClient function for server-side operations
import { createAdminClient } from '../supabase';

/**
 * Creates a Supabase client for server-side operations
 * This wraps createAdminClient for use in API routes and server components
 */
export function createClient() {
  return createAdminClient();
}
