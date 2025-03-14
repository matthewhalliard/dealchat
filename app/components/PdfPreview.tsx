'use client';

import { useEffect, useState, useRef } from 'react';
import * as pdfjs from 'pdfjs-dist';
import { PDFDocumentProxy } from 'pdfjs-dist';

// Add more specific types for PDF.js text content
interface TextItem {
  str: string;
  dir: string;
  transform: number[];
  width: number;
  height: number;
  hasEOL: boolean;
}

interface TextContent {
  items: (TextItem | any)[];
  styles: Record<string, any>;
}

// Initialize PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf-worker/pdf.worker.min.mjs';

interface PdfPreviewProps {
  pdfUrl: string;
}

export default function PdfPreview({ pdfUrl }: PdfPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [extractedText, setExtractedText] = useState<string>('');
  const [showTextView, setShowTextView] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    async function loadPdf() {
      try {
        setIsLoading(true);
        setError(null);
        
        // Load the PDF document
        const pdf = await pdfjs.getDocument(pdfUrl).promise;
        setPdfDocument(pdf);
        
        // Extract text from all pages
        await extractTextFromPDF(pdf);
        
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    }
    
    loadPdf();
    
    // Cleanup
    return () => {
      if (pdfDocument) {
        pdfDocument.destroy();
      }
    };
  }, [pdfUrl]);
  
  // Function to extract text from the PDF
  const extractTextFromPDF = async (pdf: PDFDocumentProxy) => {
    try {
      let fullText = '';
      
      // Iterate through each page to extract text
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent() as TextContent;
        const pageText = textContent.items
          .filter(item => 'str' in item)
          .map(item => item.str)
          .join(' ');
        fullText += `\n---- Page ${i} ----\n\n${pageText}\n`;
      }
      
      setExtractedText(fullText);
    } catch (err) {
      console.error('Error extracting text:', err);
      setExtractedText('Error extracting text from PDF.');
    }
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Toggle button for switching between PDF and text view */}
      <div className="mb-4 flex justify-end">
        <button
          onClick={() => setShowTextView(!showTextView)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition"
        >
          {showTextView ? 'Show PDF View' : 'Show Text View'}
        </button>
      </div>
      
      {isLoading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="flex-1 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      ) : showTextView ? (
        // Text view
        <div className="flex-1 bg-white p-4 rounded shadow overflow-auto">
          <pre className="whitespace-pre-wrap font-sans text-sm">{extractedText}</pre>
        </div>
      ) : (
        // PDF view
        <iframe 
          ref={iframeRef}
          src={pdfUrl}
          className="flex-1 w-full border border-gray-300 rounded"
          title="PDF Preview"
        />
      )}
    </div>
  );
} 