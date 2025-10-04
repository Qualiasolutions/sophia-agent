/**
 * Next.js Middleware
 * Epic 6, Story 6.5: Admin Dashboard Authentication
 *
 * Protects admin routes - redirects unauthenticated users to login
 */

export { default } from 'next-auth/middleware';

export const config = {
  matcher: [
    /*
     * Match all admin routes except login
     */
    '/admin/((?!login).*)',
  ],
};
