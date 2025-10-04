'use client';

// Story 6.9: System Settings Page
import { useState, useEffect } from 'react';

interface ConfigItem {
  key: string;
  value: unknown;
  description: string;
  updated_at: string;
}

export default function SettingsPage() {
  const [configs, setConfigs] = useState<ConfigItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [editedValues, setEditedValues] = useState<Record<string, unknown>>({});

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    try {
      const response = await fetch('/api/admin/config');
      if (!response.ok) throw new Error('Failed to fetch configs');

      const data = await response.json();
      setConfigs(data.configs);

      // Initialize edited values
      const initialValues: Record<string, unknown> = {};
      data.configs.forEach((config: ConfigItem) => {
        initialValues[config.key] = config.value;
      });
      setEditedValues(initialValues);
    } catch (error) {
      console.error('Error fetching configs:', error);
      setMessage({ type: 'error', text: 'Failed to load configuration' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string) => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/admin/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: editedValues[key] }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to update config');
      }

      setMessage({ type: 'success', text: `Updated ${key} successfully` });
      fetchConfigs(); // Refresh configs
    } catch (error) {
      console.error('Error updating config:', error);
      setMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: unknown) => {
    setEditedValues({ ...editedValues, [key]: value });
  };

  const renderInput = (config: ConfigItem) => {
    const { key, value } = config;
    const editedValue = editedValues[key] ?? value;

    if (key === 'openai_model') {
      return (
        <select
          value={String(editedValue)}
          onChange={(e) => handleChange(key, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="gpt-4-turbo">GPT-4 Turbo</option>
          <option value="gpt-4o">GPT-4o</option>
          <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
        </select>
      );
    } else if (
      typeof value === 'number' ||
      key.includes('timeout') ||
      key.includes('limit') ||
      key.includes('days')
    ) {
      return (
        <input
          type="number"
          value={Number(editedValue)}
          onChange={(e) => handleChange(key, parseInt(e.target.value, 10))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      );
    } else {
      return (
        <input
          type="text"
          value={String(editedValue)}
          onChange={(e) => handleChange(key, e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          readOnly={key.includes('webhook')}
        />
      );
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">System Settings</h1>

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

      <div className="space-y-6">
        {configs.map((config) => (
          <div
            key={config.key}
            className="bg-white p-6 rounded-lg shadow border border-gray-200"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {config.key.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {config.description}
                </p>
                {renderInput(config)}
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <span className="text-xs text-gray-500">
                Last updated: {new Date(config.updated_at).toLocaleString()}
              </span>
              <button
                onClick={() => handleSave(config.key)}
                disabled={saving || editedValues[config.key] === config.value}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
