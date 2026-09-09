export interface Git2LiveConfig {
  env: 'development' | 'staging' | 'production';
  port: number;
  databaseUrl: string;
  redisUrl: string;
  jwtSecret: string;
  domain: string;
  storage: {
    endpoint: string;
    accessKey: string;
    secretKey: string;
    bucket: string;
  };
  limits: {
    maxBuildTimeoutSec: number;
    maxRuntimeIdleTimeoutMin: number;
    defaultCpuLimit: number;
    defaultMemoryLimitMb: number;
    maxAiRepairAttempts: number;
  };
  features: {
    aiRepairEnabled: boolean;
    onlineEditorEnabled: boolean;
    webhooksEnabled: boolean;
    customDomainsEnabled: boolean;
  };
}

export const config: Git2LiveConfig = {
  env: (process.env.NODE_ENV as any) || 'development',
  port: 3000,
  databaseUrl: process.env.DATABASE_URL || 'postgresql://git2live:git2live_secret@postgres:5432/git2live',
  redisUrl: process.env.REDIS_URL || 'redis://:redis_secret@redis:6379/0',
  jwtSecret: process.env.JWT_SECRET || 'git2live_default_jwt_secret_12345',
  domain: process.env.DOMAIN || 'git2live.dev',
  storage: {
    endpoint: process.env.S3_ENDPOINT || 'http://minio:9000',
    accessKey: process.env.S3_ACCESS_KEY || 'git2live_minio_admin',
    secretKey: process.env.S3_SECRET_KEY || 'git2live_minio_secret',
    bucket: process.env.S3_BUCKET_NAME || 'git2live-artifacts'
  },
  limits: {
    maxBuildTimeoutSec: parseInt(process.env.MAX_BUILD_TIMEOUT_SEC || '600', 10),
    maxRuntimeIdleTimeoutMin: parseInt(process.env.MAX_RUNTIME_IDLE_TIMEOUT_MIN || '30', 10),
    defaultCpuLimit: parseFloat(process.env.DEFAULT_CPU_LIMIT || '1.0'),
    defaultMemoryLimitMb: parseInt(process.env.DEFAULT_MEMORY_LIMIT || '1024', 10),
    maxAiRepairAttempts: 5
  },
  features: {
    aiRepairEnabled: process.env.AI_REPAIR_ENABLED !== 'false',
    onlineEditorEnabled: true,
    webhooksEnabled: true,
    customDomainsEnabled: true
  }
};
