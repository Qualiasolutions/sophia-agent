'use client';

/**
 * Admin Dashboard Sidebar
 * Epic 6, Story 6.5: Admin Dashboard Authentication
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  HomeIcon,
  UsersIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CalculatorIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Overview', href: '/admin', icon: HomeIcon },
  { name: 'Agents', href: '/admin/agents', icon: UsersIcon },
  { name: 'Analytics', href: '/admin/analytics', icon: ChartBarIcon },
  { name: 'Templates', href: '/admin/templates', icon: DocumentTextIcon },
  { name: 'Calculators', href: '/admin/calculators', icon: CalculatorIcon },
  { name: 'Logs', href: '/admin/logs', icon: ClipboardDocumentListIcon },
  { name: 'Testing Lab', href: '/admin/testing', icon: BeakerIcon },
  { name: 'Settings', href: '/admin/settings', icon: Cog6ToothIcon },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex min-h-0 flex-1 flex-col bg-gray-800">
          {/* Logo */}
          <div className="flex h-16 flex-shrink-0 items-center px-4 bg-gray-900">
            <h1 className="text-white text-xl font-bold">Qualia AI Agents Suite™</h1>
          </div>

          {/* Navigation */}
          <div className="flex flex-1 flex-col overflow-y-auto">
            <nav className="flex-1 space-y-1 px-2 py-4">
              {navigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`
                      group flex items-center px-2 py-2 text-sm font-medium rounded-md
                      ${
                        isActive
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }
                    `}
                  >
                    <item.icon
                      className={`
                        mr-3 h-6 w-6 flex-shrink-0
                        ${
                          isActive
                            ? 'text-white'
                            : 'text-gray-400 group-hover:text-gray-300'
                        }
                      `}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
    </>
  );
}
