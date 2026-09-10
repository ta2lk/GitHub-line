import { ChatCompletionRequest, ToolDefinition } from './types.js';
import { PolicyViolationError, RateLimitExceededError } from './errors.js';

export interface SecurityPolicyConfig {
  maxTokensPerRequest: number;
  blockedTools: string[];
  maxCallsPerMinute: number;
  requestTimeoutMs: number;
}

export const defaultSecurityPolicy: SecurityPolicyConfig = {
  maxTokensPerRequest: 8192,
  blockedTools: [
    'rm_rf',
    'exec_host_command',
    'access_docker_socket',
    'dump_secrets',
    'read_host_file',
    'eval_root_bash'
  ],
  maxCallsPerMinute: 60,
  requestTimeoutMs: 30000
};

export class AIBridgePolicyEngine {
  private callCounts: Map<string, { count: number; windowStart: number }> = new Map();

  constructor(private config: SecurityPolicyConfig = defaultSecurityPolicy) {}

  validateRequest(req: ChatCompletionRequest, clientId = 'default'): void {
    // 1. Rate Limiting Check
    this.enforceRateLimit(clientId);

    // 2. Token Limit Check
    if (req.max_tokens && req.max_tokens > this.config.maxTokensPerRequest) {
      req.max_tokens = this.config.maxTokensPerRequest;
    }

    // 3. Tool Safety Check
    if (req.tools && Array.isArray(req.tools)) {
      for (const tool of req.tools) {
        this.inspectTool(tool);
      }
    }
  }

  private inspectTool(tool: ToolDefinition): void {
    const fnName = tool.function?.name?.toLowerCase() || '';
    for (const blocked of this.config.blockedTools) {
      if (fnName.includes(blocked)) {
        throw new PolicyViolationError(`Tool function '${tool.function.name}' is blocked by Git2Live AI Security Sandbox.`);
      }
    }
  }

  private enforceRateLimit(clientId: string): void {
    const now = Date.now();
    const record = this.callCounts.get(clientId);

    if (!record || now - record.windowStart > 60000) {
      this.callCounts.set(clientId, { count: 1, windowStart: now });
      return;
    }

    if (record.count >= this.config.maxCallsPerMinute) {
      throw new RateLimitExceededError(`Client rate limit of ${this.config.maxCallsPerMinute} req/min exceeded.`);
    }

    record.count++;
  }
}

export const policyEngine = new AIBridgePolicyEngine();
