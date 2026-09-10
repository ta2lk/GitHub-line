import * as path from 'node:path';
import { modelRouter } from './ai-bridge/src/router.js';

const MAX_INSTRUCTION_LENGTH = 8_000;
const MAX_FILES_PER_TASK = 12;
const MAX_FILE_SIZE = 250_000;
const MAX_CONTEXT_PER_FILE = 40_000;

export interface WorkspaceFileReader {
  get(path: string): string | undefined;
  keys(): IterableIterator<string>;
}

export interface FileChange {
  path: string;
  content: string;
  reason?: string;
}

export interface SelfDevelopmentResult {
  status: 'SUCCESS' | 'FAILED';
  rootCauseAnalysis: string;
  repairPlan: string;
  changes: FileChange[];
  provider: string;
  model: string;
  tokensUsed: number;
  warnings: string[];
}

function normalizeWorkspacePath(filePath: string): string {
  if (typeof filePath !== 'string' || !filePath.trim()) {
    throw new Error('A file path is required.');
  }

  const normalized = path.posix.normalize(filePath.replaceAll('\\', '/')).replace(/^\.\//, '');
  if (
    normalized === '.' ||
    normalized.startsWith('../') ||
    normalized.includes('/../') ||
    normalized.startsWith('/') ||
    normalized.includes('\0') ||
    normalized.startsWith('.git/') ||
    normalized === '.git'
  ) {
    throw new Error(`Unsafe workspace path: ${filePath}`);
  }
  return normalized;
}

function stripJsonFences(value: string): string {
  return value.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
}

function extractContent(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw)) {
    return raw.map((part: any) => part?.type === 'text' ? part.text || '' : '').join('');
  }
  return '';
}

function buildWorkspaceContext(files: WorkspaceFileReader): string {
  return Array.from(files.keys())
    .slice(0, 200)
    .map((filePath) => {
      const content = files.get(filePath) || '';
      return `\n--- ${filePath} ---\n${content.slice(0, MAX_CONTEXT_PER_FILE)}`;
    })
    .join('');
}

/**
 * Applies a user instruction to the in-memory project workspace.
 * The model may propose several files, but this function validates every path
 * and refuses malformed or oversized changes before the caller commits them.
 */
export async function runSelfDevelopment(
  projectName: string,
  framework: string,
  instruction: string,
  files: WorkspaceFileReader
): Promise<SelfDevelopmentResult> {
  const trimmedInstruction = String(instruction || '').trim();
  if (!trimmedInstruction) throw new Error('Instruction is required.');
  if (trimmedInstruction.length > MAX_INSTRUCTION_LENGTH) {
    throw new Error(`Instruction is too long. Maximum length is ${MAX_INSTRUCTION_LENGTH} characters.`);
  }

  const prompt = `You are a senior autonomous software engineer modifying a sandboxed project workspace.
Project: ${projectName}
Framework: ${framework}
User task: ${trimmedInstruction}

Workspace files and current contents:
${buildWorkspaceContext(files)}

Return ONLY valid JSON with this exact shape:
{
  "rootCauseAnalysis": "what you found or why the requested change is needed",
  "repairPlan": "numbered concise steps",
  "changes": [
    { "path": "relative/path.ext", "content": "complete file content", "reason": "why this file changes" }
  ],
  "warnings": ["optional warnings"]
}

Rules:
- Return complete contents for every changed file, never a diff and never markdown fences.
- Change only files necessary for the task; use at most ${MAX_FILES_PER_TASK} files.
- Paths must be relative to the workspace. Never use absolute paths, .., .git, secrets, or deployment credentials.
- Do not add API keys, tokens, passwords, private keys, or credential values.
- Preserve existing behavior unless the user explicitly asks to change it.
`;

  const completion = await modelRouter.routeCompletion({
    model: 'auto',
    messages: [
      { role: 'system', content: 'You are a safe autonomous coding agent. Return strict JSON only.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.15,
    max_tokens: 12_000
  });

  const raw = extractContent(completion?.choices?.[0]?.message?.content);
  if (!raw) throw new Error('The AI provider returned an empty development plan.');

  let parsed: any;
  try {
    parsed = JSON.parse(stripJsonFences(raw));
  } catch {
    throw new Error('The AI provider returned invalid JSON; no files were changed.');
  }

  if (!Array.isArray(parsed.changes) || parsed.changes.length === 0) {
    throw new Error('The development plan contains no file changes.');
  }
  if (parsed.changes.length > MAX_FILES_PER_TASK) {
    throw new Error(`The development plan exceeds the ${MAX_FILES_PER_TASK}-file safety limit.`);
  }

  const changes: FileChange[] = [];
  const seen = new Set<string>();
  const secretPattern = /(api[_-]?key|secret|password|private[_-]?key|bearer\s+[a-z0-9._-]+)/i;

  for (const candidate of parsed.changes) {
    const filePath = normalizeWorkspacePath(candidate?.path);
    if (seen.has(filePath)) throw new Error(`Duplicate file change: ${filePath}`);
    seen.add(filePath);
    if (typeof candidate?.content !== 'string') throw new Error(`Missing complete content for ${filePath}.`);
    if (candidate.content.length > MAX_FILE_SIZE) throw new Error(`File is too large: ${filePath}.`);
    if (secretPattern.test(candidate.content) && !files.get(filePath)?.includes('API_KEY')) {
      throw new Error(`Potential credential detected in proposed file: ${filePath}. No files were changed.`);
    }
    changes.push({ path: filePath, content: candidate.content, reason: String(candidate.reason || '') });
  }

  return {
    status: 'SUCCESS',
    rootCauseAnalysis: String(parsed.rootCauseAnalysis || `Applied requested change to ${changes.length} file(s).`),
    repairPlan: String(parsed.repairPlan || '1. Review workspace\n2. Apply validated changes\n3. Rebuild and verify.'),
    changes,
    provider: completion.routingInfo?.resolvedProvider || 'universal-ai-bridge',
    model: completion.model || 'auto',
    tokensUsed: 0,
    warnings: Array.isArray(parsed.warnings) ? parsed.warnings.map(String).slice(0, 10) : []
  };
}

/** Backwards-compatible single-file helper for existing callers. */
export async function autoModifyProject(filePath: string, userInstruction: string) {
  return { filePath: normalizeWorkspacePath(filePath), instruction: userInstruction };
}
