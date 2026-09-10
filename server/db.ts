import {
  User,
  Project,
  Build,
  BuildLogEntry,
  RuntimeInstance,
  AISession,
  EnvironmentVariable,
  AuditLog,
  SystemMetrics,
  ProjectFile
} from '../src/types.js';

export interface DatabaseStore {
  users: User[];
  projects: Project[];
  builds: Build[];
  buildLogs: BuildLogEntry[];
  runtimes: RuntimeInstance[];
  aiSessions: AISession[];
  envVars: EnvironmentVariable[];
  auditLogs: AuditLog[];
  workspaceFiles: Map<string, Map<string, string>>; // projectId -> (filepath -> content)
}

export class Git2LiveDatabase {
  private users: User[] = [];
  private projects: Project[] = [];
  private builds: Build[] = [];
  private buildLogs: BuildLogEntry[] = [];
  private runtimes: RuntimeInstance[] = [];
  private aiSessions: AISession[] = [];
  private envVars: EnvironmentVariable[] = [];
  private auditLogs: AuditLog[] = [];
  private workspaceFiles: Map<string, Map<string, string>> = new Map();

  constructor() {
    this.seedInitialData();
  }

  private seedInitialData() {
    // 1. Users
    const adminUser: User = {
      id: 'usr-admin-01',
      email: 'admin@git2live.dev',
      name: 'DevOps Lead Engineer',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
      role: 'ADMIN',
      plan: 'ENTERPRISE',
      createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    };

    const demoUser: User = {
      id: 'usr-demo-01',
      email: 'engineer@company.io',
      name: 'Alex Vance',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
      role: 'USER',
      plan: 'PRO',
      createdAt: new Date(Date.now() - 15 * 86400000).toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.users = [adminUser, demoUser];

    // 2. Initial Projects
    const p0: Project = {
      id: 'proj-openclaw-01',
      userId: demoUser.id,
      name: 'openclaw',
      repositoryUrl: 'https://github.com/openclaw/openclaw',
      defaultBranch: 'main',
      currentCommitSha: 'a7b3c8f',
      status: 'RUNNING',
      framework: 'Node.js',
      language: 'TypeScript',
      port: 3000,
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      autoRebuildOnPush: true,
      envCount: 4,
      customDomain: 'openclaw.preview.git2live.dev',
      category: 'ai-agent',
      description: 'The AI that really does things. Autonomous AI developer assistant with universal cloud model connectivity, zero-key bridge, and live execution.',
      topics: ['ai', 'assistant', 'openclaw', 'agents', 'tools', 'zero-key'],
      aiRequirements: {
        required: true,
        providers: ['openai', 'gemini', 'anthropic', 'groq', 'together'],
        sdk: ['openai', '@google/genai'],
        capabilities: ['chat', 'reasoning', 'code'],
        environmentVariables: ['OPENAI_API_KEY', 'GEMINI_API_KEY'],
        models: ['gemini-3.6-flash', 'gpt-4o-mini'],
        confidence: 0.99
      }
    };

    const p1: Project = {
      id: 'proj-vite-01',
      userId: demoUser.id,
      name: 'react-enterprise-dashboard',
      repositoryUrl: 'https://github.com/facebook/react',
      defaultBranch: 'main',
      currentCommitSha: '9e4a81b2c',
      status: 'RUNNING',
      framework: 'Vite',
      language: 'TypeScript',
      port: 5173,
      createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      autoRebuildOnPush: true,
      envCount: 3,
      customDomain: 'dashboard.preview.git2live.dev'
    };

    const p2: Project = {
      id: 'proj-next-02',
      userId: demoUser.id,
      name: 'nextjs-saas-starter',
      repositoryUrl: 'https://github.com/vercel/next.js',
      defaultBranch: 'canary',
      currentCommitSha: '4c810d7a',
      status: 'READY',
      framework: 'Next.js',
      language: 'TypeScript',
      port: 3000,
      createdAt: new Date(Date.now() - 5 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      autoRebuildOnPush: true,
      envCount: 2
    };

    const p3: Project = {
      id: 'proj-py-03',
      userId: demoUser.id,
      name: 'fastapi-ai-service',
      repositoryUrl: 'https://github.com/tiangolo/fastapi',
      defaultBranch: 'master',
      currentCommitSha: '11fe829c',
      status: 'BUILD_FAILED',
      framework: 'FastAPI',
      language: 'Python',
      port: 8000,
      createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
      autoRebuildOnPush: false,
      envCount: 1
    };

    this.projects = [p0, p1, p2, p3];

    // 3. Builds
    const b0: Build = {
      id: 'bld-000-openclaw',
      projectId: p0.id,
      commitSha: 'a7b3c8f',
      commitMessage: 'feat: activate OpenClaw agent studio with zero-key Universal AI Bridge',
      branch: 'main',
      status: 'SUCCESS',
      buildPlan: {
        language: 'TypeScript',
        framework: 'Node.js',
        version: 'node:20-alpine',
        packageManager: 'pnpm',
        installCommand: 'npm install',
        buildCommand: 'npm run build',
        startCommand: 'npm start',
        port: 3000,
        environment: {
          NODE_ENV: 'production',
          OPENAI_BASE_URL: 'http://localhost:3000/v1',
          OPENAI_API_KEY: 'git2live-managed-token',
          AI_BRIDGE_ENABLED: 'true'
        },
        baseImage: 'git2live/node:20',
        timeoutSeconds: 600,
        memoryLimitMb: 1024,
        cpuLimitCores: 1.0
      },
      startedAt: new Date(Date.now() - 600000).toISOString(),
      finishedAt: new Date(Date.now() - 580000).toISOString(),
      durationSeconds: 20,
      artifactPath: `/artifacts/${p0.id}/bld-000-openclaw/dist.tar.gz`,
      logsCount: 6,
      aiRepairAttempts: 0
    };

    const b1: Build = {
      id: 'bld-001-vite',
      projectId: p1.id,
      commitSha: '9e4a81b2c',
      commitMessage: 'feat: add responsive telemetry chart',
      branch: 'main',
      status: 'SUCCESS',
      buildPlan: {
        language: 'TypeScript',
        framework: 'Vite',
        version: 'node:20-alpine',
        packageManager: 'npm',
        installCommand: 'npm ci',
        buildCommand: 'npm run build',
        startCommand: 'npm run preview -- --host 0.0.0.0 --port 5173',
        port: 5173,
        environment: { NODE_ENV: 'production' },
        baseImage: 'git2live/node:20',
        timeoutSeconds: 600,
        memoryLimitMb: 1024,
        cpuLimitCores: 1.0
      },
      startedAt: new Date(Date.now() - 1200000).toISOString(),
      finishedAt: new Date(Date.now() - 1182000).toISOString(),
      durationSeconds: 18,
      artifactPath: `/artifacts/${p1.id}/bld-001-vite/dist.tar.gz`,
      logsCount: 14,
      aiRepairAttempts: 0
    };

    const b3: Build = {
      id: 'bld-003-py',
      projectId: p3.id,
      commitSha: '11fe829c',
      commitMessage: 'fix: optimize model inferencing route',
      branch: 'master',
      status: 'FAILED',
      buildPlan: {
        language: 'Python',
        framework: 'FastAPI',
        version: 'python:3.11-slim',
        packageManager: 'pip',
        installCommand: 'pip install -r requirements.txt',
        buildCommand: 'echo "Pre-flight checks"',
        startCommand: 'uvicorn main:app --host 0.0.0.0 --port 8000',
        port: 8000,
        environment: { ENV: 'production' },
        baseImage: 'git2live/python:3.11',
        timeoutSeconds: 600,
        memoryLimitMb: 1024,
        cpuLimitCores: 1.0
      },
      startedAt: new Date(Date.now() - 400000).toISOString(),
      finishedAt: new Date(Date.now() - 392000).toISOString(),
      durationSeconds: 8,
      errorSummary: `ERROR: ResolutionImpossible: for pydantic-core and fastapi version pins`,
      errorCode: 'ERR_PYTHON_DEP_CONFLICT',
      logsCount: 12,
      aiRepairAttempts: 0
    };

    this.builds = [b0, b1, b3];
    p0.latestBuild = b0;
    p1.latestBuild = b1;
    p3.latestBuild = b3;

    // 4. Initial Logs for p0, p1, p3
    const p0Logs: BuildLogEntry[] = [
      { id: 'l-01', buildId: b0.id, timestamp: new Date(Date.now() - 600000).toISOString(), level: 'INFO', message: 'Analyzing OpenClaw AI agent architecture...', source: 'ANALYZER' },
      { id: 'l-02', buildId: b0.id, timestamp: new Date(Date.now() - 597000).toISOString(), level: 'INFO', message: 'Injected Universal AI Bridge proxy credentials for OpenAI, Gemini & Anthropic SDKs.', source: 'SYSTEM' },
      { id: 'l-03', buildId: b0.id, timestamp: new Date(Date.now() - 594000).toISOString(), level: 'STEP', message: 'Executing: pnpm install --frozen-lockfile', source: 'BUILDER' },
      { id: 'l-04', buildId: b0.id, timestamp: new Date(Date.now() - 588000).toISOString(), level: 'STEP', message: 'Executing: pnpm run build', source: 'BUILDER' },
      { id: 'l-05', buildId: b0.id, timestamp: new Date(Date.now() - 582000).toISOString(), level: 'INFO', message: '✓ Agent build compiled. Booting sandboxed Linux runtime...', source: 'BUILDER' },
      { id: 'l-06', buildId: b0.id, timestamp: new Date(Date.now() - 580000).toISOString(), level: 'INFO', message: '● OpenClaw Autonomous Agent is RUNNING and listening on port 3000.', source: 'RUNTIME' }
    ];

    const p1Logs: BuildLogEntry[] = [
      { id: 'l-1', buildId: b1.id, timestamp: new Date(Date.now() - 1200000).toISOString(), level: 'INFO', message: 'Build queued on worker worker-node-04.', source: 'SYSTEM' },
      { id: 'l-2', buildId: b1.id, timestamp: new Date(Date.now() - 1198000).toISOString(), level: 'STEP', message: 'Cloning repository at commit 9e4a81b2c...', source: 'GIT' },
      { id: 'l-3', buildId: b1.id, timestamp: new Date(Date.now() - 1195000).toISOString(), level: 'INFO', message: 'Cloned 42 files into isolated sandbox workspace.', source: 'GIT' },
      { id: 'l-4', buildId: b1.id, timestamp: new Date(Date.now() - 1193000).toISOString(), level: 'STEP', message: 'Executing: npm ci', source: 'BUILDER' },
      { id: 'l-5', buildId: b1.id, timestamp: new Date(Date.now() - 1188000).toISOString(), level: 'INFO', message: 'Resolved 184 packages without vulnerabilities.', source: 'BUILDER' },
      { id: 'l-6', buildId: b1.id, timestamp: new Date(Date.now() - 1187000).toISOString(), level: 'STEP', message: 'Executing: npm run build', source: 'BUILDER' },
      { id: 'l-7', buildId: b1.id, timestamp: new Date(Date.now() - 1183000).toISOString(), level: 'INFO', message: 'vite v6.2.3 building for production: 48 modules bundled.', source: 'BUILDER' },
      { id: 'l-8', buildId: b1.id, timestamp: new Date(Date.now() - 1182000).toISOString(), level: 'INFO', message: '✓ Build succeeded. Sandboxed container ready to launch.', source: 'BUILDER' }
    ];

    const p3Logs: BuildLogEntry[] = [
      { id: 'l-30', buildId: b3.id, timestamp: new Date(Date.now() - 400000).toISOString(), level: 'INFO', message: 'Build queued on worker worker-node-02.', source: 'SYSTEM' },
      { id: 'l-31', buildId: b3.id, timestamp: new Date(Date.now() - 398000).toISOString(), level: 'STEP', message: 'Cloning repository at commit 11fe829c...', source: 'GIT' },
      { id: 'l-32', buildId: b3.id, timestamp: new Date(Date.now() - 395000).toISOString(), level: 'STEP', message: 'Executing: pip install -r requirements.txt', source: 'BUILDER' },
      { id: 'l-33', buildId: b3.id, timestamp: new Date(Date.now() - 392000).toISOString(), level: 'ERROR', message: 'ERROR: ResolutionImpossible: Conflicting dependencies found for pydantic and pydantic-core', source: 'BUILDER' },
      { id: 'l-34', buildId: b3.id, timestamp: new Date(Date.now() - 392000).toISOString(), level: 'ERROR', message: 'Process exited with code 1. Build FAILED.', source: 'BUILDER' }
    ];

    this.buildLogs = [...p0Logs, ...p1Logs, ...p3Logs];

    // 5. Active Runtimes
    const r0: RuntimeInstance = {
      id: 'rt-openclaw-01',
      projectId: p0.id,
      buildId: b0.id,
      containerId: 'cntr-openclaw-9901',
      status: 'RUNNING',
      port: 3000,
      previewUrl: `/api/v1/preview/rt-openclaw-01`,
      cpuLimit: 1.0,
      memoryLimit: 1024,
      cpuUsagePercent: 11.5,
      memoryUsageMb: 142.6,
      uptimeSeconds: 580,
      startedAt: new Date(Date.now() - 580000).toISOString(),
      lastActivity: new Date().toISOString(),
      healthStatus: 'HEALTHY',
      healthChecksFailed: 0
    };

    const r1: RuntimeInstance = {
      id: 'rt-vite-8821',
      projectId: p1.id,
      buildId: b1.id,
      containerId: 'cntr-7fa0981e',
      status: 'RUNNING',
      port: 5173,
      previewUrl: `/api/v1/preview/rt-vite-8821`,
      cpuLimit: 1.0,
      memoryLimit: 1024,
      cpuUsagePercent: 14.8,
      memoryUsageMb: 112.4,
      uptimeSeconds: 1180,
      startedAt: new Date(Date.now() - 1180000).toISOString(),
      lastActivity: new Date().toISOString(),
      healthStatus: 'HEALTHY',
      healthChecksFailed: 0
    };
    this.runtimes = [r0, r1];
    p0.activeRuntime = r0;
    p1.activeRuntime = r1;

    // 6. Environment Variables
    this.envVars = [
      { id: 'env-0a', projectId: p0.id, key: 'NODE_ENV', value: 'production', isSecret: false, createdAt: new Date().toISOString() },
      { id: 'env-0b', projectId: p0.id, key: 'OPENAI_BASE_URL', value: 'http://localhost:3000/v1', isSecret: false, createdAt: new Date().toISOString() },
      { id: 'env-0c', projectId: p0.id, key: 'AI_BRIDGE_MODE', value: 'cloud-zero-key', isSecret: false, createdAt: new Date().toISOString() },
      { id: 'env-0d', projectId: p0.id, key: 'AGENT_AUTONOMOUS', value: 'true', isSecret: false, createdAt: new Date().toISOString() },
      { id: 'env-1', projectId: p1.id, key: 'NODE_ENV', value: 'production', isSecret: false, createdAt: new Date().toISOString() },
      { id: 'env-2', projectId: p1.id, key: 'API_BASE_URL', value: 'https://api.git2live.dev/v1', isSecret: false, createdAt: new Date().toISOString() },
      { id: 'env-3', projectId: p1.id, key: 'DATABASE_SECRET_TOKEN', value: '••••••••••••••••', isSecret: true, createdAt: new Date().toISOString() }
    ];

    // 7. Workspace Virtual Files
    const p0Files = new Map<string, string>();
    p0Files.set('package.json', JSON.stringify({
      name: "openclaw",
      version: "2.4.1",
      type: "module",
      scripts: { build: "tsc", start: "node dist/index.js", dev: "tsx src/index.ts" },
      dependencies: {
        "@google/genai": "^0.1.1",
        "openai": "^4.86.1",
        "express": "^4.21.2",
        "ws": "^8.18.0",
        "dotenv": "^16.4.5"
      }
    }, null, 2));
    p0Files.set('src/agent.ts', `import { GoogleGenAI } from '@google/genai';\n\nexport class OpenClawAgent {\n  constructor(private name: string = 'OpenClaw') {}\n  async act(goal: string) {\n    console.log(\`🦞 [\${this.name}] Executing autonomous goal: \${goal}\`);\n    return { success: true, status: 'completed' };\n  }\n}`);
    this.workspaceFiles.set(p0.id, p0Files);

    const p1Files = new Map<string, string>();
    p1Files.set('package.json', JSON.stringify({
      name: "react-enterprise-dashboard",
      version: "1.0.0",
      scripts: { build: "vite build", start: "vite preview" },
      dependencies: { react: "^19.0.0", "react-dom": "^19.0.0", "lucide-react": "^0.546.0" }
    }, null, 2));
    p1Files.set('src/App.tsx', `import React from 'react';\n\nexport default function App() {\n  return (\n    <div className="p-8">\n      <h1 className="text-2xl font-bold text-blue-600">React Dashboard Live</h1>\n      <p>Deployed with Git2Live execution sandbox.</p>\n    </div>\n  );\n}`);
    this.workspaceFiles.set(p1.id, p1Files);

    const p3Files = new Map<string, string>();
    p3Files.set('requirements.txt', `fastapi==0.115.0\nuvicorn==0.31.0\npydantic>=2.9.0,<3.0.0`);
    p3Files.set('main.py', `from fastapi import FastAPI\n\napp = FastAPI(title="AI Service")\n\n@app.get("/")\ndef root():\n    return {"status": "ok", "platform": "Git2Live"}\n`);
    this.workspaceFiles.set(p3.id, p3Files);

    // 8. Audit logs
    this.auditLogs = [
      { id: 'aud-1', userId: demoUser.id, action: 'PROJECT_CREATED', details: { projectId: p1.id, name: p1.name }, timestamp: new Date(Date.now() - 2 * 86400000).toISOString() },
      { id: 'aud-2', userId: demoUser.id, action: 'BUILD_STARTED', details: { buildId: b1.id, commit: b1.commitSha }, timestamp: new Date(Date.now() - 1200000).toISOString() },
      { id: 'aud-3', userId: demoUser.id, action: 'RUNTIME_STARTED', details: { runtimeId: r1.id, port: r1.port }, timestamp: new Date(Date.now() - 1180000).toISOString() }
    ];
  }

  // User Methods
  getCurrentUser(): User {
    return this.users[1]; // Alex Vance (demo user)
  }

  getUsers(): User[] {
    return this.users;
  }

  // Project Methods
  getProjects(query?: string): Project[] {
    const seen = new Set<string>();
    const unique = this.projects.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
    let list = unique;
    if (query) {
      const q = query.toLowerCase();
      list = list.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.repositoryUrl.toLowerCase().includes(q) ||
        p.framework.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q)
      );
    }
    return list;
  }

