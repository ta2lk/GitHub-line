import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { access, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Build, BuildLogEntry, LogLevel } from '../../../src/types.js';
import { createLogger } from '../../../packages/logger/src/index.js';
import { LogSanitizer } from '../../runtime/src/sanitizer.js';
import { dockerfileGenerator } from './dockerfile.js';

export * from './dockerfile.js';

const execFileAsync = promisify(execFile);
const logger = createLogger('BuildWorker');
const MAX_OUTPUT = 12000;

export type LogListener = (entry: BuildLogEntry) => void;

function safeCommand(command: string): string[] {
  const trimmed = String(command || '').trim();
  if (!trimmed || /[;&|`$<>\n\r]/.test(trimmed)) {
    throw new Error(`Unsafe build command rejected: ${trimmed.slice(0, 120)}`);
  }
  const parts = trimmed.match(/(?:[^\\s"]+|"[^"]*")+/g) || [];
  return parts.map((part) => part.replace(/^"|"$/g, ''));
}

function durationSeconds(startedAt: string): number {
  return Math.max(1, Math.round((Date.now() - new Date(startedAt).getTime()) / 1000));
}

export class BuildWorker {
  private logListeners: Map<string, Set<LogListener>> = new Map();

  subscribeLogs(buildId: string, listener: LogListener) {
    if (!this.logListeners.has(buildId)) this.logListeners.set(buildId, new Set());
    this.logListeners.get(buildId)!.add(listener);
    return () => this.logListeners.get(buildId)?.delete(listener);
  }

  emitLog(buildLogs: BuildLogEntry[], buildId: string, level: LogLevel, message: string, source: BuildLogEntry['source'] = 'BUILDER') {
    const entry: BuildLogEntry = {
      id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      buildId,
      timestamp: new Date().toISOString(),
      level,
      message: LogSanitizer.sanitize(message).slice(0, MAX_OUTPUT),
      source
    };
    buildLogs.push(entry);
    this.logListeners.get(buildId)?.forEach((listener) => listener(entry));
    return entry;
  }

  async executeBuild(
    build: Build,
    buildLogs: BuildLogEntry[],
    options: { repositoryUrl?: string; workspaceDir?: string; simulateFailure?: boolean; failureReason?: string } = {}
  ): Promise<{ success: boolean; error?: string; workspaceDir?: string }> {
    const emit = (level: LogLevel, message: string, source: BuildLogEntry['source'] = 'BUILDER') => this.emitLog(buildLogs, build.id, level, message, source);
    const timeout = Math.max(10_000, Math.min(30 * 60_000, (build.buildPlan.timeoutSeconds || 600) * 1000));
    let workspace = options.workspaceDir;
    try {
      if (options.simulateFailure) throw new Error(options.failureReason || 'Simulation is disabled in production execution mode.');
      if (!workspace) {
        if (!options.repositoryUrl) throw new Error('A repository URL is required for a real build.');
        if (!/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?\/?$/.test(options.repositoryUrl)) {
          throw new Error('Only public GitHub repository URLs are supported by the real builder.');
        }
        build.status = 'CLONING';
        emit('STEP', `Cloning ${options.repositoryUrl} at ${build.branch}...`, 'GIT');
        workspace = await mkdtemp(join(tmpdir(), `git2live-${build.id}-`));
        await execFileAsync('git', ['clone', '--depth', '1', '--branch', build.branch, options.repositoryUrl, workspace], { timeout });
        emit('INFO', 'Repository cloned into an isolated temporary workspace.', 'GIT');
      }

      build.status = 'ANALYZING';
      emit('STEP', 'Validating the workspace and build plan.', 'ANALYZER');
      const install = safeCommand(build.buildPlan.installCommand);
      const buildCommand = safeCommand(build.buildPlan.buildCommand);
      if (!install.length || !buildCommand.length) throw new Error('Install and build commands are required.');

      build.status = 'INSTALLING';
      emit('STEP', `Executing ${install[0]} ${install.slice(1).join(' ')}`);
      await execFileAsync(install[0], install.slice(1), { cwd: workspace, timeout, maxBuffer: 4 * 1024 * 1024 });

      build.status = 'BUILDING';
      emit('STEP', `Executing ${buildCommand[0]} ${buildCommand.slice(1).join(' ')}`);
      await execFileAsync(buildCommand[0], buildCommand.slice(1), { cwd: workspace, timeout, maxBuffer: 4 * 1024 * 1024 });

      build.status = 'TESTING';
      emit('STEP', 'Checking the build output and declared entrypoint.');
      let artifactPath = workspace;
      await execFileAsync('docker', ['info', '--format', '{{.ServerVersion}}'], { timeout: 3000 });
      try {
        await access(join(workspace, 'Dockerfile'));
      } catch {
        await writeFile(join(workspace, 'Dockerfile'), dockerfileGenerator.generate(build.buildPlan), 'utf8');
        emit('INFO', 'No Dockerfile was provided; generated a constrained platform template.', 'BUILDER');
      }
      const imageTag = `git2live/${build.projectId}:${build.id}`;
      emit('STEP', `Building runtime image ${imageTag}.`, 'BUILDER');
      await execFileAsync('docker', ['build', '--tag', imageTag, workspace], { timeout, maxBuffer: 4 * 1024 * 1024 });
      artifactPath = imageTag;
      build.finishedAt = new Date().toISOString();
      build.durationSeconds = durationSeconds(build.startedAt);
      build.artifactPath = artifactPath;
      build.status = 'SUCCESS';
      emit('INFO', `Build completed from the real workspace in ${build.durationSeconds}s.`);
      if (artifactPath !== workspace && !options.workspaceDir) await rm(workspace, { recursive: true, force: true }).catch(() => undefined);
      return { success: true, workspaceDir: workspace };
    } catch (error: any) {
      build.status = 'FAILED';
      build.finishedAt = new Date().toISOString();
      build.durationSeconds = durationSeconds(build.startedAt);
      build.errorSummary = String(error?.stderr || error?.message || 'Build failed').slice(0, 1000);
      build.errorCode = error?.code ? `ERR_${String(error.code).toUpperCase()}` : 'ERR_BUILD_FAILED';
      emit('ERROR', build.errorSummary);
      if (workspace && !options.workspaceDir) await rm(workspace, { recursive: true, force: true }).catch(() => undefined);
      logger.error(`Build ${build.id} failed: ${build.errorSummary}`);
      return { success: false, error: build.errorSummary };
    }
  }
}

export const buildWorker = new BuildWorker();
