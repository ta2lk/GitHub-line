import { modelRouter } from './router.js';
import { getPlatformAIProviders } from '../../../config/ai-providers.js';

export interface HealthReport {
  status: 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE';
  uptimeSeconds: number;
  routerMode: string;
  activeProviders: {
    id: string;
    name: string;
    type: string;
    configured: boolean;
    healthy: boolean;
    latencyMs?: number;
    error?: string;
  }[];
  totalModelsAvailable: number;
  timestamp: string;
}

export class AIBridgeHealthMonitor {
  private startTime = Date.now();

  async getHealth(): Promise<HealthReport> {
    const providers = getPlatformAIProviders();
    const providerReports = await Promise.all(
      providers.map(async (p) => {
        const adapter = modelRouter.getAdapter(p.type);
        if (!adapter || !p.enabled) {
          return {
            id: p.id,
            name: p.name,
            type: p.type,
            configured: false,
            healthy: false,
            error: 'Not configured or disabled'
          };
        }

        try {
          const check = await adapter.healthCheck();
          return {
            id: p.id,
            name: p.name,
            type: p.type,
            configured: true,
            healthy: check.healthy,
            latencyMs: check.latencyMs,
            error: check.error
          };
        } catch (err: any) {
          return {
            id: p.id,
            name: p.name,
            type: p.type,
            configured: true,
            healthy: false,
            error: err.message
          };
        }
      })
    );

    const healthyCount = providerReports.filter((r) => r.healthy).length;
    let status: HealthReport['status'] = 'HEALTHY';
    if (healthyCount === 0) status = 'UNAVAILABLE';
    else if (healthyCount < providerReports.filter((r) => r.configured).length) status = 'DEGRADED';

    const models = await modelRouter.getAvailableModels();

    return {
      status,
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      routerMode: process.env.AI_ROUTER_MODE || 'auto',
      activeProviders: providerReports,
      totalModelsAvailable: models.length,
      timestamp: new Date().toISOString()
    };
  }
}

export const aiHealthMonitor = new AIBridgeHealthMonitor();
