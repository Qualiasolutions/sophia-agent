/**
 * Admin Analytics Page
 * Epic 6, Story 6.8: Analytics & Reporting
 *
 * Displays analytics charts and metrics
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import html2canvas from 'html2canvas';
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

// Export utility functions
const exportChartAsPNG = async (elementId: string, filename: string) => {
  const element = document.getElementById(elementId);
  if (!element) return;

  try {
    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale: 2, // Higher quality
    });
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = dataURL;
    link.click();
  } catch (error) {
    console.error('Failed to export chart:', error);
    alert('Failed to export chart. Please try again.');
  }
};

const exportDataAsCSV = (data: Record<string, string | number>[], filename: string) => {
  if (!data || data.length === 0) {
    alert('No data available to export');
    return;
  }

  try {
    const firstRow = data[0];
    if (!firstRow) {
      alert('No data available to export');
      return;
    }

    const headers = Object.keys(firstRow).join(',');
    const rows = data.map(row =>
      Object.values(row)
        .map(value => {
          // Escape commas and quotes in CSV
          const stringValue = String(value);
          if (stringValue.includes(',') || stringValue.includes('"')) {
            return `"${stringValue.replace(/"/g, '""')}"`;
          }
          return stringValue;
        })
        .join(',')
    );
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = `${filename}.csv`;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export CSV:', error);
    alert('Failed to export CSV. Please try again.');
  }
};

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState('30'); // days

  const exportAll = useCallback(() => {
    if (!data) return;

    // Export all data as CSV files
    exportDataAsCSV(data.messagesPerDay, 'messages-per-day');
    exportDataAsCSV(data.documentsPerDay, 'documents-per-day');
    exportDataAsCSV(data.calculatorsPerDay, 'calculators-per-day');
    exportDataAsCSV(data.documentTypes, 'document-types');
    exportDataAsCSV(data.calculatorTypes, 'calculator-types');
    exportDataAsCSV(data.topAgents, 'top-agents');

    alert('All data exported successfully!');
  }, [data]);

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
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">Analytics</h1>
          <p className="mt-2 text-sm text-gray-700">
            Track usage patterns and performance metrics
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Export All Button */}
          <button
            onClick={exportAll}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 text-sm font-medium"
          >
            📥 Export All
          </button>

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
      <div className="bg-white shadow rounded-lg p-6 mb-6" id="messages-chart">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Messages Over Time</h2>
          <div className="flex gap-2">
            <button
              onClick={() => exportChartAsPNG('messages-chart', 'messages-over-time')}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              📊 PNG
            </button>
            <button
              onClick={() => exportDataAsCSV(data.messagesPerDay, 'messages-over-time')}
              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              📄 CSV
            </button>
          </div>
        </div>
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
        <div className="bg-white shadow rounded-lg p-6" id="documents-chart">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Documents Generated
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => exportChartAsPNG('documents-chart', 'documents-generated')}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                📊 PNG
              </button>
              <button
                onClick={() => exportDataAsCSV(data.documentsPerDay, 'documents-generated')}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                📄 CSV
              </button>
            </div>
          </div>
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

        <div className="bg-white shadow rounded-lg p-6" id="calculators-chart">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Calculator Usage
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => exportChartAsPNG('calculators-chart', 'calculator-usage')}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                📊 PNG
              </button>
              <button
                onClick={() => exportDataAsCSV(data.calculatorsPerDay, 'calculator-usage')}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                📄 CSV
              </button>
            </div>
          </div>
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
        <div className="bg-white shadow rounded-lg p-6" id="document-types-chart">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Document Types
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => exportChartAsPNG('document-types-chart', 'document-types')}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                📊 PNG
              </button>
              <button
                onClick={() => exportDataAsCSV(data.documentTypes, 'document-types')}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                📄 CSV
              </button>
            </div>
          </div>
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

        <div className="bg-white shadow rounded-lg p-6" id="calculator-types-chart">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">
              Calculator Types
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => exportChartAsPNG('calculator-types-chart', 'calculator-types')}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
              >
                📊 PNG
              </button>
              <button
                onClick={() => exportDataAsCSV(data.calculatorTypes, 'calculator-types')}
                className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
              >
                📄 CSV
              </button>
            </div>
          </div>
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
      <div className="bg-white shadow rounded-lg p-6" id="top-agents-chart">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            Most Active Agents
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => exportChartAsPNG('top-agents-chart', 'top-agents')}
              className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
            >
              📊 PNG
            </button>
            <button
              onClick={() => exportDataAsCSV(data.topAgents, 'top-agents')}
              className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
            >
              📄 CSV
            </button>
          </div>
        </div>
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
