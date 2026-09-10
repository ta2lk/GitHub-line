import { execFile } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import { createLogger } from '../../../packages/logger/src/index.js';
import { LogSanitizer } from './sanitizer.js';

const execFileAsync = promisify(execFile);
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
  readOnlyRootFs: true,
  dropCapabilities: ['ALL'],
  runAsUser: '1000:1000',
  network: 'none'
};

export class DockerRuntimeManager {
  private isDockerAvailableCache: boolean | null = null;

  async isDockerAvailable(): Promise<boolean> {
    if (this.isDockerAvailableCache !== null) return this.isDockerAvailableCache;
    const socketPath = process.env.DOCKER_SOCKET_PATH || '/var/run/docker.sock';
    if (!fs.existsSync(socketPath)) return (this.isDockerAvailableCache = false);
    try {
      const { stdout } = await execFileAsync('docker', ['info', '--format', '{{.ServerVersion}}'], { timeout: 3000 });
      return (this.isDockerAvailableCache = Boolean(stdout.trim()));
    } catch {
      return (this.isDockerAvailableCache = false);
    }
  }

  async createContainer(imageName: string, port: number, envVars: Record<string, string>, options: Partial<DockerSecurityOptions> = {}) {
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._:/-]{0,200}$/.test(imageName)) throw new Error('Invalid container image name.');
    if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('Invalid container port.');
    const opts = { ...defaultDockerSecurityOptions, ...options };
    const containerName = `git2live-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const args = ['create', '--name', containerName, `--cpus=${opts.cpuLimit}`, `--memory=${opts.memoryLimitMb}m`, `--pids-limit=${opts.pidsLimit}`, '--security-opt', 'no-new-privileges:true'];
    if (opts.readOnlyRootFs) args.push('--read-only');
    if (opts.network) args.push('--network', opts.network);
    for (const cap of opts.dropCapabilities || []) args.push('--cap-drop', cap);
    if (opts.runAsUser) args.push('--user', opts.runAsUser);
    // Do not publish host ports by default; the control plane must add a
    // reviewed reverse-proxy mapping when a project is actually ready.
    for (const [key, value] of Object.entries(envVars)) {
      if (!/^[A-Z_][A-Z0-9_]{0,127}$/.test(key)) throw new Error(`Invalid environment variable name: ${key}`);
      args.push('-e', `${key}=${value}`);
    }
    args.push(imageName);
    logger.info(`Creating Docker container: ${containerName}`);
    const { stdout } = await execFileAsync('docker', args, { timeout: 15000 });
    return { containerId: stdout.trim(), assignedPort: port };
  }

  async startContainer(containerId: string) { await execFileAsync('docker', ['start', containerId], { timeout: 15000 }); }
  async stopContainer(containerId: string) { try { await execFileAsync('docker', ['stop', '-t', '5', containerId], { timeout: 10000 }); } catch (err: any) { logger.warn(`Docker stop warning: ${err.message}`); } }
  async restartContainer(containerId: string) { await execFileAsync('docker', ['restart', '-t', '5', containerId], { timeout: 15000 }); }
  async removeContainer(containerId: string) { try { await execFileAsync('docker', ['rm', '-f', containerId], { timeout: 10000 }); } catch (err: any) { logger.warn(`Docker rm warning: ${err.message}`); } }

  async getLogs(containerId: string, tailLines = 100) {
    const safeTail = Math.max(1, Math.min(1000, Math.floor(tailLines)));
    try {
      const { stdout, stderr } = await execFileAsync('docker', ['logs', '--tail', String(safeTail), containerId], { timeout: 5000 });
      return LogSanitizer.sanitize(`${stdout}\n${stderr}`);
    } catch { return ''; }
  }

  async inspectContainer(containerId: string) {
    try {
      const { stdout } = await execFileAsync('docker', ['inspect', containerId], { timeout: 5000 });
      const parsed = JSON.parse(stdout)[0];
      return { running: Boolean(parsed.State?.Running), port: 3000, ip: parsed.NetworkSettings?.IPAddress || '' };
    } catch { return null; }
  }
}

export const dockerRuntimeManager = new DockerRuntimeManager();
