import { sandboxedRuntimeManager } from '../../runtime/src/index.js';
import { createLogger } from '../../../packages/logger/src/index.js';

const logger = createLogger('CleanupWorker');

export class CleanupWorker {
  private intervalId: NodeJS.Timeout | null = null;
  private idleTimeoutMs = 30 * 60 * 1000; // 30 minutes configurable

  start(intervalMs = 60000) {
    logger.info(`Starting background cleanup daemon with check interval ${intervalMs}ms`);
    this.intervalId = setInterval(() => {
      this.runCleanupCycle();
    }, intervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async runCleanupCycle(): Promise<{ stoppedRuntimes: number; cleanedWorkspaces: number }> {
    const now = Date.now();
    let stoppedCount = 0;

    const runtimes = sandboxedRuntimeManager.list();
    for (const rt of runtimes) {
      if (rt.status === 'RUNNING') {
        const lastActive = new Date(rt.lastActivity).getTime();
        if (now - lastActive > this.idleTimeoutMs) {
          logger.info(`Stopping idle runtime ${rt.id} (inactive for >${this.idleTimeoutMs / 60000}m)`);
          await sandboxedRuntimeManager.stop(rt.id);
          stoppedCount++;
        }
      }
    }

    return { stoppedRuntimes: stoppedCount, cleanedWorkspaces: 0 };
  }
}

export const cleanupWorker = new CleanupWorker();
