import { NextResponse } from 'next/server';

// eNAMAD verification file route handler
// This ensures the file is accessible even if public folder routing fails
export async function GET() {
  return new NextResponse('', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}


