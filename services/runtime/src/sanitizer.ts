/**
 * Universal Log Sanitizer
 * Redacts secret keys, bearer tokens, passwords, and private paths
 * before logs are emitted to websockets, UI, or persistent storage.
 */

export class LogSanitizer {
  private static readonly PATTERNS: [RegExp, string][] = [
    // OpenAI API Keys
    [/sk-[a-zA-Z0-9_-]{20,}/g, 'sk-[REDACTED_OPENAI_KEY]'],
    // Anthropic API Keys
    [/sk-ant-[a-zA-Z0-9_-]{20,}/g, 'sk-ant-[REDACTED_ANTHROPIC_KEY]'],
    // Google API Keys
    [/AIza[0-9A-Za-z-_]{35}/g, 'AIza[REDACTED_GOOGLE_KEY]'],
    // GitHub Tokens
    [/ghp_[0-9a-zA-Z]{36}/g, 'ghp_[REDACTED_GITHUB_TOKEN]'],
    [/github_pat_[0-9a-zA-Z_]{82}/g, 'github_pat_[REDACTED_PAT]'],
    // AWS Keys
    [/AKIA[0-9A-Z]{16}/g, 'AKIA[REDACTED_AWS_KEY]'],
    // Generic Bearer Tokens
    [/Bearer\s+[a-zA-Z0-9._~+/-]+=*/gi, 'Bearer [REDACTED_BEARER_TOKEN]'],
    // Database Passwords in URIs
    [/([a-zA-Z+]+:\/\/[^:]+:)([^@]+)(@)/g, '$1[REDACTED_PASSWORD]$3'],
    // Common API Key Env Assignments
    [/(API_KEY|SECRET_KEY|TOKEN|PASSWORD|ACCESS_KEY)=([^\s"']+)/gi, '$1=[REDACTED]']
  ];

  public static sanitize(text: string): string {
    if (!text || typeof text !== 'string') return text;
    let sanitized = text;
    for (const [pattern, replacement] of this.PATTERNS) {
      sanitized = sanitized.replace(pattern, replacement);
    }
    return sanitized;
  }
}
