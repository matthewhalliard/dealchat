import { put } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/utils/db';
import { extractTextFromPDF } from '@/utils/pdf-extractor-node';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Generate a unique filename using timestamp and original filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    
    // Upload to Vercel Blob
    const blob = await put(filename, file, {
      access: 'public',
    });

    console.log(`File uploaded to: ${blob.url}`);

    // Extract text from the PDF using the improved backend utility
    console.log('Extracting text from uploaded PDF...');
    const { text, wordCount } = await extractTextFromPDF(blob.url);
    console.log(`Extracted ${wordCount} words from PDF`);
    
    // Store in database
    const result = await sql`
      INSERT INTO contracts (filename, blob_url, extracted_text, word_count)
      VALUES (${file.name}, ${blob.url}, ${text}, ${wordCount})
      RETURNING id
    `;

    // Return the URL and other metadata
    return NextResponse.json({
      url: blob.url,
      contractId: result[0].id,
      wordCount,
      textPreview: text.substring(0, 300) + (text.length > 300 ? '...' : ''),
      success: true
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Error uploading file', details: String(error) },
      { status: 500 }
    );
  }
} 