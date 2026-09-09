// Git2Live - Core Platform Types

export type UserRole = 'USER' | 'ADMIN' | 'SUPER_ADMIN';

export type PlanType = 'FREE' | 'PRO' | 'TEAM' | 'ENTERPRISE';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  plan: PlanType;
  createdAt: string;
  updatedAt: string;
}

export type ProjectStatus =
  | 'CREATED'
  | 'ANALYZING'
  | 'READY'
  | 'BUILDING'
  | 'BUILD_FAILED'
  | 'RUNNING'
  | 'STOPPED'
  | 'ERROR'
  | 'DELETED';

export type FrameworkType =
  | 'React'
  | 'Vite'
  | 'Next.js'
  | 'Node.js'
  | 'Express'
  | 'Vue'
  | 'Svelte'
  | 'FastAPI'
  | 'Flask'
  | 'Django'
  | 'Docker'
  | 'Static HTML'
  | 'Unknown';

export type LanguageType =
  | 'TypeScript'
  | 'JavaScript'
  | 'Python'
  | 'Go'
  | 'Rust'
  | 'Docker'
  | 'HTML/CSS'
  | 'Unknown';

export type PackageManagerType = 'npm' | 'pnpm' | 'yarn' | 'bun' | 'pip' | 'poetry' | 'docker' | 'none';

export interface RepositoryAnalysis {
  repositoryUrl: string;
  defaultBranch: string;
  latestCommitSha: string;
  detectedLanguage: LanguageType;
  detectedFramework: FrameworkType;
  detectedPackageManager: PackageManagerType;
  detectedPort: number;
  runtimeVersion: string;
  installCommand: string;
  buildCommand: string;
  startCommand: string;
  confidence: number;
  manifestFiles: string[];
  isMonorepo: boolean;
  scoreBreakdown: Record<string, number>;
  securityFindings?: SecurityFinding[];
  description?: string;
  topics?: string[];
  stars?: number;
  category?: 'web-app' | 'api-service' | 'ai-agent' | 'ui-library' | 'tool-cli' | 'python-app';
  readmeSnippet?: string;
}

export interface SecurityFinding {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  type: string;
  message: string;
  file?: string;
  line?: number;
}

export interface BuildPlan {
  language: LanguageType;
  framework: FrameworkType;
  version: string;
  packageManager: PackageManagerType;
  installCommand: string;
  buildCommand: string;
  startCommand: string;
  port: number;
  environment: Record<string, string>;
  baseImage: string;
  timeoutSeconds: number;
  memoryLimitMb: number;
  cpuLimitCores: number;
}

export type BuildStatus =
  | 'QUEUED'
  | 'CLONING'
  | 'ANALYZING'
  | 'PREPARING'
  | 'INSTALLING'
  | 'BUILDING'
  | 'TESTING'
  | 'SUCCESS'
  | 'FAILED'
  | 'CANCELLED';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'STEP';

export interface BuildLogEntry {
  id: string;
  buildId: string;
  timestamp: string;
  level: LogLevel;
  message: string;
  source: 'SYSTEM' | 'GIT' | 'ANALYZER' | 'BUILDER' | 'AI_AGENT' | 'RUNTIME';
}

export interface Build {
  id: string;
  projectId: string;
  commitSha: string;
  commitMessage?: string;
  branch: string;
  status: BuildStatus;
  buildPlan: BuildPlan;
  startedAt: string;
  finishedAt?: string;
  durationSeconds?: number;
  errorSummary?: string;
  errorCode?: string;
  artifactPath?: string;
  logsCount: number;
  aiRepairAttempts: number;
}

export type RuntimeStatus =
  | 'CREATING'
  | 'STARTING'
  | 'RUNNING'
  | 'STOPPING'
  | 'STOPPED'
  | 'FAILED'
  | 'DESTROYED';

export interface RuntimeInstance {
  id: string;
  projectId: string;
  buildId: string;
  containerId: string;
  status: RuntimeStatus;
  port: number;
  previewUrl: string;
  cpuLimit: number; // cores
  memoryLimit: number; // MB
  cpuUsagePercent: number;
  memoryUsageMb: number;
  uptimeSeconds: number;
  startedAt: string;
  lastActivity: string;
  healthStatus: 'HEALTHY' | 'UNHEALTHY' | 'PROBING';
  healthChecksFailed: number;
}

export type ErrorClassification =
  | 'Dependency'
  | 'Syntax'
  | 'TypeScript'
  | 'Environment'
  | 'Port'
  | 'Network'
  | 'Permission'
  | 'Memory'
  | 'Timeout'
  | 'Framework'
  | 'Docker'
  | 'Runtime'
  | 'Unknown';

export interface AISessionAction {
  id: string;
  tool: string;
  arguments: Record<string, any>;
  result?: any;
  timestamp: string;
  success: boolean;
  error?: string;
}

export interface AIRepairStep {
  stepNumber: number;
  title: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED';
  description: string;
  diff?: string;
  targetFile?: string;
}

export interface AISession {
  id: string;
  projectId: string;
  buildId: string;
  status: 'ANALYZING' | 'PLANNING' | 'PATCHING' | 'REBUILDING' | 'SUCCESS' | 'FAILED' | 'IDLE';
  provider: string;
  model: string;
  errorClassification: ErrorClassification;
  rootCauseAnalysis: string;
  repairPlan: string;
  steps: AIRepairStep[];
  actions: AISessionAction[];
  repairAttempts: number;
  maxRepairAttempts: number;
  tokensUsed: number;
  startedAt: string;
  finishedAt?: string;
}

export interface EnvironmentVariable {
  id: string;
  projectId: string;
  key: string;
  value: string; // masked or encrypted
  isSecret: boolean;
  createdAt: string;
}

export interface ProjectFile {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  content?: string;
  children?: ProjectFile[];
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  repositoryUrl: string;
  defaultBranch: string;
  currentCommitSha: string;
  status: ProjectStatus;
  framework: FrameworkType;
  language: LanguageType;
  port: number;
  createdAt: string;
  updatedAt: string;
  autoRebuildOnPush: boolean;
  latestBuild?: Build;
  activeRuntime?: RuntimeInstance;
  envCount: number;
  customDomain?: string;
  description?: string;
  topics?: string[];
  stars?: number;
  category?: string;
  readme?: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  details: Record<string, any>;
  ipAddress?: string;
  timestamp: string;
}

export interface SystemMetrics {
  totalProjects: number;
  runningApps: number;
  successfulBuilds: number;
  failedBuilds: number;
  activeBuilds: number;
  cpuUsagePercent: number;
  ramUsagePercent: number;
  storageUsageMb: number;
  storageLimitMb: number;
  queueLength: number;
  activeWorkers: number;
  currentPlan: PlanType;
}
