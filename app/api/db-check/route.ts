import { neon } from '@neondatabase/serverless';
import { NextResponse } from 'next/server';

// Create a SQL client
const sql = neon(process.env.DATABASE_URL!);

export async function GET() {
  try {
    // Get all contracts with their details
    const contracts = await sql`
      SELECT 
        id, 
        filename, 
        blob_url, 
        extracted_text, 
        word_count, 
        upload_date
      FROM contracts
      ORDER BY id DESC
    `;

    return NextResponse.json(contracts);
  } catch (error: any) {
    console.error('Error fetching contracts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contracts', details: error.message || String(error) },
      { status: 500 }
    );
  }
} 