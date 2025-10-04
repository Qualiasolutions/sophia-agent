'use client';

// Admin Dashboard Home Page
import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Settings Card */}
        <Link
          href="/admin/settings"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl">⚙️</div>
            <h2 className="text-xl font-semibold">System Settings</h2>
          </div>
          <p className="text-gray-600">
            Configure OpenAI model, timeouts, rate limits, and webhook URLs.
          </p>
        </Link>

        {/* Calculators Card */}
        <Link
          href="/admin/calculators"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl">🧮</div>
            <h2 className="text-xl font-semibold">Calculators</h2>
          </div>
          <p className="text-gray-600">
            Manage real estate calculators, descriptions, and input fields.
          </p>
        </Link>

        {/* Templates Card */}
        <Link
          href="/admin/templates/documents"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl">📄</div>
            <h2 className="text-xl font-semibold">Document Templates</h2>
          </div>
          <p className="text-gray-600">
            View document template usage statistics and metadata.
          </p>
        </Link>

        {/* Logs Card */}
        <Link
          href="/admin/logs"
          className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
        >
          <div className="flex items-center gap-4 mb-4">
            <div className="text-4xl">📝</div>
            <h2 className="text-xl font-semibold">System Logs</h2>
          </div>
          <p className="text-gray-600">
            View, filter, and export system logs and error messages.
          </p>
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="mt-8 bg-white p-6 rounded-lg shadow border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Quick Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
          <div>
            <p className="font-medium text-gray-900">Configuration</p>
            <p>System settings can be updated in real-time</p>
          </div>
          <div>
            <p className="font-medium text-gray-900">Calculators</p>
            <p>Enable/disable calculators without code changes</p>
          </div>
          <div>
            <p className="font-medium text-gray-900">Logs</p>
            <p>Export logs as CSV for analysis</p>
          </div>
        </div>
      </div>
    </div>
  );
}
