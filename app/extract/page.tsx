'use client';

import { useState } from 'react';

export default function ExtractTextPage() {
  const [contractId, setContractId] = useState(1); // Default to ID 1
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [expanded, setExpanded] = useState(false);

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    
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
      setError((err as Error).message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const processAllContracts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/process-existing');
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error('Failed to process contracts');
      }
      
      setResult({
        processResults: data,
        success: true,
        message: `Processed ${data.length} contracts`
      });
    } catch (err) {
      setError((err as Error).message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Extract PDF Text</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Individual contract extraction */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Extract Single Contract</h2>
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
        </div>
        
        {/* Process all contracts */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Process All Contracts</h2>
          <p className="mb-4">
            This will extract text from all PDFs in the database that haven&apos;t been processed yet or have only placeholder text.
          </p>
          <button 
            onClick={processAllContracts}
            className="bg-green-500 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Process All Contracts'}
          </button>
        </div>
      </div>
      
      {error && (
        <div className="text-red-500 mb-4 p-4 bg-red-50 rounded">
          Error: {error}
        </div>
      )}
      
      {result && result.processResults ? (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Batch Processing Results</h2>
          <div className="bg-gray-100 p-4 rounded">
            <p className="mb-2"><strong>Status:</strong> {result.success ? 'Completed' : 'Failed'}</p>
            <p className="mb-2"><strong>Message:</strong> {result.message}</p>
            
            <div className="mt-4">
              <h3 className="text-lg font-medium mb-2">Processed Contracts:</h3>
              <div className="space-y-4">
                {result.processResults.map((item: any, index: number) => (
                  <div key={index} className={`p-3 rounded ${item.success ? 'bg-green-50' : 'bg-red-50'}`}>
                    <p><strong>ID:</strong> {item.id}</p>
                    <p><strong>Filename:</strong> {item.filename}</p>
                    {item.success ? (
                      <>
                        <p><strong>Word Count:</strong> {item.wordCount}</p>
                        {item.textPreview && (
                          <div className="mt-2">
                            <p><strong>Text Preview:</strong></p>
                            <div className="bg-white p-2 rounded text-sm mt-1 max-h-24 overflow-y-auto">
                              {item.textPreview}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <p className="text-red-500"><strong>Error:</strong> {item.error}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : result && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Extraction Result</h2>
          <div className="bg-gray-100 p-4 rounded">
            <p className="mb-2"><strong>Success:</strong> {result.success ? 'Yes' : 'No'}</p>
            <p className="mb-2"><strong>Word Count:</strong> {result.wordCount}</p>
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="font-medium">Text Preview:</p>
                <button 
                  onClick={() => setExpanded(!expanded)} 
                  className="text-blue-500 text-sm underline"
                >
                  {expanded ? 'Show Less' : 'Show More'}
                </button>
              </div>
              <div className={`bg-white p-3 border rounded ${expanded ? 'max-h-96' : 'max-h-32'} overflow-y-auto transition-all duration-300`}>
                {expanded 
                  ? result.textPreview.split('\n').map((line: string, i: number) => (
                      <p key={i} className="mb-1">{line}</p>
                    ))
                  : result.textPreview.substring(0, 300) + (result.textPreview.length > 300 ? '...' : '')
                }
              </div>
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