  getProjectById(id: string): Project | undefined {
    return this.projects.find((p) => p.id === id);
  }

  createProject(data: Partial<Project>): Project {
    const user = this.getCurrentUser();
    const newProject: Project = {
      id: `proj-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      userId: user.id,
      name: data.name || 'new-app',
      repositoryUrl: data.repositoryUrl || '',
      defaultBranch: data.defaultBranch || 'main',
      currentCommitSha: data.currentCommitSha || 'b4c798e',
      status: 'CREATED',
      framework: data.framework || 'Vite',
      language: data.language || 'TypeScript',
      port: data.port || 3000,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      autoRebuildOnPush: data.autoRebuildOnPush ?? true,
      envCount: 0,
      description: data.description || '',
      topics: data.topics || [],
      stars: data.stars || 0,
      category: data.category || 'web-app',
      readme: data.readme || '',
      analysis: data.analysis,
      aiRequirements: data.aiRequirements || data.analysis?.aiRequirements
    };

    this.projects.unshift(newProject);
    this.addAuditLog('PROJECT_CREATED', { projectId: newProject.id, name: newProject.name });
    return newProject;
  }

  updateProject(id: string, updates: Partial<Project>): Project | null {
    const project = this.getProjectById(id);
    if (!project) return null;
    Object.assign(project, updates, { updatedAt: new Date().toISOString() });
    return project;
  }

  deleteProject(id: string): boolean {
    const idx = this.projects.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    const removed = this.projects.splice(idx, 1)[0];
    // Also cleanup associated runtimes
    this.runtimes = this.runtimes.filter((r) => r.projectId !== id);
    this.addAuditLog('PROJECT_DELETED', { projectId: id, name: removed.name });
    return true;
  }

  // Build Methods
  getBuilds(projectId?: string): Build[] {
    if (projectId) {
      return this.builds.filter((b) => b.projectId === projectId).sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
    }
    return this.builds;
  }

  getBuildById(id: string): Build | undefined {
    return this.builds.find((b) => b.id === id);
  }

  createBuild(projectId: string, plan: any, commitSha = 'c98401a', branch = 'main'): Build {
    const project = this.getProjectById(projectId);
    if (!project) throw new Error('Project not found');

    const newBuild: Build = {
      id: `bld-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      projectId,
      commitSha,
      commitMessage: `Triggered build on ${branch}`,
      branch,
      status: 'QUEUED',
      buildPlan: plan,
      startedAt: new Date().toISOString(),
      logsCount: 0,
      aiRepairAttempts: 0
    };

    this.builds.unshift(newBuild);
    project.latestBuild = newBuild;
    project.status = 'BUILDING';
    this.addAuditLog('BUILD_STARTED', { buildId: newBuild.id, projectId });
    return newBuild;
  }

