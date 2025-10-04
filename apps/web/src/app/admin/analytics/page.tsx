/**
 * Admin Analytics Page
 * Epic 6, Story 6.8: Analytics & Reporting
 *
 * Displays analytics charts and metrics
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface AnalyticsData {
  messagesPerDay: { date: string; count: number }[];
  documentsPerDay: { date: string; count: number }[];
  calculatorsPerDay: { date: string; count: number }[];
  documentTypes: { name: string; value: number }[];
  calculatorTypes: { name: string; value: number }[];
  topAgents: { name: string; count: number }[];
  peakHour: number;
  totalMessages: number;
  totalDocuments: number;
  totalCalculators: number;
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('30'); // days

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/analytics?days=${dateRange}`);

      if (!response.ok) {
        throw new Error('Failed to fetch analytics data');
      }

      const analyticsData = await response.json();
      setData(analyticsData);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 bg-gray-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
        <div className="h-96 bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">{error || 'Failed to load analytics'}</p>
        <button
          onClick={fetchAnalytics}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Analytics</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track usage patterns and performance metrics
          </p>
        </div>

        {/* Date Range Selector */}
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-sm font-medium text-gray-500">Total Messages</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">
            {data.totalMessages.toLocaleString()}
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-sm font-medium text-gray-500">Total Documents</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">
            {data.totalDocuments.toLocaleString()}
          </div>
        </div>
        <div className="bg-white shadow rounded-lg p-6">
          <div className="text-sm font-medium text-gray-500">Peak Hour</div>
          <div className="mt-2 text-3xl font-semibold text-gray-900">
            {data.peakHour}:00
          </div>
        </div>
      </div>

      {/* Messages Over Time */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Messages Over Time</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data.messagesPerDay}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis />
            <Tooltip
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#3B82F6"
              strokeWidth={2}
              name="Messages"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Documents and Calculators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Documents Generated
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.documentsPerDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#10B981"
                strokeWidth={2}
                name="Documents"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Calculator Usage
          </h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={data.calculatorsPerDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#F59E0B"
                strokeWidth={2}
                name="Calculators"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Document Types
          </h2>
          {data.documentTypes.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.documentTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.documentTypes.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-500 text-center py-16">
              No document data available
            </p>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Calculator Types
          </h2>
          {data.calculatorTypes.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data.calculatorTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => entry.name}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.calculatorTypes.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-gray-500 text-center py-16">
              No calculator data available
            </p>
          )}
        </div>
      </div>

      {/* Top Agents */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Most Active Agents
        </h2>
        {data.topAgents.length > 0 ? (
          <div className="space-y-3">
            {data.topAgents.map((agent, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-sm font-medium text-gray-900">
                    {index + 1}. {agent.name}
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500">{agent.count} messages</div>
                  <div className="w-32 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{
                        width: `${data.topAgents[0] ? (agent.count / data.topAgents[0].count) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-8">
            No agent activity data available
          </p>
        )}
      </div>
    </div>
  );
}
