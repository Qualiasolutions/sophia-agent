/**
 * NextAuth.js Configuration
 * Epic 6, Story 6.5: Admin Dashboard Authentication
 *
 * Access code authentication for admin users
 */

import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';

const ADMIN_ACCESS_CODE_HASH = process.env.ADMIN_ACCESS_CODE_HASH;
const ADMIN_ACCESS_CODE_FALLBACK = process.env.ADMIN_ACCESS_CODE;

if (!ADMIN_ACCESS_CODE_HASH && !ADMIN_ACCESS_CODE_FALLBACK) {
  console.warn(
    '[Auth] ADMIN_ACCESS_CODE_HASH (or ADMIN_ACCESS_CODE for local overrides) is not configured. Admin login will be disabled.'
  );
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Access Code',
      credentials: {
        accessCode: { label: 'Access Code', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.accessCode) {
          return null;
        }

        const providedCode = credentials.accessCode.trim();

        if (!ADMIN_ACCESS_CODE_HASH && !ADMIN_ACCESS_CODE_FALLBACK) {
          console.error('[Auth] Admin access attempted without configured secret');
          return null;
        }

        if (ADMIN_ACCESS_CODE_HASH) {
          const matches = await bcrypt.compare(providedCode, ADMIN_ACCESS_CODE_HASH);
          if (!matches) {
            return null;
          }
        } else if (ADMIN_ACCESS_CODE_FALLBACK) {
          if (process.env.NODE_ENV === 'production') {
            console.error(
              '[Auth] ADMIN_ACCESS_CODE fallback rejected in production. Configure ADMIN_ACCESS_CODE_HASH instead.'
            );
            return null;
          }

          if (providedCode !== ADMIN_ACCESS_CODE_FALLBACK) {
            return null;
          }

          console.warn(
            '[Auth] Using ADMIN_ACCESS_CODE fallback. Configure ADMIN_ACCESS_CODE_HASH for secure deployments.'
          );
        }

        // Verify access code
        return {
          id: 'admin',
          email: 'admin@qualiasolutions.com',
          name: 'Qualia AI Agents Suite™ Admin',
          role: 'admin',
        };
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      // Add user data to token on sign in
      if (user) {
        token.id = user.id;
        token.role = (user as unknown as { role: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
      // Add token data to session
      if (session.user) {
        (session.user as unknown as { id: string; role: string }).id = token.id as string;
        (session.user as unknown as { id: string; role: string }).role = token.role as string;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
