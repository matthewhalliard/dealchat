import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/utils/db';

export async function POST(request: NextRequest) {
  try {
    const { contractId, text, wordCount } = await request.json();
    
    if (!contractId) {
      return NextResponse.json(
        { error: 'Contract ID is required' },
        { status: 400 }
      );
    }

    // Update the contract with the extracted text
    const result = await sql`
      UPDATE contracts
      SET extracted_text = ${text}, word_count = ${wordCount}
      WHERE id = ${contractId}
      RETURNING id
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Contract not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Contract ${contractId} updated with ${wordCount} words extracted`
    });
  } catch (error) {
    console.error('Error updating contract:', error);
    return NextResponse.json(
      { error: 'Error updating contract', details: String(error) },
      { status: 500 }
    );
  }
} 