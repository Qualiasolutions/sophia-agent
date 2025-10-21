'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type ChatRole = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
}

interface ResponseMeta {
  usage?: {
    promptTokens: number;
    responseTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
  conversationId?: string;
  errorDetails?: string;
}

const createMessageId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export default function SophiaTestingPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<ResponseMeta | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const sendMessage = useCallback(
    async (draft?: string) => {
      if (isSending) return;

      const outbound = (draft ?? input).trim();
      if (!outbound) return;

      const userMessage: ChatMessage = {
        id: createMessageId(),
        role: 'user',
        content: outbound,
        timestamp: new Date().toISOString(),
      };

      const historyPayload = messages.map((message) => ({
        role: message.role,
        content: message.content,
      }));

      setIsSending(true);
      setError(null);
      setMeta(null);
      setMessages((prev) => [...prev, userMessage]);
      setInput('');

      try {
        const response = await fetch('/api/admin/testing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: outbound,
            history: historyPayload,
          }),
        });

        const data = await response.json();

        if (!response.ok || data.error) {
          throw new Error(data.error || 'Unexpected response from testing API');
        }

        const assistantMessage: ChatMessage = {
          id: createMessageId(),
          role: 'assistant',
          content: data.message ?? '',
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
        setMeta({
          usage: data.usage,
          finishReason: data.finishReason,
          conversationId: data.conversationId,
          errorDetails: data.details,
        });
      } catch (apiError) {
        const message =
          apiError instanceof Error ? apiError.message : 'Unknown error';
        setError(message);
        setMeta({
          errorDetails: message,
        });
      } finally {
        setIsSending(false);
      }
    },
    [input, isSending, messages]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
      }
    },
    [sendMessage]
  );

  const handleReset = () => {
    setMessages([]);
    setMeta(null);
    setError(null);
    setInput('');
  };

  const friendlyMeta = useMemo(() => {
    if (!meta) return null;

    const entries: Array<{ label: string; value: string }> = [];

    if (meta.usage) {
      entries.push({
        label: 'Prompt Tokens',
        value: meta.usage.promptTokens.toString(),
      });
      entries.push({
        label: 'Response Tokens',
        value: meta.usage.responseTokens.toString(),
      });
      entries.push({
        label: 'Total Tokens',
        value: meta.usage.totalTokens.toString(),
      });
    }

    if (meta.finishReason) {
      entries.push({
        label: 'Finish Reason',
        value: meta.finishReason,
      });
    }

    if (meta.conversationId) {
      entries.push({
        label: 'Conversation ID',
        value: meta.conversationId.slice(0, 8) + '...',
      });
    }

    return entries;
  }, [meta]);

  const conversationId = meta?.conversationId;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mb-4">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Sophia AI Testing Lab
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto leading-relaxed">
            Powered by Chatbase AI. Test Sophia&apos;s real estate capabilities including document generation,
            property calculations, and client communication flows.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
              <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
              Chatbase Agent Ready
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              Real Estate AI
            </span>
          </div>
        </div>

      <div className="grid gap-8 lg:grid-cols-[3fr,2fr]">
          <section className="bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-2xl shadow-lg overflow-hidden">
            <div className="flex flex-col h-[700px]">
              <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100/50 bg-gradient-to-r from-blue-50 to-purple-50">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">Live Conversation</h2>
                  <p className="text-sm text-gray-600">
                    Chat with Sophia - Your AI Real Estate Assistant
                  </p>
                </div>
                <button
                  onClick={handleReset}
                  className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSending || messages.length === 0}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Reset Chat
                </button>
              </div>

            <div className="flex-1 overflow-y-auto px-8 py-6 space-y-6 bg-gradient-to-b from-gray-50 to-white">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center text-gray-400 space-y-6">
                  <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">Start a conversation with Sophia</h3>
                    <p className="text-gray-500 max-w-md mb-4">
                      Try asking about:
                    </p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Document Generation</span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Property Calculations</span>
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Registration Forms</span>
                      <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">Email Templates</span>
                    </div>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`flex items-start space-x-3 max-w-3xl ${message.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600'
                          : 'bg-gradient-to-r from-green-500 to-teal-600'
                      }`}>
                        {message.role === 'user' ? (
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <div className={`rounded-2xl px-6 py-4 shadow-md ${
                        message.role === 'user'
                          ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                          : 'bg-white border border-gray-200 text-gray-900'
                      }`}>
                        <div className="text-xs font-semibold uppercase tracking-wide mb-2 opacity-75">
                          {message.role === 'user' ? 'You' : 'Sophia AI'}
                        </div>
                        <div className="whitespace-pre-line text-sm leading-relaxed">
                          {message.content}
                        </div>
                        <div className={`mt-3 text-xs opacity-60 ${
                          message.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-gray-100/50 p-6 bg-gradient-to-r from-gray-50 to-white">
              <div className="space-y-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Type your message
                </label>
                <div className="flex gap-4">
                  <div className="flex-1">
                    <textarea
                      value={input}
                      onChange={(event) => setInput(event.target.value)}
                      onKeyDown={handleKeyDown}
                      rows={4}
                      placeholder="Ask Sophia to generate registration documents, calculate property fees, or create marketing agreements..."
                      className="w-full resize-none rounded-xl border border-gray-300/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white/80 backdrop-blur-sm shadow-sm"
                      disabled={isSending}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => sendMessage()}
                      className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-3 font-semibold text-white shadow-lg transition-all duration-200 hover:from-blue-700 hover:to-purple-700 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={isSending || !input.trim()}
                    >
                      {isSending ? (
                        <>
                          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </>
                      ) : (
                        <>
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                          </svg>
                          Send
                        </>
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    Press <kbd className="px-2 py-1 bg-gray-200 rounded-md font-mono text-xs">Shift</kbd> + <kbd className="px-2 py-1 bg-gray-200 rounded-md font-mono text-xs">Enter</kbd> for a new line
                  </span>
                  <span className="text-gray-400">
                    Powered by Chatbase AI
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-6">
          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50/80 backdrop-blur-sm p-6 text-sm text-red-800 shadow-lg">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="font-semibold mb-1">Connection Error</p>
                  <p className="text-red-700">{error}</p>
                  {meta?.errorDetails && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-red-600 font-medium">Technical Details</summary>
                      <pre className="mt-2 whitespace-pre-wrap font-mono text-xs text-red-600 bg-red-100/50 p-3 rounded-lg">
                        {meta.errorDetails}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          )}

          {friendlyMeta && (
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-6 text-sm text-blue-900 shadow-lg">
              <div className="flex items-center mb-4">
                <svg className="w-6 h-6 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className="font-semibold text-lg">Response Metrics</h3>
              </div>
              <dl className="space-y-3">
                {friendlyMeta.map((item) => (
                  <div key={item.label} className="flex justify-between items-center py-2 border-b border-blue-100 last:border-0">
                    <dt className="font-medium text-blue-700">{item.label}</dt>
                    <dd className="bg-blue-100 px-3 py-1 rounded-full text-blue-800 font-mono text-sm">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {conversationId && !error && (
            <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-6 text-sm text-green-900 shadow-lg">
              <div className="flex items-center mb-3">
                <svg className="w-6 h-6 mr-2 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="font-semibold text-lg">Session Info</h3>
              </div>
              <div className="space-y-2">
                <p className="text-green-700">
                  <span className="font-medium">Conversation ID:</span> {conversationId.slice(0, 8)}...
                </p>
                <p className="text-xs text-green-600 mt-2">
                  Session is being tracked for analytics and improvement purposes.
                </p>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-gray-50 to-slate-50 p-6 text-sm text-gray-700 shadow-lg space-y-4">
            <div className="flex items-center mb-4">
              <svg className="w-6 h-6 mr-2 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <h3 className="font-semibold text-lg">Configuration Status</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-green-100/50 rounded-lg border border-green-200">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium text-green-800">Chatbase Agent ID</span>
                </div>
                <span className="text-green-700 text-xs">Connected</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-blue-100/50 rounded-lg border border-blue-200">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium text-blue-800">API Connection</span>
                </div>
                <span className="text-blue-700 text-xs">Active</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-purple-100/50 rounded-lg border border-purple-200">
                <div className="flex items-center">
                  <svg className="w-4 h-4 text-purple-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium text-purple-800">Sophia AI</span>
                </div>
                <span className="text-purple-700 text-xs">Ready</span>
              </div>
            </div>
            <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
              <p className="text-xs text-gray-600">
                <strong>Environment:</strong> Production •
                <strong>Agent ID:</strong> {process.env.NODE_ENV === 'development' ? 'Development' : '73KCdZsMVzZKejkMPkqG'} •
                <strong>Version:</strong> v2.0 (Chatbase)
              </p>
            </div>
          </div>
        </section>
      </div>
      </div>
    </div>
  );
}
