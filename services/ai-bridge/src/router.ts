import { ProviderAdapter } from './adapters/adapter.js';
import { GeminiAdapter } from './adapters/gemini.js';
import { OpenAIAdapter } from './adapters/openai.js';
import { AnthropicAdapter } from './adapters/anthropic.js';
import { OllamaAdapter } from './adapters/ollama.js';
import { GenericOpenAICompatibleAdapter } from './adapters/generic.js';
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  EmbeddingRequest,
  EmbeddingResponse,
  AIModelInfo,
  AICapability
} from './types.js';
import { ModelNotFoundError, ProviderUnavailableError } from './errors.js';
import { getPlatformAIProviders } from '../../../config/ai-providers.js';

export interface RouterConfig {
  mode: 'auto' | 'local_first' | 'cloud_first' | 'lowest_cost' | 'highest_quality';
  preferredProvider?: string;
  fallbackEnabled: boolean;
}

export class ModelRouter {
  private adapters: Map<string, ProviderAdapter> = new Map();
  private config: RouterConfig;

  constructor(config?: Partial<RouterConfig>) {
    this.config = {
      mode: (process.env.AI_ROUTER_MODE as any) || 'auto',
      preferredProvider: process.env.AI_PREFERRED_PROVIDER,
      fallbackEnabled: true,
      ...config
    };

    this.registerAdapters();
  }

  private registerAdapters() {
    this.adapters.set('gemini', new GeminiAdapter());
    this.adapters.set('openai', new OpenAIAdapter());
    this.adapters.set('anthropic', new AnthropicAdapter());
    this.adapters.set('ollama', new OllamaAdapter());
    this.adapters.set('generic', new GenericOpenAICompatibleAdapter());
  }

  public getAdapter(providerId: string): ProviderAdapter | undefined {
    return this.adapters.get(providerId);
  }

  /**
   * Discovers capability needed from request
   */
  private detectRequiredCapability(request: ChatCompletionRequest): AICapability {
    // 1. Vision: Check if any content part contains image_url
    for (const msg of request.messages) {
      if (Array.isArray(msg.content)) {
        for (const part of msg.content) {
          if (part.type === 'image_url') return 'vision';
        }
      }
    }

    // 2. Code detection: Inspect system or user instructions
    const combinedText = request.messages.map(m => typeof m.content === 'string' ? m.content : '').join(' ').toLowerCase();
    if (combinedText.includes('code') || combinedText.includes('typescript') || combinedText.includes('python') || combinedText.includes('function') || combinedText.includes('refactor')) {
      return 'code';
    }

    // 3. Reasoning detection: high complexity or thinking requested
    if (request.model.includes('o1') || request.model.includes('o3') || request.model.includes('r1') || combinedText.includes('step by step') || combinedText.includes('deep thought')) {
      return 'reasoning';
    }

    return 'chat';
  }

