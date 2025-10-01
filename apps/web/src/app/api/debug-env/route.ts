import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  return NextResponse.json({
    hasSupabaseUrl: !!supabaseUrl,
    hasServiceKey: !!serviceKey,
    urlLength: supabaseUrl?.length || 0,
    keyLength: serviceKey?.length || 0,
    urlSample: supabaseUrl?.substring(0, 30) || 'missing',
    keySample: serviceKey?.substring(0, 30) || 'missing',
  });
}
