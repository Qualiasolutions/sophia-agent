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
     * Match specific admin routes, excluding login
     */
    '/admin',
    '/admin/agents/:path*',
    '/admin/analytics/:path*',
    '/admin/templates/:path*',
    '/admin/calculators/:path*',
    '/admin/logs/:path*',
    '/admin/settings/:path*',
  ],
};
