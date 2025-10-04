/**
 * Next.js Middleware
 * Epic 6, Story 6.5: Admin Dashboard Authentication
 *
 * Protects admin routes - redirects unauthenticated users to login
 */

import { NextResponse } from 'next/server';
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(_req) {
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/admin/login',
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all admin routes except login
     * Using negative lookahead to exclude /admin/login
     */
    '/admin/:path((?!login).*)*',
  ],
};
