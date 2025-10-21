


interface ChatbaseRequest {
  agentId: string;
  message: string;
  conversationId?: string;
  stream?: boolean;
}

interface ChatbaseResponse {
  text: string;
  conversationId?: string;
  messageId?: string;
  usage?: {
    promptTokens: number;
    responseTokens: number;
    totalTokens: number;
  };
}

export interface ChatbaseServiceResponse {
  text: string;
  usage?: {
    promptTokens: number;
    responseTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
  conversationId?: string;
}

export class ChatbaseService {
  private readonly agentId: string;
  private readonly apiUrl: string;

  constructor(config?: { agentId?: string; apiUrl?: string }) {
    this.agentId =
      config?.agentId ??
      process.env.CHATBASE_AGENT_ID ??
      process.env.CHATBASE_BOT_ID ??
      '';
    this.apiUrl =
      config?.apiUrl ??
      'https://www.chatbase.co/api/v1/chat';

    if (!this.agentId) {
      throw new Error('CHATBASE_AGENT_ID environment variable is not set');
    }
  }

  async generateSophiaResponse(options: {
    message: string;
    conversationId?: string;
  }): Promise<ChatbaseServiceResponse> {
    const { message, conversationId } = options;
    const resolvedConversationId = conversationId ?? this.generateConversationId();

    if (!message?.trim()) {
      throw new Error('Message is required to generate a response');
    }

    const requestBody: ChatbaseRequest = {
      agentId: this.agentId,
      message,
      conversationId: resolvedConversationId,
      stream: false,
    };

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorPayload = await this.safeJson(response);
        console.error('[ChatbaseService] API error response', {
          status: response.status,
          statusText: response.statusText,
          error: errorPayload,
        });

        let errorMessage = `Chatbase API error: ${response.status} ${response.statusText}`;

        if (response.status === 401) {
          errorMessage = 'Chatbase authentication failed. Please check your CHATBASE_AGENT_ID.';
        } else if (response.status === 403) {
          errorMessage = 'Chatbase access forbidden. Please check your agent permissions.';
        } else if (response.status === 404) {
          errorMessage = 'Chatbase agent not found. Please check your CHATBASE_AGENT_ID.';
        }

        throw new Error(errorMessage);
      }

      const payload: ChatbaseResponse = await response.json();

      return {
        text: payload.text || "I'm not sure how to help with that yet.",
        usage: payload.usage,
        finishReason: 'stop',
        conversationId: payload.conversationId || resolvedConversationId,
      };
    } catch (error) {
      console.error('[ChatbaseService] Failed to generate response', {
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  
  private generateConversationId(): string {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
      return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  private async safeJson(response: Response) {
    try {
      return await response.json();
    } catch (_error) {
      return null;
    }
  }
}
