import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/utils/db';

export async function DELETE(request: NextRequest) {
  try {
    // Get the contract ID from the URL
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Contract ID is required' },
        { status: 400 }
      );
    }

    // Delete the contract from the database
    const result = await sql`
      DELETE FROM contracts
      WHERE id = ${id}
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
      message: `Contract ${id} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting contract:', error);
    return NextResponse.json(
      { error: 'Error deleting contract', details: String(error) },
      { status: 500 }
    );
  }
} 