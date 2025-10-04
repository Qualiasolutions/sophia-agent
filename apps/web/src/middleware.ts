/**
 * Next.js Middleware
 * Epic 6, Story 6.5: Admin Dashboard Authentication
 *
 * Protects admin routes - redirects unauthenticated users to login
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths that don't require authentication
  const publicPaths = ['/admin/login', '/api/auth'];

  // Allow access to public paths
  if (publicPaths.some(path => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Only apply auth check to admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Check if user is authenticated
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Redirect to login if not authenticated
  if (!token) {
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all requests to check authentication
     * Exclude static files, images, and public files
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
