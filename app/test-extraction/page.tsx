'use client';

import { useState } from 'react';

export default function TestExtractionPage() {
  const [pdfUrl, setPdfUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await fetch('/api/test-pdf-extract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pdfUrl }),
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

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Test PDF Extraction</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block mb-2">PDF URL:</label>
            <input
              type="text"
              value={pdfUrl}
              onChange={(e) => setPdfUrl(e.target.value)}
              className="border p-2 w-full"
              placeholder="https://example.com/document.pdf"
              required
            />
          </div>
          <button 
            type="submit" 
            className="bg-blue-500 text-white px-4 py-2 rounded"
            disabled={loading || !pdfUrl}
          >
            {loading ? 'Extracting...' : 'Extract Text'}
          </button>
        </form>
      </div>
      
      {error && (
        <div className="text-red-500 mb-4 p-4 bg-red-50 rounded">
          Error: {error}
        </div>
      )}
      
      {result && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Extraction Result</h2>
          <div className="bg-gray-100 p-4 rounded">
            <p className="mb-2"><strong>Success:</strong> {result.success ? 'Yes' : 'No'}</p>
            <p className="mb-2"><strong>Word Count:</strong> {result.wordCount}</p>
            <p className="mb-2"><strong>Text Length:</strong> {result.textLength} characters</p>
            <div>
              <p className="font-medium mb-2">Text Preview:</p>
              <div className="bg-white p-3 border rounded max-h-96 overflow-y-auto whitespace-pre-wrap">
                {result.textPreview}
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-2">Contract URLs</h2>
        <p className="mb-2">Here are the URLs from the Neon database screenshot:</p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <button 
              onClick={() => setPdfUrl('https://of5hqzjkqvxkwr9h.public.blob.vercel-storage.com/1741986503411-NDA%20Template%20%282025%20RC%29%20-%20Signed.docx-eGMziiDUHf9sxHp22cpBE3ALJMvbv1.pdf')}
              className="text-blue-500 underline"
            >
              NDA Template (2025 RC) - Signed.docx.pdf
            </button>
          </li>
          <li>
            <button 
              onClick={() => setPdfUrl('https://of5hqzjkqvxkwr9h.public.blob.vercel-storage.com/1741986970677-next-steps-%E2%80%93-real-chemistry-halliard-5Inkjpe3kqLDg4OU6RNaUPrQhbyNu6.pdf')}
              className="text-blue-500 underline"
            >
              next-steps–real-chemistry-halliard.pdf
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
} 