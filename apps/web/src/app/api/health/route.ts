import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.VERCEL_ENV || 'development',
    },
    { status: 200 }
  );
}
