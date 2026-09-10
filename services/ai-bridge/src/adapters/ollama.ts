import { ProviderAdapter } from './adapter.js';
import { ChatCompletionRequest, ChatCompletionResponse, EmbeddingRequest, EmbeddingResponse } from '../types.js';
import { ProviderUnavailableError } from '../errors.js';

export class OllamaAdapter implements ProviderAdapter {
  public id = 'ollama';
  public name = 'Local Ollama Daemon';
  public supportsStreaming = true;

  constructor(private baseUrl: string = process.env.OLLAMA_URL || 'http://localhost:11434') {}

  async complete(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const start = Date.now();
    const endpoint = `${this.baseUrl.replace(/\/+$/, '')}/api/chat`;

    // Map messages
    const messages = request.messages.map((m) => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
    }));

    const modelName = request.model.startsWith('ollama/') 
      ? request.model.replace('ollama/', '') 
      : (request.model || 'llama3.2');

    try {
      const resp = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          messages,
          stream: false,
          options: {
            temperature: request.temperature ?? 0.7,
            num_predict: request.max_tokens ?? 2048
          }
        })
      });

      if (!resp.ok) {
        throw new Error(`Ollama daemon returned HTTP ${resp.status}: ${await resp.text()}`);
      }

      const data: any = await resp.json();
      const reply = data.message?.content || '';

      return {
        id: `chatcmpl-ollama-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: modelName,
        choices: [
          {
            index: 0,
            message: { role: 'assistant', content: reply },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: data.prompt_eval_count || 10,
          completion_tokens: data.eval_count || 20,
          total_tokens: (data.prompt_eval_count || 10) + (data.eval_count || 20)
        },
        routingInfo: {
          resolvedProvider: 'ollama',
          resolvedModel: modelName,
          fallbackAttempted: false,
          latencyMs: Date.now() - start
        }
      };
    } catch (err: any) {
      throw new ProviderUnavailableError('ollama', `Connection to Ollama failed at ${this.baseUrl}: ${err.message}`);
    }
  }

  async embed(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const endpoint = `${this.baseUrl.replace(/\/+$/, '')}/api/embeddings`;
    const prompt = Array.isArray(request.input) ? request.input[0] : request.input;
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: request.model || 'nomic-embed-text',
        prompt
      })
    });
    if (!resp.ok) {
      throw new Error(`Ollama embedding error: ${await resp.text()}`);
    }
    const data: any = await resp.json();
    return {
      object: 'list',
      data: [{ object: 'embedding', embedding: data.embedding || [], index: 0 }],
      model: request.model,
      usage: { prompt_tokens: 10, total_tokens: 10 }
    };
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    const start = Date.now();
    try {
      const resp = await fetch(`${this.baseUrl.replace(/\/+$/, '')}/api/tags`, { method: 'GET' });
      return { healthy: resp.ok, latencyMs: Date.now() - start };
    } catch (err: any) {
      return { healthy: false, latencyMs: Date.now() - start, error: err.message };
    }
  }
}
