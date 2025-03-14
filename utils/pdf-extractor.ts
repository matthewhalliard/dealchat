import * as pdfjsLib from 'pdfjs-dist';

// Set up a safe worker URL that works in both browser and server environments
if (typeof window !== 'undefined') {
  // Browser environment - use CDN
  pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
} else {
  // Server environment - disable worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = '';
}

interface TextItem {
  str: string;
  dir?: string;
  transform?: number[];
  width?: number;
  height?: number;
  hasEOL?: boolean;
}

interface TextContent {
  items: any[];
  styles?: Record<string, unknown>;
}

/**
 * Extracts text from a PDF and returns the text and word count
 */
export async function extractTextFromPDF(pdfUrl: string): Promise<{text: string, wordCount: number}> {
  try {
    console.log('Starting PDF extraction from URL:', pdfUrl);
    
    // Handle different environments
    let pdf;
    if (typeof window !== 'undefined') {
      // Browser environment
      pdf = await pdfjsLib.getDocument(pdfUrl).promise;
    } else {
      // Server environment - fetch the PDF first
      const response = await fetch(pdfUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch PDF: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      console.log(`PDF fetched, size: ${arrayBuffer.byteLength} bytes`);
      
      // Load the PDF with the raw data
      pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
    }
    
    console.log(`PDF loaded successfully with ${pdf.numPages} pages`);
    
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      console.log(`Processing page ${i} of ${pdf.numPages}`);
      const page = await pdf.getPage(i);
      console.log(`Got page ${i}`);
      
      const textContent = await page.getTextContent() as TextContent;
      console.log(`Got text content for page ${i} with ${textContent.items.length} items`);
      
      const pageText = textContent.items
        .filter((item): item is TextItem => 'str' in item)
        .map(item => item.str)
        .join(' ');
      
      console.log(`Extracted ${pageText.length} characters from page ${i}`);
      fullText += pageText + ' ';
    }
    
    // Count words (split by whitespace and filter out empty strings)
    const words = fullText.split(/\s+/).filter(word => word.length > 0);
    const wordCount = words.length;
    
    console.log(`Extraction complete. Total text length: ${fullText.length}, Word count: ${wordCount}`);
    
    return { text: fullText, wordCount };
  } catch (error) {
    console.error('Error extracting text from PDF:', error);
    return { text: '', wordCount: 0 };
  }
} 