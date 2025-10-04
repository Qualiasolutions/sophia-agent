/**
 * Next.js Middleware
 * Epic 6, Story 6.5: Admin Dashboard Authentication
 *
 * Protects admin routes - redirects unauthenticated users to login
 */

import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: {
    signIn: '/admin/login',
  },
});

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
