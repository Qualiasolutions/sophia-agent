/**
 * Admin Sophia Testing API
 * Provides an authenticated endpoint for trying Sophia via Chatbase AI.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { ChatbaseService } from '@sophiaai/services';

interface HistoryEntry {
  role: 'user' | 'assistant';
  content: string;
}

export async function POST(request: NextRequest) {
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { message?: string; history?: HistoryEntry[] } | undefined;

  try {
    body = await request.json();
  } catch (error) {
    console.error('[AdminSophiaTestingAPI] Invalid JSON payload', { error });
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  const message = body?.message?.trim();

  if (!message) {
    return NextResponse.json(
      { error: 'Message is required' },
      { status: 422 }
    );
  }

  
  try {
    const service = new ChatbaseService();
    const result = await service.generateSophiaResponse({
      message,
    });

    return NextResponse.json(
      {
        message: result.text,
        usage: result.usage,
        finishReason: result.finishReason,
        conversationId: result.conversationId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[AdminSophiaTestingAPI] Failed to generate response', {
      error: error instanceof Error ? error.message : error,
    });

    const errorText =
      error instanceof Error ? error.message : 'Unknown error occurred';

    let status = 500;
    let errorMessage = 'Failed to generate response from Sophia testing endpoint.';

    if (errorText.includes('CHATBASE_BOT_ID')) {
      errorMessage =
        'Chatbase bot ID is not configured. Set CHATBASE_BOT_ID in your environment.';
    } else if (errorText.includes('Chatbase API error')) {
      status = 502;
      const [, rawDetail] = errorText.split('Chatbase API error:');
      const detail = rawDetail?.trim();
      errorMessage = detail
        ? `Chatbase API error: ${detail}`
        : 'Chatbase API returned an error.';
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: process.env.NODE_ENV === 'development' ? errorText : undefined,
      },
      { status }
    );
  }
}
