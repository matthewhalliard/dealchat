import { NextResponse } from 'next/server';
import { sql } from '@/utils/db';

export async function GET() {
  try {
    // Check if the analyzed column exists in the contracts table
    const result = await sql`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'contracts' 
        AND column_name = 'analyzed'
      ) as column_exists;
    `;

    const columnExists = result[0]?.column_exists;
    
    if (!columnExists) {
      // Add the analyzed column to the contracts table
      await sql`
        ALTER TABLE contracts 
        ADD COLUMN IF NOT EXISTS analyzed BOOLEAN DEFAULT FALSE;
      `;
      
      return NextResponse.json({
        success: true,
        message: 'Successfully added analyzed column to contracts table'
      });
    } else {
      return NextResponse.json({
        success: true,
        message: 'Analyzed column already exists in contracts table'
      });
    }
  } catch (error) {
    console.error('Error in database migration:', error);
    return NextResponse.json(
      { error: 'Failed to update database schema', details: String(error) },
      { status: 500 }
    );
  }
} 