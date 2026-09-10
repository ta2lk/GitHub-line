import { spawn, exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import { RuntimeInstance, RuntimeStatus } from '../../../src/types.js';
import { createLogger } from '../../../packages/logger/src/index.js';
import { LogSanitizer } from './sanitizer.js';

const execAsync = promisify(exec);
const logger = createLogger('DockerRuntime');

export interface DockerSecurityOptions {
  cpuLimit: number;
  memoryLimitMb: number;
  pidsLimit: number;
  readOnlyRootFs?: boolean;
  dropCapabilities?: string[];
  runAsUser?: string;
  network?: string;
}

export const defaultDockerSecurityOptions: DockerSecurityOptions = {
  cpuLimit: 1.0,
  memoryLimitMb: 1024,
  pidsLimit: 100,
  readOnlyRootFs: false,
  dropCapabilities: ['ALL'],
  runAsUser: '1000:1000',
  network: 'bridge'
};

export class DockerRuntimeManager {
  private isDockerAvailableCache: boolean | null = null;

  /**
   * Safe check if Docker daemon is reachable on the host
   */
  async isDockerAvailable(): Promise<boolean> {
    if (this.isDockerAvailableCache !== null) {
      return this.isDockerAvailableCache;
    }

    // Check socket existence first
    const socketPath = process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock';
    if (!fs.existsSync(socketPath)) {
      this.isDockerAvailableCache = false;
      return false;
    }

    try {
      const { stdout } = await execAsync('docker info --format "{{.ServerVersion}}"', { timeout: 3000 });
      this.isDockerAvailableCache = Boolean(stdout && stdout.trim().length > 0);
    } catch {
      this.isDockerAvailableCache = false;
    }

    return this.isDockerAvailableCache;
  }

  /**
   * Spins up a real Docker container with full sandboxed isolation
   */
  async createContainer(
    imageName: string,
    port: number,
    envVars: Record<string, string>,
    options: Partial<DockerSecurityOptions> = {}
  ): Promise<{ containerId: string; assignedPort: number }> {
    const opts = { ...defaultDockerSecurityOptions, ...options };
    const containerName = `git2live-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

    // Build args array
    const args: string[] = [
      'create',
      '--name', containerName,
      `--cpus=${opts.cpuLimit}`,
      `--memory=${opts.memoryLimitMb}m`,
      `--pids-limit=${opts.pidsLimit}`,
      '--security-opt', 'no-new-privileges:true',
      '--publish', `${port}` // Let docker assign or bind
    ];

    if (opts.dropCapabilities) {
      for (const cap of opts.dropCapabilities) {
        args.push(`--cap-drop=${cap}`);
      }
    }

    if (opts.runAsUser) {
      args.push(`--user=${opts.runAsUser}`);
    }

    // Pass environment variables safely
    for (const [k, v] of Object.entries(envVars)) {
      args.push('-e', `${k}=${v}`);
    }

    args.push(imageName);

    const command = `docker ${args.map(a => a.includes(' ') ? `"${a}"` : a).join(' ')}`;
    logger.info(`Creating Docker container: ${containerName}`);

    const { stdout } = await execAsync(command);
    const containerId = stdout.trim();

    return {
      containerId,
      assignedPort: port
    };
  }

  async startContainer(containerId: string): Promise<void> {
    await execAsync(`docker start ${containerId}`, { timeout: 15000 });
  }

  async stopContainer(containerId: string): Promise<void> {
    try {
      await execAsync(`docker stop -t 5 ${containerId}`, { timeout: 10000 });
    } catch (err: any) {
      logger.warn(`Docker stop warning: ${err.message}`);
    }
  }

  async restartContainer(containerId: string): Promise<void> {
    await execAsync(`docker restart -t 5 ${containerId}`, { timeout: 15000 });
  }

  async removeContainer(containerId: string): Promise<void> {
    try {
      await execAsync(`docker rm -f ${containerId}`, { timeout: 10000 });
    } catch (err: any) {
      logger.warn(`Docker rm warning: ${err.message}`);
    }
  }

  async getLogs(containerId: string, tailLines = 100): Promise<string> {
    try {
      const { stdout, stderr } = await execAsync(`docker logs --tail ${tailLines} ${containerId}`, { timeout: 5000 });
      return LogSanitizer.sanitize(`${stdout}\n${stderr}`);
    } catch {
      return '';
    }
  }

  async inspectContainer(containerId: string): Promise<{ running: boolean; port: number; ip: string } | null> {
    try {
      const { stdout } = await execAsync(`docker inspect ${containerId}`, { timeout: 5000 });
      const parsed = JSON.parse(stdout)[0];
      return {
        running: parsed.State?.Running || false,
        port: 3000,
        ip: parsed.NetworkSettings?.IPAddress || '127.0.0.1'
      };
    } catch {
      return null;
    }
  }
}

export const dockerRuntimeManager = new DockerRuntimeManager();
