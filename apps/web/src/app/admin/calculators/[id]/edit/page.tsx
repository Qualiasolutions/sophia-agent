'use client';

// Story 6.9: Calculator Edit Page
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import JsonEditor from '@/components/admin/JsonEditor';

export default function CalculatorEditPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tool_url: '',
    input_fields: '{}',
    is_active: true,
  });

  const fetchCalculator = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/calculators/${id}`);
      if (!response.ok) throw new Error('Failed to fetch calculator');

      const data = await response.json();
      setFormData({
        name: data.calculator.name,
        description: data.calculator.description,
        tool_url: data.calculator.tool_url || '',
        input_fields: JSON.stringify(data.calculator.input_fields, null, 2),
        is_active: data.calculator.is_active,
      });
    } catch (error) {
      console.error('Error fetching calculator:', error);
      setMessage({ type: 'error', text: 'Failed to load calculator' });
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCalculator();
  }, [fetchCalculator]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // Parse input_fields JSON
      let parsedInputFields;
      try {
        parsedInputFields = JSON.parse(formData.input_fields);
      } catch {
        throw new Error('Invalid JSON in input fields');
      }

      const response = await fetch(`/api/admin/calculators/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          tool_url: formData.tool_url,
          input_fields: parsedInputFields,
          is_active: formData.is_active,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update calculator');
      }

      setMessage({ type: 'success', text: 'Calculator updated successfully' });
      setTimeout(() => router.push('/admin/calculators'), 1500);
    } catch (error) {
      console.error('Error updating calculator:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <button
          onClick={() => router.push('/admin/calculators')}
          className="text-blue-600 hover:text-blue-800 mb-4 inline-flex items-center"
        >
          ← Back to Calculators
        </button>
        <h1 className="text-3xl font-bold">Edit Calculator</h1>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="bg-white p-6 rounded-lg shadow border border-gray-200 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) =>
              setFormData({ ...formData, name: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reference URL
          </label>
          <input
            type="url"
            value={formData.tool_url}
            onChange={(e) =>
              setFormData({ ...formData, tool_url: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Input Fields Configuration (JSON)
          </label>
          <JsonEditor
            value={formData.input_fields}
            onChange={(value) =>
              setFormData({ ...formData, input_fields: value })
            }
            height="400px"
          />
          <p className="mt-2 text-sm text-gray-500">
            Note: Calculator formulas are defined in code and cannot be edited
            here. This configuration only affects input field definitions.
          </p>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            checked={formData.is_active}
            onChange={(e) =>
              setFormData({ ...formData, is_active: e.target.checked })
            }
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
            Active (enable this calculator for agents)
          </label>
        </div>

        <div className="flex gap-4 pt-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            onClick={() => router.push('/admin/calculators')}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
