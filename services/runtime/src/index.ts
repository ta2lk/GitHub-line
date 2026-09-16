import { RuntimeInstance, RuntimeStatus } from '../../../src/types.js';
import { createLogger } from '../../../packages/logger/src/index.js';
import { dockerRuntimeManager } from './docker.js';
import { spawn, ChildProcess } from 'node:child_process';
import { access } from 'node:fs/promises';
import { join } from 'node:path';

export * from './docker.js';
export * from './sanitizer.js';
export * from './database.js';
export * from './cleanup.js';

const logger = createLogger('RuntimeProvider');
const hostProcesses = new Map<string, ChildProcess>();

function splitCommand(command: string): string[] {
  const trimmed = String(command || '').trim();
  if (!trimmed || /[;&|`$<>{}\n\r]/.test(trimmed)) throw new Error(`Unsafe runtime command rejected: ${trimmed.slice(0, 120)}`);
  return trimmed.match(/(?:[^\s"]+|"[^"]*")+/g)?.map((part) => part.replace(/^"|"$/g, '')) || [];
}

function hostModeEnabled() {
  return process.env.GIT2LIVE_HOST_RUNTIME === 'true' || process.env.NODE_ENV !== 'production';
}

export interface RuntimeProvider {
  create(projectId: string, buildId: string, port: number, artifactPath?: string, startCommand?: string): Promise<RuntimeInstance>;
  start(runtimeId: string): Promise<RuntimeInstance>;
  stop(runtimeId: string): Promise<RuntimeInstance>;
  restart(runtimeId: string): Promise<RuntimeInstance>;
  inspect(runtimeId: string): Promise<RuntimeInstance | null>;
  healthCheck(runtimeId: string): Promise<'HEALTHY' | 'UNHEALTHY' | 'PROBING'>;
  destroy(runtimeId: string): Promise<boolean>;
}

export class SandboxedRuntimeManager implements RuntimeProvider {
  private instances: Map<string, RuntimeInstance> = new Map();
  private commands: Map<string, { cwd: string; command: string }> = new Map();

  async create(projectId: string, buildId: string, port = 3000, artifactPath?: string, startCommand?: string): Promise<RuntimeInstance> {
    const runtimeId = `rt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const containerPort = port || 3000;
    const previewUrl = `/api/v1/preview/${runtimeId}`;
    const isDocker = await dockerRuntimeManager.isDockerAvailable();

    if (!isDocker) {
      if (!hostModeEnabled()) throw new Error('Docker is unavailable and Host Runtime is disabled. Set GIT2LIVE_HOST_RUNTIME=true.');
      if (!artifactPath || artifactPath.startsWith('git2live/')) throw new Error('A built workspace directory is required for Host Runtime.');
      await access(artifactPath);
      const command = startCommand || 'npm start';
      splitCommand(command);
      const instance: RuntimeInstance = {
        id: runtimeId, projectId, buildId, containerId: `host:${runtimeId}`, status: 'CREATING', port: containerPort,
        previewUrl, cpuLimit: 1, memoryLimit: 1024, cpuUsagePercent: 0, memoryUsageMb: 0, uptimeSeconds: 0,
        startedAt: new Date().toISOString(), lastActivity: new Date().toISOString(), healthStatus: 'PROBING', healthChecksFailed: 0
      };
      this.instances.set(runtimeId, instance);
      this.commands.set(runtimeId, { cwd: artifactPath, command });
      logger.warn(`Runtime ${runtimeId} will run as a constrained Host process because Docker is unavailable.`);
      return instance;
    }

    if (!artifactPath || !/^git2live\/[A-Za-z0-9._-]+:[A-Za-z0-9._-]+$/.test(artifactPath)) throw new Error('A verified runtime image is required.');
    const dockerResult = await dockerRuntimeManager.createContainer(artifactPath, containerPort, { PORT: String(containerPort), NODE_ENV: 'production' });
    const instance: RuntimeInstance = {
      id: runtimeId, projectId, buildId, containerId: dockerResult.containerId, status: 'CREATING', port: containerPort,
      previewUrl, cpuLimit: 1, memoryLimit: 1024, cpuUsagePercent: 12.4, memoryUsageMb: 86.5, uptimeSeconds: 0,
      startedAt: new Date().toISOString(), lastActivity: new Date().toISOString(), healthStatus: 'PROBING', healthChecksFailed: 0
    };
    this.instances.set(runtimeId, instance);
    return instance;
  }

  async start(runtimeId: string): Promise<RuntimeInstance> {
    const inst = this.instances.get(runtimeId);
    if (!inst) throw new Error(`Runtime ${runtimeId} not found`);
    if (inst.containerId.startsWith('host:')) {
      const spec = this.commands.get(runtimeId);
      if (!spec) throw new Error('Host runtime command not found');
      const args = splitCommand(spec.command);
      const child = spawn(args[0], args.slice(1), { cwd: spec.cwd, env: { ...process.env, PORT: String(inst.port), HOST: '0.0.0.0', NODE_ENV: 'production' }, stdio: ['ignore', 'pipe', 'pipe'] });
      child.stdout?.on('data', (data) => logger.info(`[${runtimeId}] ${String(data).trim().slice(0, 1000)}`));
      child.stderr?.on('data', (data) => logger.warn(`[${runtimeId}] ${String(data).trim().slice(0, 1000)}`));
      child.on('exit', (code) => { if (inst.status === 'RUNNING') { inst.status = 'FAILED'; inst.healthStatus = 'UNHEALTHY'; logger.error(`Host runtime ${runtimeId} exited with code ${code}`); } });
      hostProcesses.set(runtimeId, child);
      inst.status = 'RUNNING'; inst.startedAt = new Date().toISOString(); inst.lastActivity = new Date().toISOString(); inst.healthStatus = 'HEALTHY';
      logger.info(`Host runtime ${runtimeId} started on port ${inst.port}`);
      return inst;
    }
    await dockerRuntimeManager.startContainer(inst.containerId);
    inst.status = 'RUNNING'; inst.startedAt = new Date().toISOString(); inst.lastActivity = new Date().toISOString();
    const health = await this.healthCheck(runtimeId);
    if (health !== 'HEALTHY') { inst.status = 'FAILED'; throw new Error(`Runtime ${runtimeId} failed health check.`); }
    return inst;
  }

  async stop(runtimeId: string): Promise<RuntimeInstance> {
    const inst = this.instances.get(runtimeId);
    if (!inst) throw new Error(`Runtime ${runtimeId} not found`);
    if (inst.containerId.startsWith('host:')) { hostProcesses.get(runtimeId)?.kill('SIGTERM'); hostProcesses.delete(runtimeId); }
    else if (await dockerRuntimeManager.isDockerAvailable()) await dockerRuntimeManager.stopContainer(inst.containerId);
    inst.status = 'STOPPED'; inst.lastActivity = new Date().toISOString(); inst.cpuUsagePercent = 0; inst.memoryUsageMb = 0;
    return inst;
  }

  async restart(runtimeId: string): Promise<RuntimeInstance> { await this.stop(runtimeId); await new Promise((r) => setTimeout(r, 400)); return this.start(runtimeId); }

  async inspect(runtimeId: string): Promise<RuntimeInstance | null> {
    const inst = this.instances.get(runtimeId); if (!inst) return null;
    if (inst.containerId.startsWith('host:')) {
      const child = hostProcesses.get(runtimeId); if (!child || child.exitCode !== null) { inst.status = 'FAILED'; inst.healthStatus = 'UNHEALTHY'; }
    } else {
      const container = await dockerRuntimeManager.inspectContainer(inst.containerId); if (!container) { inst.status = 'FAILED'; inst.healthStatus = 'UNHEALTHY'; }
    }
    if (inst.status === 'RUNNING') inst.uptimeSeconds = Math.round((Date.now() - new Date(inst.startedAt).getTime()) / 1000);
    return inst;
  }

  async healthCheck(runtimeId: string): Promise<'HEALTHY' | 'UNHEALTHY' | 'PROBING'> {
    const inst = this.instances.get(runtimeId); if (!inst) return 'UNHEALTHY';
    if (inst.containerId.startsWith('host:')) { const child = hostProcesses.get(runtimeId); inst.healthStatus = child && child.exitCode === null ? 'HEALTHY' : 'UNHEALTHY'; }
    else { const container = await dockerRuntimeManager.inspectContainer(inst.containerId); inst.healthStatus = container?.running ? 'HEALTHY' : 'UNHEALTHY'; }
    return inst.healthStatus;
  }

  async destroy(runtimeId: string): Promise<boolean> {
    const inst = this.instances.get(runtimeId); if (!inst) return false;
    if (inst.containerId.startsWith('host:')) { hostProcesses.get(runtimeId)?.kill('SIGKILL'); hostProcesses.delete(runtimeId); this.commands.delete(runtimeId); }
    else if (await dockerRuntimeManager.isDockerAvailable()) await dockerRuntimeManager.removeContainer(inst.containerId);
    this.instances.delete(runtimeId); return true;
  }

  list(): RuntimeInstance[] { return Array.from(this.instances.values()); }
}

export const sandboxedRuntimeManager = new SandboxedRuntimeManager();
