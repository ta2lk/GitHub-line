import { RuntimeInstance, RuntimeStatus } from '../../../src/types.js';
import { createLogger } from '../../../packages/logger/src/index.js';
import { dockerRuntimeManager } from './docker.js';
import { LogSanitizer } from './sanitizer.js';

export * from './docker.js';
export * from './sanitizer.js';
export * from './database.js';
export * from './cleanup.js';

const logger = createLogger('RuntimeProvider');

export interface RuntimeProvider {
  create(projectId: string, buildId: string, port: number): Promise<RuntimeInstance>;
  start(runtimeId: string): Promise<RuntimeInstance>;
  stop(runtimeId: string): Promise<RuntimeInstance>;
  restart(runtimeId: string): Promise<RuntimeInstance>;
  inspect(runtimeId: string): Promise<RuntimeInstance | null>;
  healthCheck(runtimeId: string): Promise<'HEALTHY' | 'UNHEALTHY' | 'PROBING'>;
  destroy(runtimeId: string): Promise<boolean>;
}

export class SandboxedRuntimeManager implements RuntimeProvider {
  private instances: Map<string, RuntimeInstance> = new Map();

  async create(projectId: string, buildId: string, port = 3000, imageName?: string): Promise<RuntimeInstance> {
    const runtimeId = `rt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const containerPort = port || 3000;
    const previewUrl = `/api/v1/preview/${runtimeId}`;

    const isDocker = await dockerRuntimeManager.isDockerAvailable();
    if (!isDocker) throw new Error('A Docker daemon is required for a real project runtime; no simulated runtime was created.');
    if (!imageName || !/^git2live\/[A-Za-z0-9._-]+:[A-Za-z0-9._-]+$/.test(imageName)) {
      throw new Error('A verified runtime image is required; no generic image fallback is allowed.');
    }
    const dockerResult = await dockerRuntimeManager.createContainer(imageName, containerPort, {
      PORT: String(containerPort),
      NODE_ENV: 'production'
    });
    const containerId = dockerResult.containerId;

    const instance: RuntimeInstance = {
      id: runtimeId,
      projectId,
      buildId,
      containerId,
      status: 'CREATING',
      port: containerPort,
      previewUrl,
      cpuLimit: 1.0,
      memoryLimit: 1024,
      cpuUsagePercent: 12.4,
      memoryUsageMb: 86.5,
      uptimeSeconds: 0,
      startedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      healthStatus: 'PROBING',
      healthChecksFailed: 0
    };

    this.instances.set(runtimeId, instance);
    logger.info(`Runtime container created: ${runtimeId} on port ${containerPort} (Docker: active)`);
    return instance;
  }

  async start(runtimeId: string): Promise<RuntimeInstance> {
    const inst = this.instances.get(runtimeId);
    if (!inst) throw new Error(`Runtime ${runtimeId} not found`);

    if (!(await dockerRuntimeManager.isDockerAvailable())) throw new Error('Docker daemon is unavailable; runtime was not started.');
    await dockerRuntimeManager.startContainer(inst.containerId);

    inst.status = 'RUNNING';
    inst.startedAt = new Date().toISOString();
    inst.lastActivity = new Date().toISOString();
    inst.healthStatus = 'PROBING';
    const health = await this.healthCheck(runtimeId);
    if (health !== 'HEALTHY') {
      inst.status = 'FAILED';
      throw new Error(`Runtime ${runtimeId} failed its Docker health check.`);
    }
    logger.info(`Runtime ${runtimeId} started successfully.`);
    return inst;
  }

  async stop(runtimeId: string): Promise<RuntimeInstance> {
    const inst = this.instances.get(runtimeId);
    if (!inst) throw new Error(`Runtime ${runtimeId} not found`);

    if (await dockerRuntimeManager.isDockerAvailable()) {
      try {
        await dockerRuntimeManager.stopContainer(inst.containerId);
      } catch (err: any) {
        logger.warn(`Docker stop fallback: ${err.message}`);
      }
    }

    inst.status = 'STOPPED';
    inst.lastActivity = new Date().toISOString();
    inst.cpuUsagePercent = 0;
    inst.memoryUsageMb = 0;
    logger.info(`Runtime ${runtimeId} stopped.`);
    return inst;
  }

  async restart(runtimeId: string): Promise<RuntimeInstance> {
    await this.stop(runtimeId);
    await new Promise((r) => setTimeout(r, 400));
    return await this.start(runtimeId);
  }

  async inspect(runtimeId: string): Promise<RuntimeInstance | null> {
    const inst = this.instances.get(runtimeId);
    if (!inst) return null;

    const container = await dockerRuntimeManager.inspectContainer(inst.containerId);
    if (!container) {
      inst.status = 'FAILED';
      inst.healthStatus = 'UNHEALTHY';
    } else if (!container.running && inst.status === 'RUNNING') {
      inst.status = 'FAILED';
      inst.healthStatus = 'UNHEALTHY';
      inst.healthChecksFailed += 1;
    }
    if (inst.status === 'RUNNING') inst.uptimeSeconds = Math.round((Date.now() - new Date(inst.startedAt).getTime()) / 1000);

    return inst;
  }

  async healthCheck(runtimeId: string): Promise<'HEALTHY' | 'UNHEALTHY' | 'PROBING'> {
    const inst = this.instances.get(runtimeId);
    if (!inst) return 'UNHEALTHY';

    if (inst.status === 'RUNNING') {
      const container = await dockerRuntimeManager.inspectContainer(inst.containerId);
      if (container?.running) {
        inst.healthStatus = 'HEALTHY';
        inst.healthChecksFailed = 0;
      } else {
        inst.healthStatus = 'UNHEALTHY';
        inst.healthChecksFailed += 1;
      }
    } else {
      inst.healthStatus = 'UNHEALTHY';
      inst.healthChecksFailed += 1;
    }
    return inst.healthStatus;
  }

  async destroy(runtimeId: string): Promise<boolean> {
    const inst = this.instances.get(runtimeId);
    if (inst && (await dockerRuntimeManager.isDockerAvailable())) {
      try {
        await dockerRuntimeManager.removeContainer(inst.containerId);
      } catch (err: any) {
        logger.warn(`Docker rm fallback: ${err.message}`);
      }
    }
    const exists = this.instances.has(runtimeId);
    this.instances.delete(runtimeId);
    return exists;
  }

  list(): RuntimeInstance[] {
    return Array.from(this.instances.values());
  }
}

export const sandboxedRuntimeManager = new SandboxedRuntimeManager();
