import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/utils/db';

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Contract ID is required' }, { status: 400 });
    }
    
    // First, delete any associated analyses from contract_analyses table
    await sql`
      DELETE FROM contract_analyses
      WHERE contract_id = ${id}
    `;

    // Then, delete the contract from the contracts table
    const result = await sql`
      DELETE FROM contracts
      WHERE id = ${id}
      RETURNING id
    `;
    
    if (result.length === 0) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting contract:', error);
    return NextResponse.json(
      { error: 'Failed to delete contract', details: String(error) },
      { status: 500 }
    );
  }
} 