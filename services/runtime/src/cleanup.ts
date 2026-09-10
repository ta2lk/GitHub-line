import { sandboxedRuntimeManager } from './index.js';
import { createLogger } from '../../../packages/logger/src/index.js';

const logger = createLogger('CleanupWorker');

export interface CleanupPolicy {
  maxInactiveRuntimeMs: number; // e.g. 15 minutes
  intervalMs: number;           // check interval
}

export class CleanupWorker {
  private timer: NodeJS.Timeout | null = null;
  private readonly policy: CleanupPolicy;

  constructor(policy: Partial<CleanupPolicy> = {}) {
    this.policy = {
      maxInactiveRuntimeMs: policy.maxInactiveRuntimeMs ?? 15 * 60 * 1000,
      intervalMs: policy.intervalMs ?? 60 * 1000
    };
  }

  public start(): void {
    if (this.timer) return;
    logger.info(`Starting background cleanup reaper (interval: ${this.policy.intervalMs / 1000}s)`);
    this.timer = setInterval(() => this.reap(), this.policy.intervalMs);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
      logger.info('Cleanup reaper stopped.');
    }
  }

  public async reap(): Promise<number> {
    const runtimes = sandboxedRuntimeManager.list();
    const now = Date.now();
    let reapedCount = 0;

    for (const rt of runtimes) {
      const lastActive = new Date(rt.lastActivity || rt.startedAt).getTime();
      const inactiveDuration = now - lastActive;

      if (inactiveDuration > this.policy.maxInactiveRuntimeMs || rt.status === 'FAILED') {
        logger.info(`Reaping inactive runtime ${rt.id} (inactive for ${Math.round(inactiveDuration / 1000)}s)`);
        await sandboxedRuntimeManager.destroy(rt.id);
        reapedCount++;
      }
    }

    return reapedCount;
  }
}

export const cleanupWorker = new CleanupWorker();
