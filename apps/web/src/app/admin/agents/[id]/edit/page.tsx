/**
 * Admin Edit Agent Page
 * Epic 6, Story 6.7: Agent Management
 *
 * Page for editing existing agents
 */

'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AgentForm from '@/components/admin/AgentForm';

interface Agent {
  id: string;
  name: string;
  email: string;
  phone_number: string;
  is_active: boolean;
  created_at: string;
}

export default function EditAgentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAgent = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/admin/agents/${id}`);

        if (!response.ok) {
          throw new Error('Failed to fetch agent');
        }

        const data = await response.json();
        setAgent(data.agent);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchAgent();
  }, [id]);

  const handleSubmit = async (data: Partial<Agent>) => {
    setError(null);

    try {
      const response = await fetch(`/api/admin/agents/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to update agent');
      }

      // Redirect to agent detail page
      router.push(`/admin/agents/${id}`);
    } catch (err) {
      setError((err as Error).message);
      throw err; // Re-throw to let form know submission failed
    }
  };

  const handleCancel = () => {
    router.push(`/admin/agents/${id}`);
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-10 bg-gray-200 rounded w-1/4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
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
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Edit Agent</h1>
        <p className="mt-1 text-sm text-gray-500">
          <Link href="/admin/agents" className="text-blue-600 hover:underline">
            Agents
          </Link>
          {' / '}
          <Link href={`/admin/agents/${id}`} className="text-blue-600 hover:underline">
            {agent.name}
          </Link>
          {' / '}
          Edit
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <AgentForm agent={agent} onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  );
}
