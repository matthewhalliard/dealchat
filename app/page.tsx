'use client';

import { useState, useEffect } from 'react';
import { extractTextFromPDF } from '@/utils/pdf-extractor-client';

interface Contract {
  id: number;
  url: string;
  pathname: string;
  size: number;
  uploadedAt: string;
  filename: string;
  word_count: number;
  has_text: boolean;
  blob_url: string; // Changed from url
  analyzed: boolean;
}

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoadingContracts, setIsLoadingContracts] = useState(true);
  const [contractsError, setContractsError] = useState<string | null>(null);
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [extractedText, setExtractedText] = useState<string | null>(null);
  const [extractedWordCount, setExtractedWordCount] = useState<number | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [isAnalyzingWithAI, setIsAnalyzingWithAI] = useState(false);
  const [aiAnalysisError, setAiAnalysisError] = useState<string | null>(null);

  // Fetch contracts when the component mounts
  useEffect(() => {
    fetchContracts();
  }, []);

  // Handle contractId from URL query parameters
  useEffect(() => {
    // Function to get URL query parameters
    const getQueryParams = () => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search);
        return params;
      }
      return new URLSearchParams();
    };

    const params = getQueryParams();
    const contractId = params.get('contractId');
    
    if (contractId && contracts.length > 0) {
      const contract = contracts.find(c => c.id === parseInt(contractId));
      if (contract) {
        setSelectedContract(contract);
        setIsAnalyzing(false);
        setExtractedText(null);
        setExtractedWordCount(null);
        setExtractionError(null);
        
        // Scroll to the analysis section
        setTimeout(() => {
          const analysisSection = document.getElementById('analysis-section');
          if (analysisSection) {
            analysisSection.scrollIntoView({ behavior: 'smooth' });
          }
        }, 500);
      }
    }
  }, [contracts]);

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

  // Add a new function to delete contracts
  const handleDeleteContract = async (contractId: number, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent event bubbling
    
    // Show confirmation before deleting
    if (!confirm("Are you sure you want to delete this contract? This action cannot be undone.")) {
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const response = await fetch(`/api/delete-contract?id=${contractId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`Delete failed with status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // If the deleted contract was the selected one, clear the selection
        if (selectedContract?.id === contractId) {
          setSelectedContract(null);
          setIsAnalyzing(false);
        }
        
        // Remove the contract from the local state
        setContracts(contracts.filter(contract => contract.id !== contractId));
      } else {
        throw new Error(result.error || 'Delete failed');
      }
    } catch (error) {
      console.error('Error deleting contract:', error);
      alert(`Error deleting contract: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  // Add a new function to analyze the contract
  const analyzeContract = async () => {
    if (!selectedContract) return;
    
    setIsAnalyzing(true);
    setIsExtracting(true);
    setExtractedText(null);
    setExtractedWordCount(null);
    setExtractionError(null);
    setAiAnalysis(null);
    setAiAnalysisError(null);
    
    try {
      // Extract text from the contract PDF
      const { text, wordCount } = await extractTextFromPDF(selectedContract.url);
      
      // Update state with extracted text and word count
      setExtractedText(text);
      setExtractedWordCount(wordCount);
      
      // Save the extracted text to the database
      const updateResponse = await fetch('/api/update-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId: selectedContract.id,
          text,
          wordCount
        }),
      });
      
      if (!updateResponse.ok) {
        throw new Error(`Failed to save extracted text to database: ${updateResponse.status}`);
      }
      
      // Mark the contract as analyzed
      const markAnalyzedResponse = await fetch('/api/mark-analyzed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId: selectedContract.id
        }),
      });
      
      if (!markAnalyzedResponse.ok) {
        console.warn(`Failed to mark contract as analyzed: ${markAnalyzedResponse.status}`);
      }
      
      // Now analyze the text with OpenAI
      setIsAnalyzingWithAI(true);
      const aiAnalysisResponse = await fetch('/api/analyze-contract', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contractId: selectedContract.id
        }),
      });
      
      if (!aiAnalysisResponse.ok) {
        throw new Error(`Failed to analyze contract with AI: ${aiAnalysisResponse.status}`);
      }
      
      const aiAnalysisData = await aiAnalysisResponse.json();
      if (aiAnalysisData.success) {
        setAiAnalysis(aiAnalysisData.analysis);
      } else {
        setAiAnalysisError(aiAnalysisData.error || 'Failed to analyze contract with AI');
      }
      
      // Refresh the contracts list to show updated word count and analyzed status
      await fetchContracts();
      
      console.log(`Saved ${wordCount} words to the database for contract ID ${selectedContract.id}`);
    } catch (error) {
      console.error('Error analyzing contract:', error);
      if (!extractedText) {
        setExtractionError(`Failed to extract text from PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } else {
        setAiAnalysisError(`Failed to analyze with AI: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    } finally {
      setIsExtracting(false);
      setIsAnalyzingWithAI(false);
    }
  };

  // Function to parse the AI analysis response into major and minor risks
  const parseRiskAnalysis = (analysisText: string) => {
    // Extract major risks section using multi-line compatible regex
    const majorRisksMatch = analysisText.match(/MAJOR RISKS:([^]*?)(?=MINOR RISKS:|$)/);
    const majorRisks = majorRisksMatch ? majorRisksMatch[1].trim() : 'None identified.';
    
    // Extract minor risks section using multi-line compatible regex
    const minorRisksMatch = analysisText.match(/MINOR RISKS:([^]*?)$/);
    const minorRisks = minorRisksMatch ? minorRisksMatch[1].trim() : 'None identified.';
    
    return { majorRisks, minorRisks };
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">DealChat</h1>
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
              <h2 className="text-xl font-semibold mb-4">Available Contracts</h2>
              
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
                        className={`p-3 hover:bg-gray-50 transition ${contract === selectedContract ? 'bg-blue-50' : ''} cursor-pointer`}
                        onClick={() => {
                          setSelectedContract(contract);
                          setIsAnalyzing(false);
                          setExtractedText(null);
                          setExtractedWordCount(null);
                          setExtractionError(null);
                          
                          // Scroll to the analysis section
                          setTimeout(() => {
                            const analysisSection = document.getElementById('analysis-section');
                            if (analysisSection) {
                              analysisSection.scrollIntoView({ behavior: 'smooth' });
                            }
                          }, 100);
                        }}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-sm truncate">{contract.filename}</p>
                            <p className="text-xs text-gray-500 mt-1">{formatDate(contract.uploadedAt)}</p>
                            <div className="flex gap-2 mt-1 text-xs text-gray-500">
                              <span>{formatFileSize(contract.size)}</span>
                              <span>•</span>
                              <span>{contract.word_count?.toLocaleString() || 0} words</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <a 
                              href={contract.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-800 py-1 px-2 rounded transition-colors"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View
                            </a>
                            {contract.analyzed ? (
                              <button 
                                className="text-xs bg-green-100 text-green-800 py-1 px-2 rounded cursor-default"
                                onClick={(e) => e.stopPropagation()}
                              >
                                Analyzed
                              </button>
                            ) : (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent triggering the parent onClick
                                  setSelectedContract(contract);
                                  setIsAnalyzing(false);
                                  setExtractedText(null);
                                  setExtractedWordCount(null);
                                  setExtractionError(null);
                                }}
                                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-800 py-1 px-2 rounded transition-colors"
                              >
                                Analyze
                              </button>
                            )}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation(); // Prevent triggering the parent onClick
                                handleDeleteContract(contract.id, e);
                              }}
                              className="text-xs bg-red-100 hover:bg-red-200 text-red-800 py-1 px-2 rounded transition-colors"
                              disabled={isDeleting}
                            >
                              Delete
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
        <div id="analysis-section" className="md:w-2/3 bg-white rounded-lg shadow-lg p-4 min-h-[600px] flex flex-col">
          <h2 className="text-xl font-semibold text-center mb-4">Analysis</h2>
          
          {selectedContract ? (
            <div className="flex-1 flex flex-col">
              <div className="text-center mb-4">
                <h3 className="text-lg font-medium mb-2">{selectedContract.filename}</h3>
                <p className="text-gray-500 mb-4">
                  {selectedContract.word_count.toLocaleString()} words • {formatFileSize(selectedContract.size)} • Uploaded on {formatDate(selectedContract.uploadedAt)}
                </p>
                
                {!isAnalyzing ? (
                  <button
                    onClick={analyzeContract}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition"
                  >
                    Analyze contract with AI
                  </button>
                ) : isExtracting ? (
                  <div className="flex justify-center items-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                    <span className="ml-2 text-gray-600">Extracting text...</span>
                  </div>
                ) : extractionError ? (
                  <div className="text-left border p-4 rounded-lg bg-red-50 mb-4 text-red-700">
                    <p className="font-medium mb-2">Error extracting text:</p>
                    <p>{extractionError}</p>
                  </div>
                ) : (
                  <div className="text-left w-full flex flex-col">
                    <div className="mb-4 flex justify-between items-center">
                      {extractedWordCount !== null && (
                        <span className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                          {extractedWordCount.toLocaleString()} words
                        </span>
                      )}
                    </div>
                    
                    {isAnalyzingWithAI ? (
                      <div className="mb-6 p-4 border border-blue-200 rounded-lg bg-blue-50">
                        <div className="flex items-center">
                          <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-blue-500 mr-3"></div>
                          <p className="text-blue-700">Analyzing contract with AI...</p>
                        </div>
                      </div>
                    ) : aiAnalysisError ? (
                      <div className="mb-6 p-4 border border-red-200 rounded-lg bg-red-50">
                        <p className="font-medium text-red-700 mb-1">AI Analysis Error:</p>
                        <p className="text-red-700">{aiAnalysisError}</p>
                      </div>
                    ) : aiAnalysis ? (
                      <div className="mb-6">
                        <h4 className="font-medium text-lg mb-3">AI Risk Analysis</h4>
                        
                        {(() => {
                          const { majorRisks, minorRisks } = parseRiskAnalysis(aiAnalysis);
                          
                          // Function to format risks by removing bullet points and improving readability
                          const formatRiskText = (text: string) => {
                            // Split into lines, trim whitespace, and filter out empty lines
                            const lines = text.split('\n')
                              .map(line => line.trim())
                              .filter(line => line.length > 0);
                            
                            // Process each line to improve formatting
                            return lines.map(line => {
                              // Remove leading dashes/bullets and format risk titles in bold
                              if (line.match(/^-\s*\[(.*?)\]:/)) {
                                return line.replace(/^-\s*\[(.*?)\]:/, '<strong>$1:</strong>');
                              } else if (line.startsWith('- ')) {
                                return line.replace(/^-\s+/, '• ');
                              }
                              return line;
                            }).join('<br /><br />');
                          };
                          
                          return (
                            <>
                              <div className="mb-4">
                                <div className="bg-red-100 border border-red-400 text-red-800 p-4 rounded-lg mb-4">
                                  <h5 className="font-bold mb-2">Major Risks</h5>
                                  <div 
                                    className="risk-content" 
                                    dangerouslySetInnerHTML={{ __html: formatRiskText(majorRisks) }}
                                  />
                                </div>
                                
                                <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 p-4 rounded-lg">
                                  <h5 className="font-bold mb-2">Minor Risks</h5>
                                  <div 
                                    className="risk-content" 
                                    dangerouslySetInnerHTML={{ __html: formatRiskText(minorRisks) }}
                                  />
                                </div>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    ) : null}
                    
                    <div className="border p-4 rounded-lg bg-gray-50 overflow-auto max-h-[500px] text-sm">
                      {extractedText ? (
                        <p className="whitespace-pre-wrap font-mono">{extractedText}</p>
                      ) : (
                        <p className="text-gray-500">No text extracted</p>
                      )}
                    </div>
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
