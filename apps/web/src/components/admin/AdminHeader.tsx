'use client';

/**
 * Admin Dashboard Header
 * Epic 6, Story 6.5: Admin Dashboard Authentication
 */

import { signOut } from 'next-auth/react';
import { Session } from 'next-auth';

interface AdminHeaderProps {
  session: Session;
}

export default function AdminHeader({ session }: AdminHeaderProps) {
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/admin/login' });
  };

  return (
    <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white shadow">
      <div className="flex flex-1 justify-between px-4 sm:px-6 lg:px-8">
        {/* Left side - empty for now, can add breadcrumbs later */}
        <div className="flex flex-1"></div>

        {/* Right side - User info and logout */}
        <div className="ml-4 flex items-center md:ml-6">
          {/* User Info */}
          <div className="flex items-center">
            <div className="text-sm">
              <p className="font-medium text-gray-700">{session.user?.name}</p>
              <p className="text-xs text-gray-500">{session.user?.email}</p>
            </div>

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="ml-4 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
