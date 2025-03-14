import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/utils/db';

// Get all comments
export async function GET() {
  try {
    const comments = await sql`
      SELECT * FROM comments ORDER BY created_at DESC
    `;
    
    return NextResponse.json({
      comments,
      success: true
    });
  } catch (error) {
    console.error('Error fetching comments:', error);
    return NextResponse.json(
      { error: 'Error fetching comments' },
      { status: 500 }
    );
  }
}

// Create a new comment
export async function POST(request: NextRequest) {
  try {
    const { comment } = await request.json();
    
    if (!comment) {
      return NextResponse.json(
        { error: 'Comment text is required' },
        { status: 400 }
      );
    }
    
    const result = await sql`
      INSERT INTO comments (comment) VALUES (${comment}) RETURNING id
    `;
    
    return NextResponse.json({
      id: result[0].id,
      success: true
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    return NextResponse.json(
      { error: 'Error adding comment' },
      { status: 500 }
    );
  }
} 