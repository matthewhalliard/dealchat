import { NextRequest, NextResponse } from 'next/server';
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

    // Mark the contract as analyzed
    const result = await sql`
      UPDATE contracts
      SET analyzed = TRUE
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
      message: `Contract ${contractId} marked as analyzed`
    });
  } catch (error) {
    console.error('Error marking contract as analyzed:', error);
    return NextResponse.json(
      { error: 'Error marking contract as analyzed', details: String(error) },
      { status: 500 }
    );
  }
} 