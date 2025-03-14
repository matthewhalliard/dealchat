import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPDF } from '@/utils/pdf-extractor';
import { sql } from '@/utils/db';

export async function POST(request: NextRequest) {
  try {
    const { contractId } = await request.json();
    
    if (!contractId) {
      return NextResponse.json(
        { error: 'Contract ID is required' },
        { status: 400 }
      );
    }

    // Get the contract from the database
    const contracts = await sql`
      SELECT * FROM contracts WHERE id = ${contractId}
    `;

    if (contracts.length === 0) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    const contract = contracts[0];
    
    // Extract text from the PDF
    const { text, wordCount } = await extractTextFromPDF(contract.blob_url);
    
    // Update the database with the extracted text
    await sql`
      UPDATE contracts
      SET extracted_text = ${text}, word_count = ${wordCount}
      WHERE id = ${contractId}
    `;

    return NextResponse.json({
      success: true,
      wordCount,
      textPreview: text.substring(0, 300) + (text.length > 300 ? '...' : '')
    });
  } catch (error) {
    console.error('Error extracting text:', error);
    return NextResponse.json(
      { error: 'Error extracting text', details: String(error) },
      { status: 500 }
    );
  }
} 