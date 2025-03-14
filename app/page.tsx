'use client';

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import Link from 'next/link';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';
import PdfPreview from './components/PdfPreview';

// Set worker source - we'll only use this for local file previews
pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface Contract {
  url: string;
  pathname: string;
  size: number;
  uploadedAt: string;
  filename: string;
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [storedPdfUrl, setStoredPdfUrl] = useState<string | null>(null);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoadingContracts, setIsLoadingContracts] = useState(true);
  const [contractsError, setContractsError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upload' | 'select'>('upload');
  const [isRemotePdf, setIsRemotePdf] = useState(false);

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
        setContracts(data.contracts);
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

  useEffect(() => {
    // Cleanup the object URL when component unmounts or when a new file is selected
    return () => {
      if (pdfUrl && !pdfUrl.startsWith('http')) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  // Check if the PDF is remote (from Blob storage) or local
  useEffect(() => {
    if (pdfUrl) {
      setIsRemotePdf(pdfUrl.startsWith('http'));
    } else {
      setIsRemotePdf(false);
    }
  }, [pdfUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);
      
      // Create a URL for the file
      if (pdfUrl && !pdfUrl.startsWith('http')) {
        URL.revokeObjectURL(pdfUrl);
      }
      
      const objectUrl = URL.createObjectURL(file);
      setPdfUrl(objectUrl);
      setPageNumber(1);
      setStoredPdfUrl(null); // Reset stored URL when a new file is selected
      setIsRemotePdf(false);
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
        // Store the permanent URL from Vercel Blob
        setStoredPdfUrl(result.url);
        
        // Set the PDF URL to the stored URL for preview
        setPdfUrl(result.url);
        setIsRemotePdf(true);
        
        alert('PDF uploaded successfully!');
        
        // Refresh the contracts list
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

  const selectContract = (contract: Contract) => {
    setSelectedFile(null);
    setPdfUrl(contract.url);
    setStoredPdfUrl(contract.url);
    setPageNumber(1);
    setIsRemotePdf(true);
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const changePage = (offset: number) => {
    if (!numPages) return;
    setPageNumber(prevPageNumber => {
      const newPageNumber = prevPageNumber + offset;
      return Math.max(1, Math.min(numPages, newPageNumber));
    });
  };

  const previousPage = () => changePage(-1);
  const nextPage = () => changePage(1);

  // Function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Render the PDF preview based on whether it's a remote or local file
  const renderPdfPreview = () => {
    if (!pdfUrl) {
      return (
        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500">
            {activeTab === 'upload' 
              ? 'Upload a PDF to see preview' 
              : 'Select a contract to see preview'}
          </p>
        </div>
      );
    }

    if (isRemotePdf) {
      // Use our new PdfPreview component for remote PDFs
      return (
        <div className="flex-1">
          <PdfPreview pdfUrl={pdfUrl} />
        </div>
      );
    } else {
      // Use react-pdf for local file previews (before upload)
      return (
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-auto border border-gray-200 rounded-lg">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              className="flex justify-center"
              error={<p className="text-center text-red-500 my-4">Failed to load PDF. Please try again.</p>}
              loading={<p className="text-center my-4">Loading PDF...</p>}
              options={{
                cMapUrl: 'https://unpkg.com/pdfjs-dist@latest/cmaps/',
                cMapPacked: true,
              }}
            >
              <Page 
                pageNumber={pageNumber} 
                scale={1.2}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            </Document>
          </div>
          
          {numPages && (
            <div className="flex justify-between items-center mt-4 px-4">
              <button 
                onClick={previousPage} 
                disabled={pageNumber <= 1}
                className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
              >
                Previous
              </button>
              <p className="text-sm text-gray-600">
                Page {pageNumber} of {numPages}
              </p>
              <button 
                onClick={nextPage} 
                disabled={pageNumber >= numPages}
                className="px-4 py-2 bg-gray-200 rounded-md disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </div>
      );
    }
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
        {/* Left Panel (Upload/Select) */}
        <div className="md:w-1/3">
          <div className="bg-white rounded-lg shadow-lg p-4 h-full flex flex-col">
            {/* Tabs */}
            <div className="flex border-b mb-4">
              <button
                className={`px-4 py-2 ${activeTab === 'upload' ? 'border-b-2 border-blue-500 text-blue-600 font-medium' : 'text-gray-500'}`}
                onClick={() => setActiveTab('upload')}
              >
                Upload PDF
              </button>
              <button
                className={`px-4 py-2 ${activeTab === 'select' ? 'border-b-2 border-blue-500 text-blue-600 font-medium' : 'text-gray-500'}`}
                onClick={() => setActiveTab('select')}
              >
                Select Contract
              </button>
            </div>

            {/* Upload Tab */}
            {activeTab === 'upload' && (
              <div className="flex-1 flex flex-col">
                <h2 className="text-xl font-semibold text-center mb-6">Upload a PDF Document</h2>
                
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  {selectedFile ? (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700">Selected file:</p>
                      <p className="text-sm text-gray-500">{selectedFile.name}</p>
                    </div>
                  ) : (
                    <p className="text-gray-500 mb-4">Drag & drop your PDF here or click to browse</p>
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
                  <div className="mt-6">
                    <button
                      onClick={handleUpload}
                      disabled={isUploading}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-300 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploading ? 'Uploading...' : 'Upload PDF'}
                    </button>
                  </div>
                )}
                
                {storedPdfUrl && activeTab === 'upload' && (
                  <div className="mt-4">
                    <p className="text-sm text-green-600 mb-2">PDF permanently stored!</p>
                    <a 
                      href={storedPdfUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 underline break-all"
                    >
                      {storedPdfUrl}
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Select Contract Tab */}
            {activeTab === 'select' && (
              <div className="flex-1 flex flex-col">
                <h2 className="text-xl font-semibold text-center mb-6">Select a Contract</h2>
                
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
                      <p className="text-gray-500 mb-4">No contracts uploaded yet.</p>
                      <button
                        onClick={() => setActiveTab('upload')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition duration-300 ease-in-out"
                      >
                        Upload Your First Contract
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-auto">
                    <div className="divide-y divide-gray-200">
                      {contracts.map((contract, index) => (
                        <div 
                          key={index} 
                          className={`p-3 hover:bg-gray-50 cursor-pointer transition ${contract.url === pdfUrl ? 'bg-blue-50' : ''}`}
                          onClick={() => selectContract(contract)}
                        >
                          <p className="font-medium text-sm truncate">{contract.filename}</p>
                          <p className="text-xs text-gray-500 mt-1">{formatDate(contract.uploadedAt)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* PDF Preview Section */}
        <div className="md:w-2/3 bg-white rounded-lg shadow-lg p-4 min-h-[600px] flex flex-col">
          <h2 className="text-xl font-semibold text-center mb-4">PDF Preview</h2>
          {renderPdfPreview()}
        </div>
      </main>
    </div>
  );
}
