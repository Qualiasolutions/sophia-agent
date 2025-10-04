/**
 * Admin Dashboard Layout
 * Epic 6, Story 6.5: Admin Dashboard Authentication
 *
 * Protected layout with authentication check and navigation
 * Note: Login page has its own layout to bypass this auth check
 */

import { getServerSession } from '@/lib/auth';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  // If no session, render children without layout (login page handles its own layout)
  if (!session) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex-1 flex flex-col">
        {/* Header */}
        <AdminHeader session={session} />

        {/* Page Content */}
        <main className="flex-1 py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4 px-4">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Zyprus Logo */}
            <div className="flex items-center">
              <img
                src="https://www.zyprus.com/themes/custom/rocketship_theme_starter/logo.png"
                alt="Zyprus Logo"
                className="h-8"
              />
            </div>

            {/* Powered by Qualia Solutions */}
            <div className="text-sm text-gray-600">
              Powered by:{' '}
              <a
                href="https://qualiasolutions.net"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Qualia Solutions
              </a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
