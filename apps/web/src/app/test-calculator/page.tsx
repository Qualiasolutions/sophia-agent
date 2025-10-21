'use client';

// VAT Calculator Test Page
import { useState } from 'react';

export default function TestCalculatorPage() {
  const [buildableArea, setBuildableArea] = useState('150');
  const [price, setPrice] = useState('300000');
  const [planningDate, setPlanningDate] = useState('15/01/2024');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const calculateVAT = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/admin/calculators/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          calculator_name: 'vat_calculator',
          inputs: {
            buildable_area: parseFloat(buildableArea),
            price: parseFloat(price),
            planning_application_date: planningDate,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">VAT Calculator Test</h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test VAT Calculation</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buildable Area (m²)
              </label>
              <input
                type="number"
                value={buildableArea}
                onChange={(e) => setBuildableArea(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 150"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (€)
              </label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 300000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Planning Application Date (DD/MM/YYYY)
              </label>
              <input
                type="text"
                value={planningDate}
                onChange={(e) => setPlanningDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 15/01/2024"
              />
            </div>
          </div>

          <button
            onClick={calculateVAT}
            disabled={loading}
            className="w-full md:w-auto px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Calculating...' : 'Calculate VAT'}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-medium mb-2">Error</h3>
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {result && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="text-green-800 font-medium mb-4">Calculation Result</h3>

            <div className="space-y-4">
              <div>
                <span className="font-medium">Success:</span> {result.success ? 'Yes' : 'No'}
              </div>

              <div>
                <span className="font-medium">Calculator:</span> {result.calculator_name}
              </div>

              {result.result?.summary && (
                <div>
                  <span className="font-medium">VAT Amount:</span> {result.result.summary}
                </div>
              )}

              {result.result?.details && (
                <div>
                  <span className="font-medium">Details:</span>
                  <ul className="mt-2 ml-6 list-disc list-inside space-y-1">
                    <li>Policy: {result.result.details.is_new_policy ? 'New (from Nov 1, 2023)' : 'Old (before Nov 1, 2023)'}</li>
                    <li>Buildable Area: {result.result.details.buildable_area}m²</li>
                    <li>Price: €{result.result.details.price.toLocaleString()}</li>
                    <li>Date: {result.result.details.planning_application_date}</li>
                    <li>Total VAT: €{result.result.details.total_vat.toLocaleString()}</li>
                  </ul>
                </div>
              )}

              {result.result?.formatted_output && (
                <div>
                  <span className="font-medium">Formatted Output:</span>
                  <pre className="mt-2 p-4 bg-gray-100 rounded-md text-sm whitespace-pre-wrap">
                    {result.result.formatted_output}
                  </pre>
                </div>
              )}

              {result.error && (
                <div>
                  <span className="font-medium">Error Details:</span>
                  <ul className="mt-2 ml-6 list-disc list-inside">
                    <li>Code: {result.error.code}</li>
                    <li>Message: {result.error.message}</li>
                  </ul>
                </div>
              )}

              <div>
                <span className="font-medium">Execution Time:</span> {result.execution_time_ms}ms
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-blue-800 font-medium mb-4">Test Cases</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => {
                setBuildableArea('150');
                setPrice('300000');
                setPlanningDate('15/01/2024');
              }}
              className="text-left p-3 bg-white rounded border border-gray-200 hover:bg-gray-50"
            >
              <strong>Test 1: New Policy</strong><br />
              Property under €350k (5% rate)
            </button>

            <button
              onClick={() => {
                setBuildableArea('200');
                setPrice('500000');
                setPlanningDate('01/12/2023');
              }}
              className="text-left p-3 bg-white rounded border border-gray-200 hover:bg-gray-50"
            >
              <strong>Test 2: New Policy</strong><br />
              Property over €350k (19% rate)
            </button>

            <button
              onClick={() => {
                setBuildableArea('150');
                setPrice('400000');
                setPlanningDate('15/10/2023');
              }}
              className="text-left p-3 bg-white rounded border border-gray-200 hover:bg-gray-50"
            >
              <strong>Test 3: Old Policy</strong><br />
              Property under 200m² (5% rate)
            </button>

            <button
              onClick={() => {
                setBuildableArea('300');
                setPrice('600000');
                setPlanningDate('15/06/2023');
              }}
              className="text-left p-3 bg-white rounded border border-gray-200 hover:bg-gray-50"
            >
              <strong>Test 4: Old Policy</strong><br />
              Mixed rate calculation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}