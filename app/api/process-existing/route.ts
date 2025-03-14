import { neon } from '@neondatabase/serverless';
import { extractTextFromPDF } from '@/utils/pdf-extractor-node';
import { NextResponse } from 'next/server';

// Create a SQL client
const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    // Get all contracts that don't have text extracted yet or have the placeholder text
    const contracts = await sql`
      SELECT id, blob_url as url, filename FROM contracts
      WHERE extracted_text IS NULL 
      OR extracted_text LIKE 'File:%'
      OR extracted_text LIKE '[PDF%'
      OR LENGTH(extracted_text) < 100
    `;

    console.log(`Found ${contracts.length} contracts to process`);

    const results = [];

    // Process each contract
    for (const contract of contracts) {
      console.log(`Processing contract ${contract.id}: ${contract.url}`);
      
      try {
        // Extract text from the PDF
        const { text, wordCount } = await extractTextFromPDF(contract.url);
        
        console.log(`Successfully extracted ${wordCount} words from contract ${contract.id}`);
        
        // Update the contract in the database
        await sql`
          UPDATE contracts 
          SET extracted_text = ${text}, word_count = ${wordCount}
          WHERE id = ${contract.id}
        `;
        
        console.log(`Updated database for contract ${contract.id}`);
        
        results.push({
          id: contract.id,
          filename: contract.filename,
          success: true,
          wordCount,
          textPreview: text.substring(0, 200) + (text.length > 200 ? '...' : '')
        });
      } catch (error: any) {
        console.error(`Error processing contract ${contract.id}:`, error);
        
        results.push({
          id: contract.id,
          filename: contract.filename,
          success: false,
          error: error.message || String(error)
        });
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error processing contracts:', error);
    return NextResponse.json(
      { error: 'Failed to process contracts', details: error.message || String(error) },
      { status: 500 }
    );
  }
} 