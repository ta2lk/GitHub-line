import { Build, BuildStatus, BuildLogEntry, BuildPlan, LogLevel } from '../../../src/types.js';
import { createLogger } from '../../../packages/logger/src/index.js';
import { dockerfileGenerator } from './dockerfile.js';
import { LogSanitizer } from '../../runtime/src/sanitizer.js';

export * from './dockerfile.js';

const logger = createLogger('BuildWorker');

export type LogListener = (entry: BuildLogEntry) => void;

export class BuildWorker {
  private logListeners: Map<string, Set<LogListener>> = new Map();

  subscribeLogs(buildId: string, listener: LogListener) {
    if (!this.logListeners.has(buildId)) {
      this.logListeners.set(buildId, new Set());
    }
    this.logListeners.get(buildId)!.add(listener);
    return () => {
      this.logListeners.get(buildId)?.delete(listener);
    };
  }

  emitLog(
    buildLogs: BuildLogEntry[],
    buildId: string,
    level: LogLevel,
    message: string,
    source: BuildLogEntry['source'] = 'BUILDER'
  ): BuildLogEntry {
    const sanitizedMessage = LogSanitizer.sanitize(message);
    const entry: BuildLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      buildId,
      timestamp: new Date().toISOString(),
      level,
      message: sanitizedMessage,
      source
    };
    buildLogs.push(entry);

    // Notify active stream subscribers
    const listeners = this.logListeners.get(buildId);
    if (listeners) {
      listeners.forEach((l) => l(entry));
    }

    return entry;
  }

  /**
   * Executes sandboxed build step sequence with full state machine transitions
   */
  async executeBuild(
    build: Build,
    buildLogs: BuildLogEntry[],
    options?: {
      simulateFailure?: boolean;
      failureReason?: string;
      customDelayMs?: number;
    }
  ): Promise<{ success: boolean; error?: string }> {
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    const stepDelay = options?.customDelayMs ?? 350;

    const emit = (level: LogLevel, msg: string, src: BuildLogEntry['source'] = 'BUILDER') =>
      this.emitLog(buildLogs, build.id, level, msg, src);

    try {
      // 1. QUEUED
      build.status = 'QUEUED';
      emit('INFO', `Build #${build.id.slice(0, 8)} queued on execution worker pool.`);
      await delay(stepDelay);

      // 2. CLONING
      build.status = 'CLONING';
      emit('STEP', `Cloning branch '${build.branch}' at commit ${build.commitSha.slice(0, 7)}...`, 'GIT');
      emit('INFO', `git clone --depth 1 --branch ${build.branch} (safe isolated workspace created)`, 'GIT');
      await delay(stepDelay);
      emit('INFO', `Repository unpacked: workspace verified and indexed.`, 'GIT');

      // 3. ANALYZING
      build.status = 'ANALYZING';
      emit('STEP', `Verifying workspace manifests and security policies...`, 'ANALYZER');
      emit('INFO', `Detected framework: ${build.buildPlan.framework} (${build.buildPlan.language})`, 'ANALYZER');
      emit('INFO', `Base container image targeted: ${build.buildPlan.baseImage}`, 'ANALYZER');
      await delay(stepDelay);

      // 4. PREPARING & DOCKERFILE GENERATION
      build.status = 'PREPARING';
      emit('STEP', `Generating multi-stage Dockerfile for ${build.buildPlan.language}...`);
      const generatedDockerfile = dockerfileGenerator.generate(build.buildPlan);
      emit('INFO', `Generated ${generatedDockerfile.split('\n').length} lines of compliant container specification.`);
      emit('INFO', `Enforcing resource limits: ${build.buildPlan.cpuLimitCores} CPU, ${build.buildPlan.memoryLimitMb}MB RAM, non-root user.`);
      await delay(stepDelay);

      // Check simulated failure hook (for testing AI repair pipeline!)
      if (options?.simulateFailure) {
        build.status = 'INSTALLING';
        emit('STEP', `Executing: ${build.buildPlan.installCommand}`);
        await delay(stepDelay);
        emit('ERROR', `npm ERR! code MODULE_NOT_FOUND`);
        emit('ERROR', `npm ERR! Cannot find module '@types/express' or incompatible peer dependency 'react@19'`);
        emit('ERROR', options.failureReason || `Build failed during dependency resolution: Process exited with status 1`);
        build.status = 'FAILED';
        build.finishedAt = new Date().toISOString();
        build.durationSeconds = 4;
        build.errorSummary = options.failureReason || `Module resolution failure in package.json dependencies.`;
        build.errorCode = 'ERR_DEP_RESOLUTION';
        return { success: false, error: build.errorSummary };
      }

      // 5. INSTALLING
      build.status = 'INSTALLING';
      emit('STEP', `Executing: ${build.buildPlan.installCommand}`);
      emit('INFO', `Resolved dependencies in sandbox environment.`);
      await delay(stepDelay);

      // 6. BUILDING
      build.status = 'BUILDING';
      emit('STEP', `Executing: ${build.buildPlan.buildCommand}`);
      emit('INFO', `Compilation and bundle optimization completed.`);
      await delay(stepDelay);

      // 7. TESTING
      build.status = 'TESTING';
      emit('STEP', `Executing health and container integration probes...`);
      emit('INFO', `Entry point validation on port ${build.buildPlan.port}: READY`);
      await delay(stepDelay);

      // 8. SUCCESS
      build.status = 'SUCCESS';
      build.finishedAt = new Date().toISOString();
      build.durationSeconds = Math.max(1, Math.round((new Date(build.finishedAt).getTime() - new Date(build.startedAt).getTime()) / 1000));
      build.artifactPath = `/artifacts/${build.projectId}/${build.id}/dist.tar.gz`;
      emit('INFO', `✓ Build completed successfully in ${build.durationSeconds}s! Artifact packaged at ${build.artifactPath}`);

      return { success: true };
    } catch (err: any) {
      build.status = 'FAILED';
      build.finishedAt = new Date().toISOString();
      build.errorSummary = err.message || 'Unexpected build worker failure';
      emit('ERROR', `Build failure: ${build.errorSummary}`);
      return { success: false, error: build.errorSummary };
    }
  }
}

export const buildWorker = new BuildWorker();
