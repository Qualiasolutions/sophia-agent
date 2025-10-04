/**
 * Admin Create Agent Page
 * Epic 6, Story 6.7: Agent Management
 *
 * Page for creating new agents
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import AgentForm from '@/components/admin/AgentForm';

export default function NewAgentPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: Partial<{ name: string; email: string; phone_number: string }>) => {
    setError(null);

    try {
      const response = await fetch('/api/admin/agents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create agent');
      }

      // Redirect to agents list
      router.push('/admin/agents');
    } catch (err) {
      setError((err as Error).message);
      throw err; // Re-throw to let form know submission failed
    }
  };

  const handleCancel = () => {
    router.push('/admin/agents');
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Create Agent</h1>
        <p className="mt-1 text-sm text-gray-500">
          <Link href="/admin/agents" className="text-blue-600 hover:underline">
            Agents
          </Link>
          {' / '}
          New Agent
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
        <AgentForm onSubmit={handleSubmit} onCancel={handleCancel} />
      </div>
    </div>
  );
}