  getBuildLogs(buildId: string): BuildLogEntry[] {
    return this.buildLogs.filter((l) => l.buildId === buildId);
  }

  getBuildLogsRef(): BuildLogEntry[] {
    return this.buildLogs;
  }

  // Runtime Methods
  getRuntimes(projectId?: string): RuntimeInstance[] {
    if (projectId) {
      return this.runtimes.filter((r) => r.projectId === projectId);
    }
    return this.runtimes;
  }

  getRuntimeById(id: string): RuntimeInstance | undefined {
    return this.runtimes.find((r) => r.id === id);
  }

  setRuntime(runtime: RuntimeInstance) {
    const idx = this.runtimes.findIndex((r) => r.id === runtime.id);
    if (idx >= 0) {
      this.runtimes[idx] = runtime;
    } else {
      this.runtimes.unshift(runtime);
    }
    const project = this.getProjectById(runtime.projectId);
    if (project) {
      project.activeRuntime = runtime;
      project.status = runtime.status === 'RUNNING' ? 'RUNNING' : 'STOPPED';
    }
  }

  // AI Session Methods
  getAiSessions(projectId?: string): AISession[] {
    if (projectId) {
      return this.aiSessions.filter((s) => s.projectId === projectId);
    }
    return this.aiSessions;
  }

