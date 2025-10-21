'use client';

// Templates Management Page
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function TemplatesPage() {
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Template Management</h1>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-4">Available Template Categories</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link
              href="/admin/templates/documents"
              className="block p-6 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
            >
              <h3 className="text-lg font-medium text-blue-900 mb-2">Document Templates</h3>
              <p className="text-blue-700 text-sm">
                Manage document templates for registrations, viewing forms, and marketing agreements
              </p>
            </Link>

            <div className="block p-6 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Email Templates</h3>
              <p className="text-gray-700 text-sm">
                Email templates (coming soon)
              </p>
            </div>

            <div className="block p-6 bg-gray-50 border border-gray-200 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">SMS Templates</h3>
              <p className="text-gray-700 text-sm">
                SMS templates (coming soon)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">12</div>
                <div className="text-gray-600">Registration Templates</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">4</div>
                <div className="text-gray-600">Viewing Forms</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">1</div>
                <div className="text-gray-600">Marketing Agreements</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}