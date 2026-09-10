import { ProviderAdapter } from './adapter.js';
import { ChatCompletionRequest, ChatCompletionResponse, EmbeddingRequest, EmbeddingResponse } from '../types.js';
import { ProviderUnavailableError } from '../errors.js';

export class OpenAIAdapter implements ProviderAdapter {
  public id = 'openai';
  public name = 'OpenAI Cloud Adapter';
  public supportsStreaming = true;

  constructor(
    private apiKey: string = process.env.OPENAI_API_KEY || '',
    private baseUrl: string = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
  ) {}

  async complete(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.apiKey) {
      throw new ProviderUnavailableError('openai', 'OPENAI_API_KEY is not configured on the host.');
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
        const errorBody = await resp.text();
        throw new Error(`OpenAI responded with HTTP ${resp.status}: ${errorBody}`);
      }

      const data: any = await resp.json();
      data.routingInfo = {
        resolvedProvider: 'openai',
        resolvedModel: request.model,
        fallbackAttempted: false,
        latencyMs: Date.now() - start
      };
      return data as ChatCompletionResponse;
    } catch (err: any) {
      throw new ProviderUnavailableError('openai', err.message);
    }
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    if (!this.apiKey) {
      throw new ProviderUnavailableError('openai', 'OPENAI_API_KEY is not configured.');
    }
    const endpoint = `${this.baseUrl.replace(/\/+$/, '')}/embeddings`;
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(request)
    });
    if (!resp.ok) {
      throw new Error(`OpenAI embeddings failed: ${await resp.text()}`);
    }
    return (await resp.json()) as EmbeddingResponse;
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    if (!this.apiKey) return { healthy: false, latencyMs: 0, error: 'OPENAI_API_KEY missing' };
    const start = Date.now();
    try {
      const resp = await fetch(`${this.baseUrl.replace(/\/+$/, '')}/models`, {
        headers: { Authorization: `Bearer ${this.apiKey}` }
      });
      return { healthy: resp.ok, latencyMs: Date.now() - start };
    } catch (err: any) {
      return { healthy: false, latencyMs: Date.now() - start, error: err.message };
    }
  }
}
