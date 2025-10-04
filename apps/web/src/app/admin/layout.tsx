/**
 * Admin Dashboard Layout
 * Epic 6, Story 6.5: Admin Dashboard Authentication
 *
 * Protected layout with authentication check and navigation
 */

import { redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession();

  // Redirect to login if not authenticated
  if (!session) {
    redirect('/admin/login');
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Content Area */}
      <div className="lg:pl-64">
        {/* Header */}
        <AdminHeader session={session} />

        {/* Page Content */}
        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
