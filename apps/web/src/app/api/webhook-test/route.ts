import { NextRequest, NextResponse } from 'next/server';

/**
 * Ultra-simple webhook endpoint to test if ANY requests are reaching us
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  console.log('=== WEBHOOK TEST GET CALLED ===', {
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({
    status: 'GET received',
    timestamp: new Date().toISOString()
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const formData = await request.formData();
  const allData: Record<string, string> = {};
  for (const [key, value] of formData.entries()) {
    allData[key] = value.toString();
  }

  console.log('=== WEBHOOK TEST POST CALLED ===', {
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    formData: allData,
    timestamp: new Date().toISOString(),
  });

  return NextResponse.json({
    status: 'POST received',
    formDataKeys: Object.keys(allData),
    timestamp: new Date().toISOString()
  }, { status: 200 });
}
