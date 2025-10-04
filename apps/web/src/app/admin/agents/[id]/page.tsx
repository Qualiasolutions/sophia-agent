/**
 * Admin Agent Detail Page
 * Epic 6, Story 6.7: Agent Management
 *
 * Displays agent details, statistics, and recent activity
 */

'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Agent {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  is_active: boolean;
  created_at: string;
}

interface Stats {
  messages: number;
  documents: number;
  calculators: number;
  lastActive: string | null;
}

interface Activity {
  id: string;
  type: 'message' | 'document';
  description: string;
  timestamp: string;
}

export default function AgentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  useEffect(() => {
    const fetchAgentDetails = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/admin/agents/${id}`);

        if (!response.ok) {
          throw new Error('Failed to fetch agent details');
        }

        const data = await response.json();
        setAgent(data.agent);
        setStats(data.stats);
        setActivities(data.recentActivity);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchAgentDetails();
  }, [id]);

  const handleDeactivate = async () => {
    setDeactivating(true);

    try {
      const response = await fetch(`/api/admin/agents/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to deactivate agent');
      }

      // Redirect to agents list
      router.push('/admin/agents');
    } catch (err) {
      alert((err as Error).message);
    } finally {
      setDeactivating(false);
      setShowDeactivateDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 bg-gray-200 rounded w-1/4"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !agent) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <p className="text-red-800">{error || 'Agent not found'}</p>
        <Link
          href="/admin/agents"
          className="mt-2 inline-block text-red-600 hover:text-red-800 underline"
        >
          Back to Agents
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900">
            {agent.name}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            <Link href="/admin/agents" className="text-blue-600 hover:underline">
              Agents
            </Link>
            {' / '}
            {agent.name}
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/agents/${id}/edit`}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Edit
          </Link>
          {agent.is_active && (
            <button
              onClick={() => setShowDeactivateDialog(true)}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Deactivate
            </button>
          )}
        </div>
      </div>

      {/* Agent Details */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Agent Information
        </h2>
        <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <dt className="text-sm font-medium text-gray-500">Email</dt>
            <dd className="mt-1 text-sm text-gray-900">{agent.email}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Phone</dt>
            <dd className="mt-1 text-sm text-gray-900">{agent.phone_number}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Status</dt>
            <dd className="mt-1">
              <span
                className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  agent.is_active
                    ? 'bg-green-100 text-green-800'
                    : 'bg-gray-100 text-gray-800'
                }`}
              >
                {agent.is_active ? 'Active' : 'Inactive'}
              </span>
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Registered</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {new Date(agent.created_at).toLocaleDateString()}
            </dd>
          </div>
        </dl>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Usage Statistics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm font-medium text-gray-500">Messages</div>
              <div className="mt-2 text-3xl font-semibold text-gray-900">
                {stats.messages}
              </div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm font-medium text-gray-500">Documents</div>
              <div className="mt-2 text-3xl font-semibold text-gray-900">
                {stats.documents}
              </div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm font-medium text-gray-500">Calculators</div>
              <div className="mt-2 text-3xl font-semibold text-gray-900">
                {stats.calculators}
              </div>
            </div>
            <div className="bg-white shadow rounded-lg p-6">
              <div className="text-sm font-medium text-gray-500">Last Active</div>
              <div className="mt-2 text-sm text-gray-900">
                {stats.lastActive
                  ? new Date(stats.lastActive).toLocaleDateString()
                  : 'Never'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div>
        <h2 className="text-lg font-medium text-gray-900 mb-4">
          Recent Activity
        </h2>
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {activities.length === 0 ? (
            <p className="p-6 text-sm text-gray-500 text-center">
              No recent activity
            </p>
          ) : (
            <ul className="divide-y divide-gray-200">
              {activities.map((activity) => (
                <li key={activity.id} className="p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start space-x-3">
                      <div
                        className={`flex-shrink-0 w-2 h-2 mt-2 rounded-full ${
                          activity.type === 'message'
                            ? 'bg-blue-500'
                            : 'bg-green-500'
                        }`}
                      ></div>
                      <div>
                        <p className="text-sm text-gray-900">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Deactivate Confirmation Dialog */}
      {showDeactivateDialog && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Deactivate Agent
            </h3>
            <p className="text-sm text-gray-700 mb-6">
              Are you sure you want to deactivate this agent? They will no longer be
              able to access Sophia via WhatsApp or Telegram.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeactivateDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={deactivating}
              >
                Cancel
              </button>
              <button
                onClick={handleDeactivate}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                disabled={deactivating}
              >
                {deactivating ? 'Deactivating...' : 'Deactivate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