  saveAiSession(session: AISession) {
    const idx = this.aiSessions.findIndex((s) => s.id === session.id);
    if (idx >= 0) {
      this.aiSessions[idx] = session;
    } else {
      this.aiSessions.unshift(session);
    }
    this.addAuditLog('AI_REPAIR_ACTION', { sessionId: session.id, status: session.status });
  }

  // Environment Variables
  getEnvVars(projectId: string): EnvironmentVariable[] {
    return this.envVars.filter((e) => e.projectId === projectId);
  }

  addEnvVar(projectId: string, key: string, value: string, isSecret = false): EnvironmentVariable {
    const entry: EnvironmentVariable = {
      id: `env-${Date.now().toString(36)}`,
      projectId,
      key,
      value,
      isSecret,
      createdAt: new Date().toISOString()
    };
    this.envVars.push(entry);
    const p = this.getProjectById(projectId);
    if (p) p.envCount = this.getEnvVars(projectId).length;
    this.addAuditLog('ENV_VAR_SET', { projectId, key });
    return entry;
  }

  deleteEnvVar(id: string): boolean {
    const idx = this.envVars.findIndex((e) => e.id === id);
    if (idx === -1) return false;
    const removed = this.envVars.splice(idx, 1)[0];
    const p = this.getProjectById(removed.projectId);
    if (p) p.envCount = this.getEnvVars(removed.projectId).length;
    return true;
  }

