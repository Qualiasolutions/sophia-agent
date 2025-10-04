'use client';

/**
 * Dashboard Overview Component
 * Epic 6, Story 6.6: System Overview & Monitoring
 *
 * Main dashboard with stats, health indicators, and activity feed
 */

import { useState, useEffect, useCallback } from 'react';
import {
  UsersIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  CalculatorIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';
import StatsCard from './StatsCard';
import HealthIndicator from './HealthIndicator';
import ActivityFeed from './ActivityFeed';

interface DashboardStats {
  totalAgents: number;
  activeConversations: number;
  messagesToday: number;
  documentsThisWeek: number;
  calculatorsThisWeek: number;
}

interface HealthCheck {
  service: string;
  status: 'online' | 'warning' | 'offline';
  lastUpdate: string | null;
  message?: string;
}

interface Activity {
  id: string;
  type: 'message' | 'document' | 'calculator';
  agentName: string;
  description: string;
  timestamp: string;
}

export default function DashboardOverview() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [health, setHealth] = useState<HealthCheck[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);

      // Fetch stats
      const statsResponse = await fetch('/api/admin/stats');
      if (!statsResponse.ok) throw new Error('Failed to fetch stats');
      const statsData = await statsResponse.json();
      setStats(statsData);

      // Fetch health
      const healthResponse = await fetch('/api/admin/health');
      if (!healthResponse.ok) throw new Error('Failed to fetch health');
      const healthData = await healthResponse.json();
      setHealth(healthData.health);

      // Fetch activities
      const activityResponse = await fetch('/api/admin/activity');
      if (!activityResponse.ok) throw new Error('Failed to fetch activities');
      const activityData = await activityResponse.json();
      setActivities(activityData.activities);

      setLastUpdated(new Date());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchDashboardData();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, fetchDashboardData]);

  const handleRefresh = () => {
    setIsLoading(true);
    fetchDashboardData();
  };

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <p className="text-red-800 font-medium">Failed to load dashboard data</p>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Refresh Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
          <p className="text-sm text-gray-600 mt-1">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <label className="flex items-center space-x-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span>Auto-refresh (30s)</span>
          </label>
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {isLoading && !stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-lg h-32 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Total Agents"
            value={stats?.totalAgents ?? 0}
            icon={<UsersIcon className="w-6 h-6" />}
          />
          <StatsCard
            title="Active Conversations"
            value={stats?.activeConversations ?? 0}
            icon={<ChatBubbleLeftRightIcon className="w-6 h-6" />}
          />
          <StatsCard
            title="Messages Today"
            value={stats?.messagesToday ?? 0}
            icon={<ChatBubbleLeftRightIcon className="w-6 h-6" />}
          />
          <StatsCard
            title="Documents This Week"
            value={stats?.documentsThisWeek ?? 0}
            icon={<DocumentTextIcon className="w-6 h-6" />}
          />
          <StatsCard
            title="Calculators This Week"
            value={stats?.calculatorsThisWeek ?? 0}
            icon={<CalculatorIcon className="w-6 h-6" />}
          />
        </div>
      )}

      {/* System Health */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">System Health</h2>
        {isLoading && health.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-20 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {health.map((check, index) => (
              <HealthIndicator
                key={index}
                service={check.service}
                status={check.status}
                lastUpdate={check.lastUpdate}
                message={check.message}
              />
            ))}
          </div>
        )}
      </div>

      {/* Recent Activity */}
      {isLoading && activities.length === 0 ? (
        <div className="bg-gray-200 rounded-lg h-96 animate-pulse" />
      ) : (
        <ActivityFeed activities={activities} />
      )}
    </div>
  );
}
