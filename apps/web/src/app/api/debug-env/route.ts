import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const tokenHeader = request.headers.get('x-debug-token');
  const expectedToken = process.env.DEBUG_ENV_TOKEN;
  const isDevelopment = process.env.NODE_ENV !== 'production';

  if (!isDevelopment) {
    if (!expectedToken) {
      return NextResponse.json(
        { error: 'Debug endpoint disabled in production' },
        { status: 403 }
      );
    }

    if (tokenHeader !== expectedToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN;
  const telegramWebhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;

  return NextResponse.json({
    hasSupabaseUrl: !!supabaseUrl,
    hasServiceKey: !!serviceKey,
    hasOpenAI: !!openaiKey,
    hasTwilioSid: !!twilioSid,
    hasTwilioToken: !!twilioToken,
    hasTelegramToken: !!telegramToken,
    hasTelegramWebhookSecret: !!telegramWebhookSecret,
    urlLength: supabaseUrl?.length || 0,
    keyLength: serviceKey?.length || 0,
    openaiKeyLength: openaiKey?.length || 0,
    twilioSidLength: twilioSid?.length || 0,
    telegramTokenLength: telegramToken?.length || 0,
    telegramWebhookSecretLength: telegramWebhookSecret?.length || 0,
  });
}
