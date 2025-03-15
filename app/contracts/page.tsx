'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Contract {
  id: number;
  url: string;
  pathname: string;
  size: number;
  uploadedAt: string;
  filename: string;
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        setIsLoading(true);
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
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Error fetching contracts:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchContracts();
  }, []);

  // Function to format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Function to format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Add a new function to delete contracts
  const handleDeleteContract = async (contractId: number) => {
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

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">DealChat</h1>
          <nav>
            <Link href="/" className="text-white hover:text-blue-200 transition">
              Home
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto p-6">
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Your Contracts</h2>
          <Link 
            href="/" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
          >
            Upload New Contract
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-gray-500">Loading contracts...</div>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>Error loading contracts: {error}</p>
          </div>
        ) : contracts.length === 0 ? (
          <div className="bg-gray-100 border border-gray-300 text-gray-700 p-8 rounded-lg text-center">
            <p className="text-lg mb-4">You haven&apos;t uploaded any contracts yet.</p>
            <Link 
              href="/" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
            >
              Upload Your First Contract
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Filename
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date Uploaded
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {contracts.map((contract, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{contract.filename}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatDate(contract.uploadedAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{formatFileSize(contract.size)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <a 
                        href={contract.url} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        View
                      </a>
                      <a 
                        href={contract.url} 
                        download={contract.filename}
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        Download
                      </a>
                      <button 
                        onClick={() => handleDeleteContract(contract.id)}
                        className="text-red-600 hover:text-red-900 cursor-pointer"
                        disabled={isDeleting}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
} 