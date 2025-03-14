'use client';

import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

export default function ExtractBrowserPage() {
  const [contractId, setContractId] = useState(1);
  const [pdfUrl, setPdfUrl] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Set up worker when component mounts
  useEffect(() => {
    // Set the worker URL to use the CDN version
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
  }, []);

  // Fetch the contract information
  const fetchContractInfo = async () => {
    try {
      const response = await fetch('/api/db-check');
      const data = await response.json();
      
      const contract = data.contracts.find((c: any) => c.id === contractId);
      if (contract) {
        setPdfUrl(contract.blob_url);
      } else {
        setError(`Contract with ID ${contractId} not found`);
      }
    } catch (err) {
      setError('Error fetching contract information');
      console.error(err);
    }
  };

  // Extract text from PDF
  const extractText = async () => {
    if (!pdfUrl) {
      setError('No PDF URL available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument(pdfUrl);
      const pdf = await loadingTask.promise;
      
      let fullText = '';
      
      // Process each page
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        
        const pageText = textContent.items
          .filter((item: any) => 'str' in item)
          .map((item: any) => item.str)
          .join(' ');
          
        fullText += pageText + ' ';
      }
      
      // Count words
      const words = fullText.split(/\s+/).filter(word => word.length > 0);
      setWordCount(words.length);
      setExtractedText(fullText);
      
      // Save to database
      await saveToDatabase(fullText, words.length);
      
    } catch (err) {
      console.error('Error calculating word count:', err);
      setError('Failed to extract text: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  // Save the extracted text to the database
  const saveToDatabase = async (text: string, wordCount: number) => {
    try {
      const response = await fetch('/api/update-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId,
          text,
          wordCount
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to save text to database');
      }
    } catch (err) {
      console.error('Error saving to database:', err);
      // We don't set an error here since we want to display the extracted text even if saving fails
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Browser-based PDF Text Extraction</h1>
      
      <div className="mb-6">
        <label className="block mb-2">Contract ID:</label>
        <div className="flex items-center">
          <input
            type="number"
            value={contractId}
            onChange={(e) => setContractId(parseInt(e.target.value))}
            className="border p-2 w-20 mr-2"
            min="1"
          />
          <button 
            onClick={fetchContractInfo}
            className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
          >
            Fetch Contract
          </button>
          <button 
            onClick={extractText}
            className="bg-blue-500 text-white px-4 py-2 rounded"
            disabled={loading || !pdfUrl}
          >
            {loading ? 'Extracting...' : 'Extract Text'}
          </button>
        </div>
      </div>
      
      {pdfUrl && (
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Contract PDF</h2>
          <p className="truncate mb-2">URL: <a href={pdfUrl} target="_blank" className="text-blue-500">{pdfUrl}</a></p>
          <iframe 
            src={pdfUrl} 
            className="w-full h-96 border"
            title="PDF Preview"
          />
        </div>
      )}
      
      {error && (
        <div className="text-red-500 mb-4">
          Error: {error}
        </div>
      )}
      
      {extractedText && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Extracted Text</h2>
          <p className="mb-2"><strong>Word count:</strong> {wordCount}</p>
          <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto">
            {extractedText}
          </div>
        </div>
      )}
    </div>
  );
} 