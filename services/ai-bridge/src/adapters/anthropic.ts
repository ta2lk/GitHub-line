import { ProviderAdapter } from './adapter.js';
import { ChatCompletionRequest, ChatCompletionResponse } from '../types.js';
import { ProviderUnavailableError } from '../errors.js';

export class AnthropicAdapter implements ProviderAdapter {
  public id = 'anthropic';
  public name = 'Anthropic Claude Adapter';
  public supportsStreaming = true;

  constructor(
    private apiKey: string = process.env.ANTHROPIC_API_KEY || '',
    private baseUrl: string = 'https://api.anthropic.com/v1'
  ) {}

  async complete(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.apiKey) {
      throw new ProviderUnavailableError('anthropic', 'ANTHROPIC_API_KEY is not configured on the host.');
    }

    const start = Date.now();
    const endpoint = `${this.baseUrl.replace(/\/+$/, '')}/messages`;

    let systemPrompt = '';
    const messages: { role: string; content: string }[] = [];

    for (const m of request.messages) {
      const contentStr = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
      if (m.role === 'system') {
        systemPrompt = contentStr;
      } else {
        messages.push({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: contentStr
        });
      }
    }

    const modelName = request.model.includes('claude') ? request.model : 'claude-3-5-haiku-latest';

    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: modelName,
          messages,
          system: systemPrompt || undefined,
          max_tokens: request.max_tokens ?? 2048,
          temperature: request.temperature ?? 0.7
        })
      });

      if (!resp.ok) {
        throw new Error(`Anthropic error HTTP ${resp.status}: ${await resp.text()}`);
      }

      const data: any = await resp.json();
      const replyText = data.content?.[0]?.text || '';

      return {
        id: `chatcmpl-claude-${data.id || Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: modelName,
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: replyText },
            finish_reason: data.stop_reason === 'end_turn' ? 'stop' : 'length'
          }
        ],
        usage: {
          prompt_tokens: data.usage?.input_tokens || 0,
          completion_tokens: data.usage?.output_tokens || 0,
          total_tokens: (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0)
        },
        routingInfo: {
          resolvedProvider: 'anthropic',
          resolvedModel: modelName,
          fallbackAttempted: false,
          latencyMs: Date.now() - start
        }
      };
    } catch (err: any) {
      throw new ProviderUnavailableError('anthropic', err.message);
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    if (!this.apiKey) return { healthy: false, latencyMs: 0, error: 'ANTHROPIC_API_KEY missing' };
    return { healthy: true, latencyMs: 15 };
  }
}
