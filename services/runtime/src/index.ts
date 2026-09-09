import { RuntimeInstance, RuntimeStatus } from '../../../src/types.js';
import { createLogger } from '../../../packages/logger/src/index.js';

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
  private basePort = 4000;

  async create(projectId: string, buildId: string, port = 3000): Promise<RuntimeInstance> {
    const runtimeId = `rt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const containerPort = port || 3000;
    const previewUrl = `/api/v1/preview/${runtimeId}`;

    const instance: RuntimeInstance = {
      id: runtimeId,
      projectId,
      buildId,
      containerId: `cntr-${Math.random().toString(36).substring(2, 10)}`,
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
    logger.info(`Runtime container created: ${runtimeId} on port ${containerPort}`);
    return instance;
  }

  async start(runtimeId: string): Promise<RuntimeInstance> {
    const inst = this.instances.get(runtimeId);
    if (!inst) throw new Error(`Runtime ${runtimeId} not found`);

    inst.status = 'RUNNING';
    inst.startedAt = new Date().toISOString();
    inst.lastActivity = new Date().toISOString();
    inst.healthStatus = 'HEALTHY';
    inst.healthChecksFailed = 0;
    logger.info(`Runtime ${runtimeId} started successfully.`);
    return inst;
  }

  async stop(runtimeId: string): Promise<RuntimeInstance> {
    const inst = this.instances.get(runtimeId);
    if (!inst) throw new Error(`Runtime ${runtimeId} not found`);

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

    // Simulate real-time metric jitter
    if (inst.status === 'RUNNING') {
      inst.cpuUsagePercent = Math.max(5, Math.min(85, Math.round((inst.cpuUsagePercent + (Math.random() * 8 - 4)) * 10) / 10));
      inst.memoryUsageMb = Math.max(60, Math.min(600, Math.round(inst.memoryUsageMb + (Math.random() * 6 - 3))));
      inst.uptimeSeconds = Math.round((Date.now() - new Date(inst.startedAt).getTime()) / 1000);
    }

    return inst;
  }

  async healthCheck(runtimeId: string): Promise<'HEALTHY' | 'UNHEALTHY' | 'PROBING'> {
    const inst = this.instances.get(runtimeId);
    if (!inst) return 'UNHEALTHY';

    if (inst.status === 'RUNNING') {
      inst.healthStatus = 'HEALTHY';
      inst.healthChecksFailed = 0;
    } else {
      inst.healthStatus = 'UNHEALTHY';
      inst.healthChecksFailed += 1;
    }
    return inst.healthStatus;
  }

  async destroy(runtimeId: string): Promise<boolean> {
    const exists = this.instances.has(runtimeId);
    this.instances.delete(runtimeId);
    return exists;
  }

  list(): RuntimeInstance[] {
    return Array.from(this.instances.values());
  }
}

export const sandboxedRuntimeManager = new SandboxedRuntimeManager();
