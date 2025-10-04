/**
 * Authentication Utilities
 * Epic 6, Story 6.5: Admin Dashboard Authentication
 *
 * Password hashing with bcrypt
 * Session management utilities
 */

import bcrypt from 'bcryptjs';
import { getServerSession as nextAuthGetServerSession } from 'next-auth';

/**
 * Hash a password using bcrypt
 * @param password Plain text password
 * @returns Bcrypt hash
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Verify a password against a bcrypt hash
 * @param password Plain text password
 * @param hash Bcrypt hash from database
 * @returns True if password matches
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Get server-side session
 * @returns Session object or null if not authenticated
 */
export async function getServerSession() {
  // Dynamic import to avoid circular dependency and environment issues
  const { authOptions } = await import('@/app/api/auth/[...nextauth]/route');
  return nextAuthGetServerSession(authOptions);
}

/**
 * Require authentication - throws if not authenticated
 * Use in server components that require auth
 * @returns Session object
 */
export async function requireAuth() {
  const session = await getServerSession();

  if (!session) {
    throw new Error('Unauthorized');
  }

  return session;
}

/**
 * Check if user has required role
 * @param session Session object
 * @param requiredRole Required role
 * @returns True if user has required role
 */
export function hasRole(
  session: { user?: { role?: string } } | null,
  requiredRole: string
): boolean {
  return session?.user?.role === requiredRole;
}

/**
 * Check if user is super admin
 * @param session Session object
 * @returns True if user is super admin
 */
export function isSuperAdmin(session: { user?: { role?: string } } | null): boolean {
  return hasRole(session, 'super_admin');
}
