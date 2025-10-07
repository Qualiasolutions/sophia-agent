/**
 * NextAuth.js Configuration
 * Epic 6, Story 6.5: Admin Dashboard Authentication
 *
 * Access code authentication for admin users
 */

import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const ADMIN_ACCESS_CODE = 'Qualia5162786';

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

        // Verify access code
        if (credentials.accessCode === ADMIN_ACCESS_CODE) {
          // Return generic admin user object
          return {
            id: 'admin',
            email: 'admin@qualiasolutions.com',
            name: 'Qualia AI Agents Suite™ Admin',
            role: 'admin',
          };
        }

        return null;
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
