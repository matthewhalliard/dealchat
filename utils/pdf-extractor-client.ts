import * as pdfjs from 'pdfjs-dist';
import 'pdfjs-dist/build/pdf.worker.entry';

/**
 * Extracts text from a PDF URL using pdf.js in the browser
 */
export async function extractTextFromPDF(pdfUrl: string): Promise<{ text: string, wordCount: number }> {
  try {
    // Load the PDF document
    const loadingTask = pdfjs.getDocument(pdfUrl);
    const pdf = await loadingTask.promise;
    
    let fullText = '';
    
    // Get text from all pages
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const textContent = await page.getTextContent();
      
      // Extract text from the items
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');
      
      fullText += pageText + '\n\n';
    }
    
    // Clean up the text
    const cleanText = fullText
      .replace(/\r\n/g, '\n') // Normalize line endings
      .replace(/\s+/g, ' ')   // Replace multiple spaces with a single space
      .trim();
    
    // Count words in the extracted text
    const wordCount = countWords(cleanText);
    
    return { text: cleanText, wordCount };
  } catch (error) {
    console.error('Error extracting PDF text:', error);
    return { text: `Error extracting text: ${error}`, wordCount: 0 };
  }
}

/**
 * Count words in a text string
 */
function countWords(text: string): number {
  // Split by whitespace and filter out empty strings
  return text.split(/\s+/).filter(word => word.length > 0).length;
} 