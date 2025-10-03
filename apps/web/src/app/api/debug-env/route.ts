import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;

  return NextResponse.json({
    hasSupabaseUrl: !!supabaseUrl,
    hasServiceKey: !!serviceKey,
    hasOpenAI: !!openaiKey,
    hasTwilioSid: !!twilioSid,
    hasTwilioToken: !!twilioToken,
    urlLength: supabaseUrl?.length || 0,
    keyLength: serviceKey?.length || 0,
    openaiKeyLength: openaiKey?.length || 0,
    twilioSidLength: twilioSid?.length || 0,
  });
}
