import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPDF } from '@/utils/pdf-extractor-node';

export async function POST(request: NextRequest) {
  try {
    const { pdfUrl } = await request.json();
    
    if (!pdfUrl) {
      return NextResponse.json(
        { error: 'PDF URL is required' },
        { status: 400 }
      );
    }

    console.log('Testing PDF extraction for URL:', pdfUrl);
    
    // Extract text from the PDF
    const { text, wordCount } = await extractTextFromPDF(pdfUrl);
    
    // Return the results
    return NextResponse.json({
      success: true,
      wordCount,
      textPreview: text.substring(0, 1000) + (text.length > 1000 ? '...' : ''),
      textLength: text.length
    });
  } catch (error) {
    console.error('Error in test PDF extraction:', error);
    return NextResponse.json(
      { error: 'Error extracting text', details: String(error) },
      { status: 500 }
    );
  }
} 