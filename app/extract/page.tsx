'use client';

import { useState } from 'react';

export default function ExtractTextPage() {
  const [contractId, setContractId] = useState(1); // Default to ID 1
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/extract-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ contractId }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to extract text');
      }
      
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Extract PDF Text</h1>
      
      <form onSubmit={handleExtract} className="mb-4">
        <div className="mb-4">
          <label className="block mb-2">Contract ID:</label>
          <input
            type="number"
            value={contractId}
            onChange={(e) => setContractId(parseInt(e.target.value))}
            className="border p-2 w-full max-w-md"
            min="1"
          />
        </div>
        <button 
          type="submit" 
          className="bg-blue-500 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? 'Extracting...' : 'Extract Text'}
        </button>
      </form>
      
      {error && (
        <div className="text-red-500 mb-4">
          Error: {error}
        </div>
      )}
      
      {result && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Result</h2>
          <div className="bg-gray-100 p-4 rounded">
            <p><strong>Success:</strong> {result.success ? 'Yes' : 'No'}</p>
            <p><strong>Word Count:</strong> {result.wordCount}</p>
            <p><strong>Text Preview:</strong></p>
            <div className="mt-2 p-2 bg-white border rounded">
              {result.textPreview || '(No text extracted)'}
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Check Database</h2>
        <p>
          After extraction, you can check the database to see the full text by visiting:
          <a href="/api/db-check" target="_blank" className="text-blue-500 ml-2 underline">
            /api/db-check
          </a>
        </p>
      </div>
    </div>
  );
} 