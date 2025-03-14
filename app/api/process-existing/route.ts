import { neon } from '@neondatabase/serverless';
import { extractTextFromPDF } from '@/utils/pdf-extractor-node';
import { NextResponse } from 'next/server';

// Create a SQL client
const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    // Get all contracts that don't have text extracted yet
    const contracts = await sql`
      SELECT id, blob_url as url FROM contracts
    `;

    console.log(`Found ${contracts.length} contracts to process`);

    const results = [];

    // Process each contract
    for (const contract of contracts) {
      console.log(`Processing contract ${contract.id}: ${contract.url}`);
      
      try {
        // Extract text from the PDF
        const { text, wordCount } = await extractTextFromPDF(contract.url);
        
        // Update the contract in the database
        await sql`
          UPDATE contracts 
          SET extracted_text = ${text}, word_count = ${wordCount}
          WHERE id = ${contract.id}
        `;
        
        console.log(`Successfully processed contract ${contract.id}: ${wordCount} words`);
        
        results.push({
          id: contract.id,
          success: true,
          wordCount
        });
      } catch (error: any) {
        console.error(`Error processing contract ${contract.id}:`, error);
        
        results.push({
          id: contract.id,
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