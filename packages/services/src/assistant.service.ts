/**
 * OpenAI Assistant Service
 * Handles document generation using OpenAI Assistant API with Knowledge Base files
 * Epic 2 (Revised): OpenAI Assistant integration
 */

import OpenAI from 'openai';

const ASSISTANT_ID = process.env.OPENAI_ASSISTANT_ID!;
const MAX_POLL_ATTEMPTS = 60; // 60 attempts * 500ms = 30 seconds max
const POLL_INTERVAL = 500; // 500ms between polls

export interface AssistantResponse {
  text: string;
  threadId: string;
  runId: string;
  assistantId: string;
  responseTime: number;
  tokensUsed?: {
    prompt: number;
    completion: number;
    total: number;
  };
  costEstimate?: number;
}

export class AssistantService {
  private client: OpenAI;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    if (!ASSISTANT_ID) {
      throw new Error('OPENAI_ASSISTANT_ID environment variable is not set');
    }

    this.client = new OpenAI({
      apiKey,
      timeout: 30000, // 30 seconds timeout
    });
  }

  /**
   * Generate a document using OpenAI Assistant
   * @param agentId - Agent identifier
   * @param message - Current message from agent
   * @param history - Conversation history (last 10 messages)
   * @returns Assistant response with document content
   */
  async generateDocument(
    agentId: string,
    message: string,
    history: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<AssistantResponse> {
    const startTime = Date.now();

    try {
      // Create a new thread for this conversation
      // TODO: In future, store thread_id in agents table for persistence
      const thread = await this.client.beta.threads.create();
      console.log('[Assistant] Thread created', { threadId: thread.id, agentId });

      // Add conversation history to thread
      if (history && history.length > 0) {
        for (const msg of history) {
          await this.client.beta.threads.messages.create(thread.id, {
            role: msg.role,
            content: msg.content,
          });
        }
        console.log('[Assistant] Added conversation history', {
          threadId: thread.id,
          messageCount: history.length,
        });
      }

      // Add current message to thread
      await this.client.beta.threads.messages.create(thread.id, {
        role: 'user',
        content: message,
      });

      // Run the Assistant
      const run = await this.client.beta.threads.runs.create(thread.id, {
        assistant_id: ASSISTANT_ID,
      });

      console.log('[Assistant] Run started', {
        threadId: thread.id,
        runId: run.id,
        assistantId: ASSISTANT_ID,
      });

      // Wait for completion
      const completedRun = await this.waitForCompletion(thread.id, run.id);

      // Check run status
      if (completedRun.status !== 'completed') {
        console.error('[Assistant] Run did not complete successfully', {
          threadId: thread.id,
          runId: run.id,
          status: completedRun.status,
          lastError: completedRun.last_error,
        });

        return {
          text: "I'm having trouble generating the document right now. Please try again in a moment.",
          threadId: thread.id,
          runId: run.id,
          assistantId: ASSISTANT_ID,
          responseTime: Date.now() - startTime,
        };
      }

      // Retrieve the Assistant's response
      const messages = await this.client.beta.threads.messages.list(thread.id, {
        order: 'desc',
        limit: 1,
      });

      const assistantMessage = messages.data[0];
      const textContent = assistantMessage.content.find(
        (content) => content.type === 'text'
      );

      const responseText =
        textContent?.type === 'text' ? textContent.text.value : '';

      const responseTime = Date.now() - startTime;

      console.log('[Assistant] Response generated', {
        threadId: thread.id,
        runId: run.id,
        responseLength: responseText.length,
        responseTime: `${responseTime}ms`,
      });

      // Extract token usage if available
      const tokensUsed = completedRun.usage
        ? {
            prompt: completedRun.usage.prompt_tokens || 0,
            completion: completedRun.usage.completion_tokens || 0,
            total: completedRun.usage.total_tokens || 0,
          }
        : undefined;

      return {
        text: responseText,
        threadId: thread.id,
        runId: run.id,
        assistantId: ASSISTANT_ID,
        responseTime,
        tokensUsed,
      };
    } catch (error) {
      console.error('[Assistant] Error generating document', {
        agentId,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      });

      return {
        text: "I'm having trouble processing your request right now. Please try again in a moment.",
        threadId: '',
        runId: '',
        assistantId: ASSISTANT_ID,
        responseTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Poll the run status until completion or timeout
   * @param threadId - Thread ID
   * @param runId - Run ID
   * @returns Completed run object
   */
  private async waitForCompletion(
    threadId: string,
    runId: string
  ): Promise<OpenAI.Beta.Threads.Runs.Run> {
    let attempts = 0;

    while (attempts < MAX_POLL_ATTEMPTS) {
      const run = await this.client.beta.threads.runs.retrieve(threadId, runId);

      if (run.status === 'completed') {
        return run;
      }

      if (run.status === 'failed' || run.status === 'cancelled' || run.status === 'expired') {
        console.error('[Assistant] Run terminated with error', {
          threadId,
          runId,
          status: run.status,
          lastError: run.last_error,
        });
        return run;
      }

      if (run.status === 'requires_action') {
        console.warn('[Assistant] Run requires action (not implemented)', {
          threadId,
          runId,
          requiredAction: run.required_action?.type,
        });
        // For now, we don't handle function calling
        return run;
      }

      // Wait before next poll
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL));
      attempts++;
    }

    throw new Error(`Assistant run timed out after ${MAX_POLL_ATTEMPTS * POLL_INTERVAL}ms`);
  }
}

// Singleton instance
let _instance: AssistantService | null = null;

/**
 * Get the singleton AssistantService instance
 */
export function getAssistantService(): AssistantService {
  if (!_instance) {
    _instance = new AssistantService();
  }
  return _instance;
}
