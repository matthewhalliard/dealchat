import { list } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // List all files in the blob storage
    const { blobs } = await list();
    
    // Filter for PDF files only and transform for frontend use
    const pdfFiles = blobs
      .filter(blob => blob.pathname.toLowerCase().endsWith('.pdf'))
      .map(blob => ({
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
        // Extract original filename from the pathname (remove timestamp prefix)
        filename: blob.pathname.split('-').slice(1).join('-')
      }))
      // Sort by most recent first
      .sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
    
    return NextResponse.json({ 
      contracts: pdfFiles,
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