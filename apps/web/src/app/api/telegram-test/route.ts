/**
 * Telegram Diagnostic Endpoint
 * Tests if Telegram service can be initialized
 */

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check environment variables
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    const checks = {
      telegram_bot_token: !!botToken,
      telegram_webhook_secret: !!webhookSecret,
      supabase_url: !!supabaseUrl,
      supabase_service_role_key: !!supabaseKey,
      bot_token_format: botToken ? botToken.split(':').length === 2 : false,
    };

    // Try to import and initialize TelegramService
    let serviceError = null;
    try {
      const { getTelegramService } = await import('@sophiaai/services');
      const service = getTelegramService();
      checks.telegram_service_initialized = true;
    } catch (error) {
      serviceError = error instanceof Error ? error.message : String(error);
      checks.telegram_service_initialized = false;
    }

    // Try to import and initialize TelegramAuthService
    let authServiceError = null;
    try {
      const { getTelegramAuthService } = await import('@sophiaai/services');
      const authService = getTelegramAuthService();
      checks.telegram_auth_service_initialized = true;
    } catch (error) {
      authServiceError = error instanceof Error ? error.message : String(error);
      checks.telegram_auth_service_initialized = false;
    }

    return NextResponse.json({
      status: 'ok',
      checks,
      errors: {
        service: serviceError,
        authService: authServiceError,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'error',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
