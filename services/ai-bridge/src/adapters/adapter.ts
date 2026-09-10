import { ChatCompletionRequest, ChatCompletionResponse, EmbeddingRequest, EmbeddingResponse } from '../types.js';

export interface ProviderAdapter {
  id: string;
  name: string;
  supportsStreaming: boolean;
  complete(request: ChatCompletionRequest): Promise<ChatCompletionResponse>;
  embed?(request: EmbeddingRequest): Promise<EmbeddingResponse>;
  healthCheck(): Promise<{ healthy: boolean; latencyMs: number; error?: string }>;
}
