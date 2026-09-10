/**
 * Universal AI Bridge Standard Error Formatter
 * Complies with OpenAI REST API error envelopes.
 */

export class AIBridgeError extends Error {
  public statusCode: number;
  public type: string;
  public code?: string;

  constructor(message: string, statusCode = 500, type = 'api_error', code?: string) {
    super(message);
    this.name = 'AIBridgeError';
    this.statusCode = statusCode;
    this.type = type;
    this.code = code;
  }

  toJSON() {
    return {
      error: {
        message: this.message,
        type: this.type,
        code: this.code,
        param: null
      }
    };
  }
}

export class ModelNotFoundError extends AIBridgeError {
  constructor(model: string) {
    super(`The model '${model}' does not exist or you do not have access to it.`, 404, 'invalid_request_error', 'model_not_found');
  }
}

export class ProviderUnavailableError extends AIBridgeError {
  constructor(provider: string, details?: string) {
    super(`The upstream AI provider '${provider}' is currently unavailable. ${details || ''}`.trim(), 503, 'service_unavailable', 'provider_unavailable');
  }
}

export class PolicyViolationError extends AIBridgeError {
  constructor(message: string) {
    super(message, 403, 'permission_denied', 'policy_violation');
  }
}

export class RateLimitExceededError extends AIBridgeError {
  constructor(message = 'Rate limit exceeded. Please throttle requests.') {
    super(message, 429, 'rate_limit_exceeded', 'rate_limit_exceeded');
  }
}
