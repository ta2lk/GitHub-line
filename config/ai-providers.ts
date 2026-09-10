/**
 * Git2Live Platform AI Provider Configuration
 * Centralized credentials & endpoints for the Universal AI Bridge.
 * 
 * CRITICAL SECURITY INVARIANT:
 * These credentials belong STRICTLY to the host platform.
 * They MUST NEVER be shared with or mounted into untrusted project containers.
 */

export interface AIProviderConfig {
  id: string;
  name: string;
  type: 'openai' | 'gemini' | 'anthropic' | 'ollama' | 'generic';
  baseUrl?: string;
  apiKey?: string;
  enabled: boolean;
  models: {
    id: string;
    name: string;
    capabilities: ('chat' | 'code' | 'vision' | 'embeddings' | 'reasoning')[];
    costTier: 'free' | 'low' | 'medium' | 'high';
  }[];
}

export function getPlatformAIProviders(): AIProviderConfig[] {
  const geminiKey = process.env.GEMINI_API_KEY || '';
  const openaiKey = process.env.OPENAI_API_KEY || '';
  const anthropicKey = process.env.ANTHROPIC_API_KEY || '';
  const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434';

  return [
    {
      id: 'ollama-local',
      name: 'Ollama Local Daemon',
      type: 'ollama',
      baseUrl: ollamaUrl,
      enabled: Boolean(process.env.OLLAMA_URL || process.env.ENABLE_LOCAL_OLLAMA === 'true'),
      models: [
        { id: 'llama3.2', name: 'Llama 3.2 3B', capabilities: ['chat', 'code'], costTier: 'free' },
        { id: 'qwen2.5-coder', name: 'Qwen 2.5 Coder 7B', capabilities: ['code', 'chat'], costTier: 'free' },
        { id: 'nomic-embed-text', name: 'Nomic Embed Text', capabilities: ['embeddings'], costTier: 'free' }
      ]
    },
    {
      id: 'gemini-cloud',
      name: 'Google Gemini',
      type: 'gemini',
      apiKey: geminiKey,
      baseUrl: 'https://generativelanguage.googleapis.com',
      enabled: Boolean(geminiKey),
      models: [
        { id: 'gemini-3.6-flash', name: 'Gemini 3.6 Flash', capabilities: ['chat', 'code', 'vision', 'reasoning'], costTier: 'low' },
        { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', capabilities: ['chat', 'code'], costTier: 'low' },
        { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', capabilities: ['chat', 'code', 'vision', 'reasoning'], costTier: 'low' },
        { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', capabilities: ['chat', 'code', 'vision', 'reasoning'], costTier: 'medium' },
        { id: 'text-embedding-004', name: 'Gemini Text Embedding', capabilities: ['embeddings'], costTier: 'low' }
      ]
    },
    {
      id: 'openai-cloud',
      name: 'OpenAI Platform',
      type: 'openai',
      apiKey: openaiKey,
      baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
      enabled: Boolean(openaiKey),
      models: [
        { id: 'gpt-4o', name: 'GPT-4o Omnimodel', capabilities: ['chat', 'code', 'vision', 'reasoning'], costTier: 'medium' },
        { id: 'gpt-4o-mini', name: 'GPT-4o Mini', capabilities: ['chat', 'code'], costTier: 'low' },
        { id: 'text-embedding-3-small', name: 'Embedding 3 Small', capabilities: ['embeddings'], costTier: 'low' }
      ]
    },
    {
      id: 'anthropic-cloud',
      name: 'Anthropic Claude',
      type: 'anthropic',
      apiKey: anthropicKey,
      baseUrl: 'https://api.anthropic.com/v1',
      enabled: Boolean(anthropicKey),
      models: [
        { id: 'claude-3-5-sonnet-latest', name: 'Claude 3.5 Sonnet', capabilities: ['chat', 'code', 'vision', 'reasoning'], costTier: 'medium' },
        { id: 'claude-3-5-haiku-latest', name: 'Claude 3.5 Haiku', capabilities: ['chat', 'code'], costTier: 'low' }
      ]
    }
  ];
}
