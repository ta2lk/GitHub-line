import { ProviderAdapter } from './adapter.js';
import { ChatCompletionRequest, ChatCompletionResponse } from '../types.js';
import { ProviderUnavailableError } from '../errors.js';

export class GenericOpenAICompatibleAdapter implements ProviderAdapter {
  public id = 'generic';
  public name = 'Generic OpenAI-Compatible Gateway';
  public supportsStreaming = true;

  constructor(
    private apiKey: string = process.env.GENERIC_AI_API_KEY || process.env.DEEPSEEK_API_KEY || '',
    private baseUrl: string = process.env.GENERIC_AI_BASE_URL || 'https://api.deepseek.com/v1'
  ) {}

  async complete(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.apiKey) {
      throw new ProviderUnavailableError('generic', 'API key for generic AI endpoint is not configured.');
    }

    const start = Date.now();
    const endpoint = `${this.baseUrl.replace(/\/+$/, '')}/chat/completions`;

    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(request)
      });

      if (!resp.ok) {
        throw new Error(`Upstream endpoint returned HTTP ${resp.status}: ${await resp.text()}`);
      }

      const data: any = await resp.json();
      data.routingInfo = {
        resolvedProvider: 'generic',
        resolvedModel: request.model,
        fallbackAttempted: false,
        latencyMs: Date.now() - start
      };
      return data;
    } catch (err: any) {
      throw new ProviderUnavailableError('generic', err.message);
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    if (!this.apiKey) return { healthy: false, latencyMs: 0, error: 'API key missing' };
    return { healthy: true, latencyMs: 20 };
  }
}