  // Workspace Files
  getWorkspaceFiles(projectId: string): Map<string, string> {
    if (!this.workspaceFiles.has(projectId)) {
      const defaultMap = new Map<string, string>();
      defaultMap.set('package.json', JSON.stringify({ name: 'app', version: '1.0.0', dependencies: {} }, null, 2));
      defaultMap.set('src/App.tsx', `export default function App() { return <div>App Loaded</div>; }`);
      this.workspaceFiles.set(projectId, defaultMap);
    }
    return this.workspaceFiles.get(projectId)!;
  }

  setWorkspaceFile(projectId: string, path: string, content: string) {
    const files = this.getWorkspaceFiles(projectId);
    files.set(path, content);
  }

  // Audit Logs & Metrics
  addAuditLog(action: string, details: Record<string, any>) {
    const user = this.getCurrentUser();
    this.auditLogs.unshift({
      id: `aud-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      userId: user.id,
      action,
      details,
      timestamp: new Date().toISOString()
    });
    if (this.auditLogs.length > 200) {
      this.auditLogs.pop();
    }
  }

  getAuditLogs(): AuditLog[] {
    return this.auditLogs;
  }

  getMetrics(): SystemMetrics {
    const running = this.runtimes.filter((r) => r.status === 'RUNNING').length;
    const successful = this.builds.filter((b) => b.status === 'SUCCESS').length;
    const failed = this.builds.filter((b) => b.status === 'FAILED').length;
    const active = this.builds.filter((b) => b.status === 'BUILDING' || b.status === 'QUEUED').length;

    return {
      totalProjects: this.projects.length,
      runningApps: running,
      successfulBuilds: successful,
      failedBuilds: failed,
      activeBuilds: active,
      cpuUsagePercent: Math.min(95, 24.5 + running * 12),
      ramUsagePercent: Math.min(95, 32.0 + running * 15),
      storageUsageMb: 420 + this.projects.length * 85,
      storageLimitMb: 5000,
      queueLength: active,
      activeWorkers: 4,
      currentPlan: this.getCurrentUser().plan
    };
  }
}

export const db = new Git2LiveDatabase();
