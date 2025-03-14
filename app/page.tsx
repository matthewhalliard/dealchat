'use client';

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import Link from 'next/link';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import * as pdfJsDist from 'pdfjs-dist';

// Set worker source - we'll only use this for local file previews
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;
pdfJsDist.GlobalWorkerOptions.workerSrc = '/pdf-worker/pdf.worker.min.mjs';

interface Contract {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: string;
  filename: string;
  wordCount?: number;
}

// Add more specific types for PDF.js text content
interface TextItem {
  str: string;
  dir: string;
  transform: number[];
  width: number;
  height: number;
  hasEOL: boolean;
}

// Define a generic marked content item interface
interface TextMarkedContent {
  type: string;
  items: unknown[];
}

interface TextContent {
  items: (TextItem | TextMarkedContent)[];
  styles: Record<string, unknown>;
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoadingContracts, setIsLoadingContracts] = useState(true);
  const [contractsError, setContractsError] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Fetch contracts when the component mounts
  useEffect(() => {
    fetchContracts();
  }, []);

  // Fetch the list of contracts from the API
  const fetchContracts = async () => {
    try {
      setIsLoadingContracts(true);
      const response = await fetch('/api/contracts');
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Get contracts and calculate word counts
        const contractsWithWordCounts = await Promise.all(
          data.contracts.map(async (contract: Contract) => {
            const wordCount = await calculateWordCount(contract.url);
            return { ...contract, wordCount };
          })
        );
        setContracts(contractsWithWordCounts);
      } else {
        throw new Error(data.error || 'Failed to fetch contracts');
      }
    } catch (err) {
      setContractsError(err instanceof Error ? err.message : 'An unknown error occurred');
      console.error('Error fetching contracts:', err);
    } finally {
      setIsLoadingContracts(false);
    }
  };

  const calculateWordCount = async (pdfUrl: string): Promise<number> => {
    try {
      const pdf = await pdfJsDist.getDocument(pdfUrl).promise;
      let text = '';
      
      // Extract text from all pages
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent() as TextContent;
        const pageText = textContent.items
          .filter((item): item is TextItem => 'str' in item)
          .map(item => item.str)
          .join(' ');
        text += pageText + ' ';
      }
      
      // Count words (split by whitespace and filter out empty strings)
      return text.split(/\s+/).filter(word => word.length > 0).length;
    } catch (err) {
      console.error('Error calculating word count:', err);
      return 0;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    
    try {
      // Create a FormData object and append the file
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      // Send the file to our API route
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        alert('PDF uploaded successfully!');
        
        // Refresh the contracts list
        setSelectedFile(null);
        fetchContracts();
      } else {
        throw new Error(result.error || 'Upload failed');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(`Error uploading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Function to format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">DealChat</h1>
          <nav>
            <Link href="/contracts" className="text-white hover:text-blue-200 transition">
              View Contracts
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row p-6 gap-6">
        {/* Left Panel (Combined Upload and Contracts) */}
        <div className="md:w-1/3">
          <div className="bg-white rounded-lg shadow-lg p-4 h-full flex flex-col">
            {/* Upload Section */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-4">Upload a PDF Document</h2>
              
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center mb-4">
                {selectedFile ? (
                  <div className="mb-2">
                    <p className="text-sm font-medium text-gray-700">Selected file:</p>
                    <p className="text-sm text-gray-500">{selectedFile.name}</p>
                  </div>
                ) : (
                  <p className="text-gray-500 mb-2">Drag & drop your PDF here or click to browse</p>
                )}
                
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  id="pdf-upload"
                />
                
                <label 
                  htmlFor="pdf-upload" 
                  className="inline-block bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-lg cursor-pointer transition duration-300 ease-in-out"
                >
                  Browse Files
                </label>
              </div>
              
              {selectedFile && (
                <button
                  onClick={handleUpload}
                  disabled={isUploading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? 'Uploading...' : 'Upload PDF'}
                </button>
              )}
            </div>

            {/* Contracts List */}
            <div className="flex-1 flex flex-col">
              <h2 className="text-xl font-semibold mb-4">Your Contracts</h2>
              
              {isLoadingContracts ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-gray-500">Loading contracts...</p>
                </div>
              ) : contractsError ? (
                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                  <p>Error loading contracts: {contractsError}</p>
                </div>
              ) : contracts.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <p className="text-gray-500">No contracts uploaded yet.</p>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-auto border border-gray-200 rounded-lg">
                  <div className="divide-y divide-gray-200">
                    {contracts.map((contract, index) => (
                      <div 
                        key={index} 
                        className={`p-3 hover:bg-gray-50 transition ${contract === selectedContract ? 'bg-blue-50' : ''}`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm truncate">{contract.filename}</p>
                            <p className="text-xs text-gray-500 mt-1">{formatDate(contract.uploadedAt)}</p>
                            <div className="flex gap-2 mt-1 text-xs text-gray-500">
                              <span>{formatFileSize(contract.size)}</span>
                              <span>•</span>
                              <span>{contract.wordCount?.toLocaleString() || '0'} words</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <a 
                              href={contract.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-2 rounded transition-colors"
                            >
                              View
                            </a>
                            <button 
                              onClick={() => {
                                setSelectedContract(contract);
                                setIsAnalyzing(false);
                              }}
                              className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 py-1 px-2 rounded transition-colors"
                            >
                              Analyze
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Analysis Section */}
        <div className="md:w-2/3 bg-white rounded-lg shadow-lg p-4 min-h-[600px] flex flex-col">
          <h2 className="text-xl font-semibold text-center mb-4">Analysis</h2>
          
          {selectedContract ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-md">
                <h3 className="text-lg font-medium mb-2">{selectedContract.filename}</h3>
                <p className="text-gray-500 mb-4">
                  {selectedContract.wordCount?.toLocaleString() || '0'} words • {formatFileSize(selectedContract.size)} • Uploaded on {formatDate(selectedContract.uploadedAt)}
                </p>
                
                {!isAnalyzing ? (
                  <button
                    onClick={() => setIsAnalyzing(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition"
                  >
                    Analyze this contract
                  </button>
                ) : (
                  <div className="text-left border p-4 rounded-lg bg-gray-50">
                    <p className="text-gray-600">
                      Analysis functionality will be implemented in the next step.
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-gray-500">
                Select a contract to analyze
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
