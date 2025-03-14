import { NextResponse } from 'next/server';
import { sql } from '@/utils/db';

export async function GET() {
  try {
    // Get all contracts from the database
    const contracts = await sql`
      SELECT 
        id, 
        filename, 
        blob_url as url, 
        word_count, 
        upload_date as "uploadedAt",
        LENGTH(extracted_text) > 0 as has_text
      FROM contracts 
      ORDER BY upload_date DESC
    `;
    
    // Transform to match the original API format
    const transformedContracts = contracts.map(contract => ({
      ...contract,
      pathname: contract.filename, // For backwards compatibility
      size: 0, // We don't have this info from the database
    }));
    
    return NextResponse.json({ 
      contracts: transformedContracts,
      success: true 
    });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json(
      { error: 'Error fetching contracts' },
      { status: 500 }
    );
  }
} 