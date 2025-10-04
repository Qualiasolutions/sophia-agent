/**
 * Stats Card Component
 * Epic 6, Story 6.6: System Overview & Monitoring
 *
 * Displays a metric card with title, value, and optional icon
 */

import { ReactNode } from 'react';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

export default function StatsCard({ title, value, icon, trend }: StatsCardProps) {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600',
  };

  const trendIcons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        </div>
        {icon && (
          <div className="ml-4 p-3 bg-blue-50 rounded-lg text-blue-600">
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className={`mt-4 flex items-center text-sm ${trendColors[trend]}`}>
          <span className="mr-1">{trendIcons[trend]}</span>
          <span className="font-medium">
            {trend === 'up' ? 'Increasing' : trend === 'down' ? 'Decreasing' : 'Stable'}
          </span>
        </div>
      )}
    </div>
  );
}
