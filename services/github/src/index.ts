import { createLogger } from '../../../packages/logger/src/index.js';

const logger = createLogger('GitHubProvider');

export interface GitHubRepoDetails {
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  isPrivate: boolean;
  description: string;
  htmlUrl: string;
  topics?: string[];
  stars?: number;
  homepage?: string;
  language?: string;
}

export interface TreeFile {
  path: string;
  type: 'blob' | 'tree';
  size?: number;
}

export class GitHubSecurityException extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GitHubSecurityException';
  }
}

export class GitHubProvider {
  /**
   * SSRF and Protocol Validator (Rules 15 & 100)
   * Disallows internal IPs, localhost, AWS/GCP metadata IPs, non-HTTP/HTTPS protocols
   */
  static validateUrl(urlStr: string): { valid: boolean; error?: string; owner?: string; repo?: string } {
    if (!urlStr || typeof urlStr !== 'string') {
      return { valid: false, error: 'Repository URL is required.' };
    }

    const trimmed = urlStr.trim();

    // Check protocol
    if (!trimmed.startsWith('https://') && !trimmed.startsWith('http://')) {
      return { valid: false, error: 'Only HTTP and HTTPS URLs are allowed. Non-HTTP protocols are blocked for security.' };
    }

    try {
      const parsed = new URL(trimmed);
      const hostname = parsed.hostname.toLowerCase();

      // Block local/private IPs and internal names (SSRF mitigation)
      const blockedHosts = [
        'localhost',
        '127.0.0.1',
        '0.0.0.0',
        '::1',
        '169.254.169.254', // Cloud metadata
        'metadata.google.internal',
        'instance-data'
      ];

      if (blockedHosts.includes(hostname) || hostname.endsWith('.local') || hostname.endsWith('.internal')) {
        return { valid: false, error: 'SSRF Protection: Access to private networks, loopback, or metadata services is strictly forbidden.' };
      }

      // Check private IP ranges
      const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
      const ipMatch = hostname.match(ipv4Regex);
      if (ipMatch) {
        const first = parseInt(ipMatch[1], 10);
        const second = parseInt(ipMatch[2], 10);
        if (
          first === 10 || // 10.0.0.0/8
          (first === 172 && second >= 16 && second <= 31) || // 172.16.0.0/12
          (first === 192 && second === 168) || // 192.168.0.0/16
          (first === 169 && second === 254) // Link-local / metadata
        ) {
          return { valid: false, error: 'SSRF Protection: Private subnet IP addresses cannot be accessed.' };
        }
      }

      // Extract owner and repo for github.com
      if (hostname === 'github.com' || hostname.endsWith('.github.com')) {
        const segments = parsed.pathname.split('/').filter(Boolean);
        if (segments.length >= 2) {
          const owner = segments[0];
          const repo = segments[1].replace(/\.git$/, '');
          return { valid: true, owner, repo };
        }
      }

      return { valid: true, owner: 'custom', repo: parsed.pathname.split('/').filter(Boolean).pop() || 'repo' };
    } catch (e: any) {
      return { valid: false, error: `Invalid URL format: ${e.message}` };
    }
  }

  /**
   * Fetch repository metadata
   */
  async getRepository(owner: string, repo: string): Promise<GitHubRepoDetails> {
    logger.info(`Validating repository ${owner}/${repo}`);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2500);
      const resp = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: {
          'User-Agent': 'Git2Live-ControlPlane/1.0',
          Accept: 'application/vnd.github.v3+json'
        },
        redirect: 'follow',
        signal: controller.signal
      });
      clearTimeout(timeout);

      if (resp.ok) {
        const data = await resp.json();
        return {
          owner: data.owner?.login || owner,
          name: data.name || repo,
          fullName: data.full_name || `${owner}/${repo}`,
          defaultBranch: data.default_branch || 'main',
          isPrivate: !!data.private,
          description: data.description || `Repository ${owner}/${repo}`,
          htmlUrl: data.html_url || `https://github.com/${owner}/${repo}`,
          topics: Array.isArray(data.topics) ? data.topics : [],
          stars: data.stargazers_count || 0,
          homepage: data.homepage || '',
          language: data.language || ''
        };
      }
    } catch (e) {
      logger.warn(`GitHub API request failed, falling back to heuristic parsing: ${e}`);
    }

    // Default fallback representation
    return {
      owner,
      name: repo,
      fullName: `${owner}/${repo}`,
      defaultBranch: 'main',
      isPrivate: false,
      description: `Repository ${owner}/${repo}`,
      htmlUrl: `https://github.com/${owner}/${repo}`,
      topics: [],
      stars: 0,
      homepage: '',
      language: ''
    };
  }

  /**
   * Fetch raw file from repository with branch awareness and timeout
   */
  async getFile(owner: string, repo: string, path: string, branch = 'main'): Promise<string | null> {
    const urls = [
      `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`,
      branch !== 'main' ? `https://raw.githubusercontent.com/${owner}/${repo}/main/${path}` : null,
      branch !== 'master' ? `https://raw.githubusercontent.com/${owner}/${repo}/master/${path}` : null
    ].filter(Boolean) as string[];

    for (const url of urls) {
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2000);
        const res = await fetch(url, {
          headers: { 'User-Agent': 'Git2Live' },
          signal: controller.signal
        });
        clearTimeout(timeout);
        if (res.ok) {
          return await res.text();
        }
      } catch (e) {
        // continue to next URL
      }
    }

    return null;
  }
}

export const gitHubProvider = new GitHubProvider();
