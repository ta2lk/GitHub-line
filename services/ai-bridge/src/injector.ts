import { AIRequirements } from './types.js';

export interface InjectedEnvironment {
  [key: string]: string;
}

export class AIBridgeInjector {
  /**
   * Constructs sandboxed environment variables for container runtime.
   * Directs all outbound LLM network traffic through the local AI Bridge proxy.
   */
  public generateEnvironment(
    requirements: AIRequirements,
    bridgeHost = 'http://host.docker.internal:8080'
  ): InjectedEnvironment {
    const env: InjectedEnvironment = {};

    if (!requirements.required) {
      return env;
    }

    const bridgeV1 = `${bridgeHost.replace(/\/+$/, '')}/v1`;

    // 1. OpenAI SDK / LangChain / LlamaIndex redirection
    env['OPENAI_BASE_URL'] = bridgeV1;
    env['OPENAI_API_BASE'] = bridgeV1;
    const bridgeToken = process.env.AI_BRIDGE_TOKEN;
    if (!bridgeToken) {
      throw new Error('AI_BRIDGE_TOKEN must be configured before enabling AI access for a project.');
    }
    env['OPENAI_API_KEY'] = bridgeToken;

    // 2. Anthropic SDK redirection
    env['ANTHROPIC_BASE_URL'] = bridgeV1;
    env['ANTHROPIC_API_KEY'] = bridgeToken;

    // 3. Ollama SDK redirection
    env['OLLAMA_HOST'] = bridgeHost;
    env['OLLAMA_ORIGINS'] = '*';

    // 4. Groq / Together / OpenRouter compatibility
    env['GROQ_API_BASE'] = bridgeV1;
    env['GROQ_API_KEY'] = bridgeToken;
    env['TOGETHER_BASE_URL'] = bridgeV1;
    env['TOGETHER_API_KEY'] = bridgeToken;
    env['OPENROUTER_BASE_URL'] = bridgeV1;
    env['OPENROUTER_API_KEY'] = bridgeToken;

    // 5. Standard Unified Platform Variables
    env['AI_GATEWAY_URL'] = bridgeV1;
    env['AI_BRIDGE_ACTIVE'] = 'true';
    env['AI_ROUTER_MODE'] = process.env.AI_ROUTER_MODE || 'auto';

    return env;
  }
}

export const aiInjector = new AIBridgeInjector();
