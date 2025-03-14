import { NextRequest, NextResponse } from 'next/server';
import { extractTextFromPDF } from '@/utils/pdf-extractor-node';
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
    console.log(`Extracting text from contract ID ${contractId}: ${contract.filename}`);
    
    // Extract text from the PDF
    const { text, wordCount } = await extractTextFromPDF(contract.blob_url);
    console.log(`Successfully extracted ${wordCount} words from ${contract.filename}`);
    
    // Update the database with the extracted text
    await sql`
      UPDATE contracts
      SET extracted_text = ${text}, word_count = ${wordCount}
      WHERE id = ${contractId}
    `;
    console.log(`Updated database with extracted text for contract ID ${contractId}`);

    // Return a more detailed response
    return NextResponse.json({
      success: true,
      wordCount,
      contractId,
      filename: contract.filename,
      textPreview: text
    });
  } catch (error) {
    console.error('Error extracting text:', error);
    return NextResponse.json(
      { error: 'Error extracting text', details: String(error) },
      { status: 500 }
    );
  }
} 