import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { ProviderAdapter } from './adapter.js';
import { ChatCompletionRequest, ChatCompletionResponse, EmbeddingRequest, EmbeddingResponse } from '../types.js';
import { ProviderUnavailableError } from '../errors.js';

export class GeminiAdapter implements ProviderAdapter {
  public id = 'gemini';
  public name = 'Google Gemini Adapter';
  public supportsStreaming = true;

  private client: GoogleGenAI | null = null;

  constructor(private apiKey: string = process.env.GEMINI_API_KEY || '') {
    if (this.apiKey) {
      this.client = new GoogleGenAI({ apiKey: this.apiKey });
    }
  }

  async complete(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    if (!this.client || !this.apiKey) {
      throw new ProviderUnavailableError('gemini', 'GEMINI_API_KEY is not configured on the host.');
    }

    const start = Date.now();
    let modelName = request.model.startsWith('gemini') ? request.model : 'gemini-3.6-flash';
    if (modelName === 'gemini-2.5-flash') {
      modelName = 'gemini-3.6-flash';
    }

    // Separate system messages from user/assistant conversation history
    const systemParts: string[] = [];
    const conversationTurns: { role: string; parts: { text: string }[] }[] = [];

    for (const msg of request.messages) {
      const textContent = typeof msg.content === 'string' 
        ? msg.content 
        : msg.content.map(p => p.type === 'text' ? p.text : '[Image]').join(' ');

      if (msg.role === 'system') {
        systemParts.push(textContent);
      } else {
        conversationTurns.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: textContent }]
        });
      }
    }

    if (conversationTurns.length === 0) {
      conversationTurns.push({ role: 'user', parts: [{ text: 'Hello' }] });
    }

    // Build GenAI config
    const config: any = {
      temperature: request.temperature ?? 0.7,
      maxOutputTokens: request.max_tokens ?? 2048
    };

    if (systemParts.length > 0) {
      config.systemInstruction = systemParts.join('\n\n');
    }

    // Enable low thinking for speedy responsiveness on flash models
    if (modelName.includes('flash')) {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.LOW };
    }

    try {
      let response;
      try {
        response = await this.client.models.generateContent({
          model: modelName,
          contents: conversationTurns as any,
          config
        });
      } catch (firstErr: any) {
        // Fallback to gemini-3.6-flash or gemini-3.1-flash-lite if initial model was unavailable
        if (modelName !== 'gemini-3.6-flash') {
          modelName = 'gemini-3.6-flash';
          response = await this.client.models.generateContent({
            model: modelName,
            contents: conversationTurns as any,
            config
          });
        } else {
          modelName = 'gemini-3.1-flash-lite';
          response = await this.client.models.generateContent({
            model: modelName,
            contents: conversationTurns as any,
            config
          });
        }
      }

      const replyText = response.text || '';
      const latencyMs = Date.now() - start;

      return {
        id: `chatcmpl-gemini-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: modelName,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: replyText
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: Math.ceil(JSON.stringify(request.messages).length / 4),
          completion_tokens: Math.ceil(replyText.length / 4),
          total_tokens: Math.ceil((JSON.stringify(request.messages).length + replyText.length) / 4)
        },
        routingInfo: {
          resolvedProvider: 'gemini',
          resolvedModel: modelName,
          fallbackAttempted: false,
          latencyMs
        }
      };
    } catch (err: any) {
      throw new ProviderUnavailableError('gemini', err.message || 'Gemini API call failed');
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }> {
    if (!this.apiKey || !this.client) {
      return { healthy: false, latencyMs: 0, error: 'GEMINI_API_KEY missing' };
    }
    const start = Date.now();
    try {
      await this.client.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: 'ping',
        config: { maxOutputTokens: 5 }
      });
      return { healthy: true, latencyMs: Date.now() - start };
    } catch (err: any) {
      return { healthy: false, latencyMs: Date.now() - start, error: err.message };
    }
  }
}
