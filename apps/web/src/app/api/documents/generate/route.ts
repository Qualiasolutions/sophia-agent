import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  validateTemplateVariables,
  renderTemplate,
} from '@sophiaai/services';
import { WhatsAppService } from '@sophiaai/services';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const whatsappService = new WhatsAppService();

    const body = await request.json();
    const { template_id, variables, agent_phone_number } = body;

    // Validate required fields
    if (!template_id || !variables || !agent_phone_number) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: template_id, variables, agent_phone_number',
        },
        { status: 400 }
      );
    }

    // Fetch template from database
    const { data: template, error: fetchError } = await supabase
      .from('document_templates')
      .select('*')
      .eq('id', template_id)
      .eq('is_active', true)
      .single();

    if (fetchError || !template) {
      return NextResponse.json(
        {
          success: false,
          error: 'Template not found or inactive',
        },
        { status: 404 }
      );
    }

    // Validate variables
    const validation = validateTemplateVariables(
      variables,
      template.variables
    );

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Variable validation failed',
          validation_errors: validation.errors,
        },
        { status: 400 }
      );
    }

    // Render document
    const rendered = renderTemplate(
      template.template_content,
      template.variables,
      variables
    );

    if (!rendered.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Document rendering failed',
          rendering_errors: rendered.errors,
        },
        { status: 500 }
      );
    }

    // Lookup agent_id from phone number
    const { data: agent, error: agentError } = await supabase
      .from('agents')
      .select('id')
      .eq('phone_number', agent_phone_number)
      .single();

    if (agentError || !agent) {
      return NextResponse.json(
        {
          success: false,
          error: 'Agent not found for phone number',
        },
        { status: 404 }
      );
    }

    const startTime = Date.now();

    // Log the document generation
    const { data: generation, error: logError } = await supabase
      .from('document_generations')
      .insert({
        template_id,
        agent_id: agent.id,
        variables_provided: variables,
        generated_content: rendered.content,
        generation_time_ms: Date.now() - startTime,
      })
      .select()
      .single();

    if (logError) {
      console.error('[Document Generation] Failed to log generation:', logError);
    }

    // Split content for WhatsApp (4096 char limit)
    const chunks = splitForWhatsApp(rendered.content!);

    // Send via WhatsApp
    const deliveryResults = [];
    for (let i = 0; i < chunks.length; i++) {
      const message = i === 0
        ? `📄 **${template.name}**\n\n${chunks[i]}`
        : chunks[i];

      try {
        const result = await whatsappService.sendMessage(
          { phoneNumber: agent_phone_number, messageText: message },
          agent.id
        );
        deliveryResults.push({ chunk: i + 1, success: result.success });
      } catch (error) {
        deliveryResults.push({ chunk: i + 1, success: false, error });
      }
    }

    const allDelivered = deliveryResults.every((r) => r.success);

    return NextResponse.json({
      success: true,
      generation_id: generation?.id,
      template_name: template.name,
      chunks_sent: chunks.length,
      delivery_results: deliveryResults,
      all_delivered: allDelivered,
    });
  } catch (error) {
    console.error('[Document Generation API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * Split content into WhatsApp-compatible chunks (max 4096 chars)
 */
function splitForWhatsApp(content: string): string[] {
  const MAX_LENGTH = 4096;
  const chunks: string[] = [];

  if (content.length <= MAX_LENGTH) {
    return [content];
  }

  // Split by paragraphs first
  const paragraphs = content.split('\n\n');
  let currentChunk = '';

  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > MAX_LENGTH) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = '';
      }

      // If single paragraph exceeds limit, split it
      if (paragraph.length > MAX_LENGTH) {
        const words = paragraph.split(' ');
        for (const word of words) {
          if ((currentChunk + word).length > MAX_LENGTH) {
            chunks.push(currentChunk.trim());
            currentChunk = word + ' ';
          } else {
            currentChunk += word + ' ';
          }
        }
      } else {
        currentChunk = paragraph + '\n\n';
      }
    } else {
      currentChunk += paragraph + '\n\n';
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}
