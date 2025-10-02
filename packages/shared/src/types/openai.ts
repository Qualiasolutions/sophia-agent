// OpenAI-related types for Sophia AI

export interface ConversationContext {
  agentId: string;
  messageHistory?: ConversationMessage[];
  currentIntent?: Intent;
}

export interface ConversationMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface AIResponse {
  text: string;
  tokensUsed: {
    prompt: number;
    completion: number;
    total: number;
  };
  costEstimate: number;  // in USD
  responseTime: number;  // in milliseconds
  toolCalls?: ToolCall[];  // Function calls requested by the AI
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;  // JSON string
  };
}

export interface OpenAIConfig {
  model: 'gpt-4o-mini' | 'gpt-4o' | 'gpt-4-turbo';
  temperature: number;
  maxTokens: number;
  timeout: number;  // in milliseconds
}

export type Intent =
  | 'greeting'
  | 'document_generation'
  | 'listing_management'
  | 'calculation'
  | 'email_assistance'
  | 'unknown';
