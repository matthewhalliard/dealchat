'use client';

import { useState } from 'react';

export default function Home() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    
    // Here you would normally send the file to your server
    // For now, we'll just simulate a successful upload after 2 seconds
    setTimeout(() => {
      setIsUploading(false);
      setSelectedFile(null);
      alert('PDF uploaded successfully!');
    }, 2000);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white p-4 shadow-md">
        <div className="container mx-auto">
          <h1 className="text-2xl font-bold">DealChat</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
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
        </div>
      </main>
    </div>
  );
}
