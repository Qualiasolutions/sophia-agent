/**
 * NextAuth.js Configuration
 * Epic 6, Story 6.5: Admin Dashboard Authentication
 *
 * Credentials-based authentication for admin users
 */

import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { createClient } from '@supabase/supabase-js';
import { verifyPassword } from '@/lib/auth';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Query admin user from database
          const { data: adminUser, error } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', credentials.email)
            .eq('is_active', true)
            .single();

          if (error || !adminUser) {
            return null;
          }

          // Verify password
          const isValid = await verifyPassword(
            credentials.password,
            adminUser.password_hash
          );

          if (!isValid) {
            return null;
          }

          // Update last login timestamp
          await supabase
            .from('admin_users')
            .update({ last_login_at: new Date().toISOString() })
            .eq('id', adminUser.id);

          // Return user object (will be available in session)
          return {
            id: adminUser.id,
            email: adminUser.email,
            name: adminUser.full_name,
            role: adminUser.role,
          };
        } catch (error) {
          console.error('Auth error:', error);
          return null;
        }
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