  /**
   * Determines ordered list of (provider, model) pairs to attempt
   */
  public resolveRoutingPlan(request: ChatCompletionRequest): { provider: string; model: string }[] {
    const requestedModel = (request.model || 'auto').toLowerCase();
    const capability = this.detectRequiredCapability(request);
    const providers = getPlatformAIProviders();
    const candidates: { provider: string; model: string; priority: number }[] = [];

    // Explicit model matching
    if (requestedModel.startsWith('gemini') || requestedModel.includes('flash') || requestedModel.includes('pro')) {
      candidates.push({ provider: 'gemini', model: request.model, priority: 100 });
    } else if (requestedModel.startsWith('gpt-') || requestedModel.startsWith('o1') || requestedModel.startsWith('o3')) {
      candidates.push({ provider: 'openai', model: request.model, priority: 100 });
    } else if (requestedModel.startsWith('claude-')) {
      candidates.push({ provider: 'anthropic', model: request.model, priority: 100 });
    } else if (requestedModel.startsWith('ollama/') || requestedModel.includes('llama') || requestedModel.includes('qwen')) {
      candidates.push({ provider: 'ollama', model: request.model.replace('ollama/', ''), priority: 100 });
    }

    // Capability-based auto additions
    for (const p of providers) {
      if (!p.enabled) continue;
      const matchingModel = p.models.find(m => m.capabilities.includes(capability));
      if (matchingModel) {
        let prio = 50;
        if (this.config.mode === 'local_first' && p.type === 'ollama') prio += 40;
        if (this.config.mode === 'lowest_cost' && matchingModel.costTier === 'free') prio += 40;
        if (this.config.mode === 'lowest_cost' && matchingModel.costTier === 'low') prio += 20;
        candidates.push({ provider: p.type, model: matchingModel.id, priority: prio });
      }
    }

    // Always ensure robust fallbacks in plan
    candidates.push({ provider: 'gemini', model: 'gemini-3.6-flash', priority: 10 });
    candidates.push({ provider: 'openai', model: 'gpt-4o-mini', priority: 5 });
    candidates.push({ provider: 'ollama', model: 'llama3.2', priority: 1 });

    // Deduplicate preserving highest priority
    const seen = new Set<string>();
    const sorted = candidates.sort((a, b) => b.priority - a.priority);
    const result: { provider: string; model: string }[] = [];

    for (const c of sorted) {
      const key = `${c.provider}:${c.model}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push({ provider: c.provider, model: c.model });
      }
    }

    return result;
  }

  /**
   * Route completion with automatic fallback chain
   */
  async routeCompletion(request: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    const plan = this.resolveRoutingPlan(request);
    const errors: string[] = [];
    let fallbackOccurred = false;

    // Critical invariant: Do not attempt multiple providers if request has tools and has already produced side-effects
    for (let i = 0; i < plan.length; i++) {
      const attempt = plan[i];
      const adapter = this.adapters.get(attempt.provider);

      if (!adapter) continue;

      try {
        const tailoredRequest: ChatCompletionRequest = {
          ...request,
          model: attempt.model
        };

        const response = await adapter.complete(tailoredRequest);
        if (fallbackOccurred && response.routingInfo) {
          response.routingInfo.fallbackAttempted = true;
        }
        return response;
      } catch (err: any) {
        fallbackOccurred = true;
        errors.push(`[${attempt.provider}/${attempt.model}]: ${err.message || String(err)}`);

        // If fallback disabled by caller, abort immediately
        if (!this.config.fallbackEnabled) {
          throw err;
        }
      }
    }

    // If all providers failed, throw unified comprehensive error
    throw new ProviderUnavailableError(
      'all_providers',
      `All attempted AI providers failed. Diagnostics:\n${errors.join('\n')}`
    );
  }

  /**
   * Route embedding request
   */
  async routeEmbedding(request: EmbeddingRequest): Promise<EmbeddingResponse> {
    const preferred = [this.adapters.get('openai'), this.adapters.get('gemini'), this.adapters.get('ollama')];

    for (const adapter of preferred) {
      if (adapter && adapter.embed) {
        try {
          return await adapter.embed(request);
        } catch {
          continue;
        }
      }
    }

    throw new ProviderUnavailableError('embeddings', 'No embedding-capable AI provider is currently reachable.');
  }

  /**
   * Retrieve aggregated catalog of all active platform models
   */
  async getAvailableModels(): Promise<AIModelInfo[]> {
    const providers = getPlatformAIProviders();
    const catalog: AIModelInfo[] = [];

    for (const p of providers) {
      for (const m of p.models) {
        catalog.push({
          id: m.id,
          object: 'model',
          created: 1710000000,
          owned_by: p.name,
          capabilities: m.capabilities,
          costTier: m.costTier,
          provider: p.type,
          healthy: p.enabled
        });
      }
    }

    return catalog;
  }
}

export const modelRouter = new ModelRouter();
