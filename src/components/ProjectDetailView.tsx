import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  Terminal,
  Play,
  Square,
  RefreshCw,
  Sparkles,
  Code2,
  Settings,
  Shield,
  KeyRound,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  ExternalLink,
  Github,
  CheckCircle2,
  AlertCircle,
  Clock,
  Cpu,
  Server,
  Monitor,
  Tablet,
  Smartphone,
  Copy,
  Check,
  FileCode,
  Save,
  ArrowRight,
  Activity,
  AlertTriangle,
  History
} from 'lucide-react';
import {
  Project,
  Build,
  BuildLogEntry,
  RuntimeInstance,
  AISession,
  EnvironmentVariable
} from '../types.js';

interface ProjectDetailViewProps {
  project: Project;
  initialTab?: string;
  onBackToDashboard: () => void;
  onRefreshProject: () => void;
}

export const ProjectDetailView: React.FC<ProjectDetailViewProps> = ({
  project,
  initialTab = 'overview',
  onBackToDashboard,
  onRefreshProject
}) => {
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [builds, setBuilds] = useState<Build[]>([]);
  const [selectedBuild, setSelectedBuild] = useState<Build | null>(null);
  const [logs, setLogs] = useState<BuildLogEntry[]>([]);
  const [logFilter, setLogFilter] = useState<string>('ALL');
  const [autoScroll, setAutoScroll] = useState(true);
  const [runtime, setRuntime] = useState<RuntimeInstance | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [aiSessions, setAiSessions] = useState<AISession[]>([]);
  const [isRepairing, setIsRepairing] = useState(false);
  const [files, setFiles] = useState<{ path: string; name: string; size: number }[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('package.json');
  const [fileContent, setFileContent] = useState<string>('');
  const [isSavingFile, setIsSavingFile] = useState(false);
  const [envVars, setEnvVars] = useState<EnvironmentVariable[]>([]);
  const [newEnvKey, setNewEnvKey] = useState('');
  const [newEnvVal, setNewEnvVal] = useState('');
  const [newEnvSecret, setNewEnvSecret] = useState(false);
  const [revealedSecrets, setRevealedSecrets] = useState<Record<string, boolean>>({});
  const [copiedLink, setCopiedLink] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [activeAppMode, setActiveAppMode] = useState<string>('');

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Sync initial tab when props change
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  // Load project builds, runtime, env vars, files, ai sessions
  const loadProjectData = async () => {
    try {
      // 1. Builds
      const bRes = await fetch(`/api/v1/projects/${project.id}/builds`);
      const bData = await bRes.json();
      setBuilds(bData);
      if (bData.length > 0 && !selectedBuild) {
        setSelectedBuild(bData[0]);
      }

      // 2. Runtime
      const rRes = await fetch(`/api/v1/projects/${project.id}/runtime`);
      const rData = await rRes.json();
      setRuntime(rData);

      // 3. AI Sessions
      const aiRes = await fetch(`/api/v1/projects/${project.id}/ai/sessions`);
      const aiData = await aiRes.json();
      setAiSessions(aiData);

      // 4. Env vars
      const envRes = await fetch(`/api/v1/projects/${project.id}/env`);
      const envData = await envRes.json();
      setEnvVars(envData);

      // 5. Files
      const fRes = await fetch(`/api/v1/projects/${project.id}/files`);
      const fData = await fRes.json();
      setFiles(fData);
      if (fData.length > 0 && !fileContent) {
        loadFileContent(fData[0].path);
      }
    } catch (err) {
      console.error('Failed to load project details:', err);
    }
  };

  useEffect(() => {
    loadProjectData();
    const interval = setInterval(loadProjectData, 3000);
    return () => clearInterval(interval);
  }, [project.id]);

  // Load logs for selected build
  useEffect(() => {
    if (!selectedBuild) return;

    // Fetch initial logs
    fetch(`/api/v1/builds/${selectedBuild.id}/logs`)
      .then((res) => res.json())
      .then((data) => setLogs(data))
      .catch((e) => console.error(e));

    // Listen to real-time SSE stream if build is active
    if (selectedBuild.status === 'BUILDING' || selectedBuild.status === 'QUEUED') {
      const eventSource = new EventSource(`/api/v1/builds/${selectedBuild.id}/logs/stream`);
      eventSource.onmessage = (event) => {
        try {
          const entry = JSON.parse(event.data);
          setLogs((prev) => {
            if (prev.some((p) => p.id === entry.id)) return prev;
            return [...prev, entry];
          });
        } catch (e) {
          // ignore parsing err
        }
      };
      return () => eventSource.close();
    }
  }, [selectedBuild?.id, selectedBuild?.status]);

  useEffect(() => {
    if (autoScroll && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs, autoScroll]);

  const loadFileContent = async (filePath: string) => {
    setSelectedFile(filePath);
    try {
      const res = await fetch(`/api/v1/projects/${project.id}/files/content?path=${encodeURIComponent(filePath)}`);
      const data = await res.json();
      setFileContent(data.content || '');
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveFile = async () => {
    setIsSavingFile(true);
    try {
      await fetch(`/api/v1/projects/${project.id}/files/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: selectedFile, content: fileContent })
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsSavingFile(false);
    }
  };

  const handleTriggerBuild = async (simulateFailure = false) => {
    try {
      const res = await fetch(`/api/v1/projects/${project.id}/build`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          simulateFailure,
          failureReason: simulateFailure
            ? 'npm ERR! code MODULE_NOT_FOUND: Cannot find module @types/express or conflicting peer dependency'
            : undefined
        })
      });
      const data = await res.json();
      if (data.build) {
        setSelectedBuild(data.build);
        setActiveTab('logs');
      }
      loadProjectData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunAiRepair = async () => {
    setIsRepairing(true);
    try {
      const res = await fetch(`/api/v1/projects/${project.id}/ai/repair`, {
        method: 'POST'
      });
      const session = await res.json();
      loadProjectData();
      setActiveTab('ai');
    } catch (e) {
      console.error(e);
    } finally {
      setIsRepairing(false);
    }
  };

  const handleRuntimeAction = async (action: 'start' | 'stop' | 'restart') => {
    if (!runtime) return;
    try {
      const res = await fetch(`/api/v1/runtime/${runtime.id}/${action}`, {
        method: 'POST'
      });
      const data = await res.json();
      setRuntime(data);
      setIframeKey((prev) => prev + 1);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddEnvVar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnvKey) return;
    try {
      const res = await fetch(`/api/v1/projects/${project.id}/env`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: newEnvKey, value: newEnvVal, isSecret: newEnvSecret })
      });
      const data = await res.json();
      setEnvVars((prev) => [...prev, data]);
      setNewEnvKey('');
      setNewEnvVal('');
      setNewEnvSecret(false);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteEnvVar = async (envId: string) => {
    try {
      await fetch(`/api/v1/projects/${project.id}/env/${envId}`, { method: 'DELETE' });
      setEnvVars((prev) => prev.filter((item) => item.id !== envId));
    } catch (e) {
      console.error(e);
    }
  };

  const latestBuild = builds[0] || project.latestBuild;
  const isFailed = latestBuild?.status === 'FAILED';
  const isRunning = runtime?.status === 'RUNNING';

  const filteredLogs = logs.filter((l) => {
    if (logFilter === 'ALL') return true;
    return l.level === logFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Header & Breadcrumb */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 text-white flex items-center justify-center font-bold text-lg shadow-md shrink-0">
              {project.framework.slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  {project.name}
                </h1>
                <span className="text-xs px-2.5 py-0.5 rounded-md font-semibold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                  {project.framework}
                </span>
                <span className="text-xs px-2.5 py-0.5 rounded-md font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  :{project.port}
                </span>
                {isRunning ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Live App Online
                  </span>
                ) : isFailed ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Build Failed
                  </span>
                ) : (
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-slate-100 dark:bg-slate-800 text-slate-500">
                    Ready
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono">
                <a
                  href={project.repositoryUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="hover:text-blue-500 flex items-center gap-1"
                >
                  <Github className="w-3.5 h-3.5" />
                  {project.repositoryUrl.replace('https://github.com/', '')}
                </a>
                <span>•</span>
                <span>branch: {project.defaultBranch}</span>
                <span>•</span>
                <span>commit: {project.currentCommitSha.slice(0, 7)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            {isFailed && (
              <button
                onClick={handleRunAiRepair}
                disabled={isRepairing}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md transition cursor-pointer active:scale-95"
              >
                <Sparkles className="w-4 h-4" />
                <span>{isRepairing ? 'AI Diagnosing...' : 'AI Auto-Fix'}</span>
              </button>
            )}

            <button
              onClick={() => handleTriggerBuild(false)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-sm transition cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Re-build</span>
            </button>

            <button
              onClick={() => handleTriggerBuild(true)}
              title="Deliberately simulate a broken build to demo the AI Repair Engine!"
              className="flex items-center gap-1 px-2.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 text-xs font-medium border border-slate-200 dark:border-slate-700 transition cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Simulate Failure</span>
            </button>

            {isRunning ? (
              <button
                onClick={() => handleRuntimeAction('stop')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 text-amber-700 dark:text-amber-300 text-xs font-semibold border border-amber-200 dark:border-amber-800 transition cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop App</span>
              </button>
            ) : (
              <button
                onClick={() => handleRuntimeAction('start')}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 text-xs font-semibold border border-emerald-200 dark:border-emerald-800 transition cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Start App</span>
              </button>
            )}

            <button
              onClick={() => setActiveTab('preview')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold shadow-sm transition cursor-pointer active:scale-95"
            >
              <Play className="w-3.5 h-3.5 fill-current text-blue-500" />
              <span>Live Preview</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 mt-6 border-t border-slate-100 dark:border-slate-800 pt-3 overflow-x-auto text-xs font-semibold">
          {[
            { id: 'overview', label: 'Overview', icon: Layers },
            { id: 'builds', label: 'Builds', icon: History, badge: builds.length },
            { id: 'logs', label: 'Live Logs', icon: Terminal },
            { id: 'preview', label: 'Runtime & Preview', icon: Play },
            { id: 'ai', label: 'AI Repair Studio', icon: Sparkles, highlight: isFailed },
            { id: 'editor', label: 'Code Editor', icon: Code2 },
            { id: 'env', label: 'Environment', icon: KeyRound, badge: envVars.length }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl transition cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : tab.highlight
                    ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      isActive ? 'bg-blue-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Prominent Live Application Ready Banner */}
      {isRunning && (
        <div className="bg-gradient-to-r from-emerald-600/15 via-teal-600/10 to-blue-600/10 border border-emerald-500/30 dark:border-emerald-500/20 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                  🎉 Container Live & Ready
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  Port <strong className="text-slate-900 dark:text-white">:{project.port}</strong>
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                {project.name} is running and ready for you to test!
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                The repository has been successfully built and is active inside an isolated Linux sandbox container.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => setActiveTab('preview')}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer flex items-center gap-2 active:scale-95"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch Live Sandbox</span>
            </button>
            <a
              href={`/api/v1/preview/${runtime?.id || 'default'}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-xs"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Open in New Tab ↗</span>
            </a>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 1: OVERVIEW */}
      {/* ========================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Runtime Status Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Active Sandbox Runtime
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>

              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {runtime?.status || 'STOPPED'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Assigned Container Port: <strong className="text-emerald-500 font-mono">:{project.port}</strong>
                </p>
              </div>

              <div className="space-y-2 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex justify-between text-slate-500">
                  <span>CPU Allocation:</span>
                  <strong className="text-slate-900 dark:text-white">{runtime?.cpuLimit ?? 1.0} vCPU</strong>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Memory Quota:</span>
                  <strong className="text-slate-900 dark:text-white">{runtime?.memoryLimit ?? 1024} MB</strong>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Health Probe:</span>
                  <strong className="text-emerald-500">HTTP 200 (OK)</strong>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('preview')}
                className="w-full py-2.5 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                Launch Interactive Preview
              </button>
            </div>

            {/* Build Spec & Pipeline Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Build Specification
              </span>

              <div className="space-y-2 text-xs font-mono">
                <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                  <span className="text-slate-400 block text-[10px] uppercase font-sans">Install Command</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">
                    {latestBuild?.buildPlan?.installCommand || 'npm ci'}
                  </span>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                  <span className="text-slate-400 block text-[10px] uppercase font-sans">Build Command</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">
                    {latestBuild?.buildPlan?.buildCommand || 'npm run build'}
                  </span>
                </div>
                <div className="p-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg">
                  <span className="text-slate-400 block text-[10px] uppercase font-sans">Start Command</span>
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">
                    {latestBuild?.buildPlan?.startCommand || 'npm run preview'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('logs')}
                className="w-full py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Terminal className="w-3.5 h-3.5" />
                View Terminal Output
              </button>
            </div>

            {/* AI Repair & Security Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-4">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                AI Diagnostics & Health
              </span>

              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50/50 to-blue-50/50 dark:from-indigo-950/30 dark:to-blue-950/30 border border-blue-200 dark:border-blue-900/60 space-y-2">
                <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs">
                  <Sparkles className="w-4 h-4" />
                  <span>Autonomous Repair Agent</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Monitors build logs and runtime exceptions. When a build fails, click Auto-Fix to apply targeted code and dependency patches.
                </p>
              </div>

              <div className="space-y-1.5 text-xs text-slate-500">
                <div className="flex justify-between">
                  <span>Security Sandbox:</span>
                  <strong className="text-emerald-500">Strict Non-Root</strong>
                </div>
                <div className="flex justify-between">
                  <span>SSRF Egress:</span>
                  <strong className="text-emerald-500">Protected</strong>
                </div>
                <div className="flex justify-between">
                  <span>AI Repair Sessions:</span>
                  <strong className="text-slate-900 dark:text-white">{aiSessions.length} total</strong>
                </div>
              </div>

              <button
                onClick={() => setActiveTab('ai')}
                className="w-full py-2.5 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Open AI Studio
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 2: BUILDS HISTORY */}
      {/* ========================================================== */}
      {activeTab === 'builds' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Build History</h2>
            <div className="flex gap-2">
              <button
                onClick={() => handleTriggerBuild(true)}
                className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 text-rose-600 text-xs font-semibold rounded-lg border border-rose-200 dark:border-rose-900 cursor-pointer"
              >
                Test Broken Build
              </button>
              <button
                onClick={() => handleTriggerBuild(false)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
              >
                Trigger Clean Build
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4 sm:px-6">Build ID</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Commit & Branch</th>
                  <th className="py-3 px-4">Duration</th>
                  <th className="py-3 px-4">Triggered At</th>
                  <th className="py-3 px-4 sm:px-6 text-right">Logs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {builds.map((b) => (
                  <tr
                    key={b.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                      selectedBuild?.id === b.id ? 'bg-blue-50/50 dark:bg-blue-950/30' : ''
                    }`}
                  >
                    <td className="py-3 px-4 sm:px-6 font-mono font-bold text-slate-900 dark:text-white">
                      #{b.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-4">
                      {b.status === 'SUCCESS' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          SUCCESS
                        </span>
                      ) : b.status === 'FAILED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                          <AlertCircle className="w-3 h-3" />
                          FAILED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          {b.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600 dark:text-slate-300">
                      <span className="font-semibold text-slate-800 dark:text-slate-100">{b.branch}</span>
                      <span className="text-slate-400 ml-1.5">({b.commitSha.slice(0, 7)})</span>
                      {b.commitMessage && (
                        <p className="text-[11px] text-slate-400 font-sans truncate max-w-xs">{b.commitMessage}</p>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-500">
                      {b.durationSeconds ? `${b.durationSeconds}s` : 'running...'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {new Date(b.startedAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 sm:px-6 text-right">
                      <button
                        onClick={() => {
                          setSelectedBuild(b);
                          setActiveTab('logs');
                        }}
                        className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-medium transition cursor-pointer"
                      >
                        Inspect Logs
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 3: REAL-TIME LIVE LOGS TERMINAL (SSE) */}
      {/* ========================================================== */}
      {activeTab === 'logs' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Log Stream: Build #{selectedBuild?.id.slice(0, 8) || 'latest'}
              </span>
              {selectedBuild?.status === 'BUILDING' && (
                <span className="inline-flex items-center gap-1 text-[11px] text-amber-500 font-mono">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  Streaming live (SSE)...
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-xs">
                {['ALL', 'INFO', 'STEP', 'ERROR'].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setLogFilter(lvl)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition cursor-pointer ${
                      logFilter === lvl
                        ? 'bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-900'
                        : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setAutoScroll(!autoScroll)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium border border-slate-200 dark:border-slate-700 transition cursor-pointer ${
                  autoScroll ? 'bg-blue-50 dark:bg-blue-900/40 text-blue-600' : 'text-slate-400'
                }`}
              >
                Auto-scroll: {autoScroll ? 'ON' : 'OFF'}
              </button>

              <button
                onClick={() => {
                  navigator.clipboard.writeText(logs.map((l) => `[${l.timestamp}] [${l.level}] ${l.message}`).join('\n'));
                  alert('Logs copied to clipboard!');
                }}
                className="px-2.5 py-1 rounded-md text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition cursor-pointer"
              >
                Copy Logs
              </button>
            </div>
          </div>

          {/* Terminal Box */}
          <div className="bg-slate-950 text-slate-200 font-mono text-xs rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-2xl h-[460px] overflow-y-auto flex flex-col justify-between">
            <div className="space-y-1.5">
              {filteredLogs.length === 0 ? (
                <div className="text-slate-500 py-8 text-center">
                  No log entries recorded for this filter.
                </div>
              ) : (
                filteredLogs.map((log, idx) => {
                  const isError = log.level === 'ERROR';
                  const isStep = log.level === 'STEP';
                  const isWarn = log.level === 'WARN';

                  return (
                    <div key={`${log.id}-${idx}`} className="flex items-start gap-2.5 leading-relaxed">
                      <span className="text-slate-500 text-[10px] shrink-0 select-none">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.2 rounded select-none shrink-0 ${
                          isError
                            ? 'bg-rose-950 text-rose-400 border border-rose-900'
                            : isStep
                            ? 'bg-blue-950 text-blue-400 border border-blue-900'
                            : isWarn
                            ? 'bg-amber-950 text-amber-400 border border-amber-900'
                            : 'bg-slate-900 text-slate-400'
                        }`}
                      >
                        {log.level}
                      </span>
                      <span
                        className={`flex-1 break-all ${
                          isError
                            ? 'text-rose-300 font-bold'
                            : isStep
                            ? 'text-cyan-300 font-semibold'
                            : 'text-slate-300'
                        }`}
                      >
                        {log.message}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={logsEndRef} />
            </div>

            {/* Status footer bar */}
            <div className="mt-4 pt-3 border-t border-slate-900 flex items-center justify-between text-[11px] text-slate-500">
              <span>Exit Code: {selectedBuild?.status === 'SUCCESS' ? '0' : selectedBuild?.status === 'FAILED' ? '1' : 'running'}</span>
              <span>Worker Node: sandboxed-builder-04</span>
            </div>
          </div>

          {/* Build Success Launch Banner in Logs tab */}
          {selectedBuild?.status === 'SUCCESS' && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold shrink-0">
                  ✓
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-300">
                    Build Successful & Container Started
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    The build completed with exit code 0. Your application is live and listening on port :{project.port}.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setActiveTab('preview')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer flex items-center gap-1.5 active:scale-95"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Launch Live Preview</span>
                </button>
                <a
                  href={`/api/v1/preview/${runtime?.id || project.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition flex items-center gap-1 shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>New Window ↗</span>
                </a>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 4: RUNTIME & LIVE PREVIEW (IFRAME) */}
      {/* ========================================================== */}
      {activeTab === 'preview' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shadow-xs">
            {/* Device Switcher & App Mode Switcher */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setPreviewDevice('desktop')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    previewDevice === 'desktop' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs' : 'text-slate-400'
                  }`}
                  title="Desktop 100%"
                >
                  <Monitor className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewDevice('tablet')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    previewDevice === 'tablet' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs' : 'text-slate-400'
                  }`}
                  title="Tablet 768px"
                >
                  <Tablet className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPreviewDevice('mobile')}
                  className={`p-1.5 rounded-lg transition cursor-pointer ${
                    previewDevice === 'mobile' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-xs' : 'text-slate-400'
                  }`}
                  title="Mobile 375px"
                >
                  <Smartphone className="w-4 h-4" />
                </button>
              </div>

              {/* App Mode Switcher Selector */}
              <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 px-2.5 py-1 rounded-xl text-xs">
                <span className="text-blue-600 dark:text-blue-400 font-semibold hidden sm:inline">📱 تجربة التطبيق:</span>
                <select
                  value={activeAppMode}
                  onChange={(e) => setActiveAppMode(e.target.value)}
                  className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 border border-blue-300 dark:border-blue-700 rounded-lg px-2 py-1 text-xs font-semibold outline-none cursor-pointer focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">✨ تلقائي (تطبيق المستودع)</option>
                  <option value="ecommerce">🛒 متجر إلكتروني (E-Commerce)</option>
                  <option value="calculator">🔢 آلة حاسبة تفاعلية (Calculator)</option>
                  <option value="weather">🌦️ توقعات الطقس (Live Weather)</option>
                  <option value="notes">📝 مفكرة وملاحظات (Markdown Notes)</option>
                  <option value="kanban">📋 لوحة مهام كانبان (Kanban Board)</option>
                  <option value="game">🎮 لعبة 2048 (Playable Game)</option>
                  <option value="saas">📊 لوحة أعمال (SaaS Dashboard)</option>
                  <option value="agent">🤖 مساعد ذكي (AI Agent Studio)</option>
                  <option value="api">⚡ واجهة برمجية (API Sandbox)</option>
                </select>
              </div>
            </div>

            {/* Address Bar */}
            <div className="flex-1 max-w-lg flex items-center gap-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3.5 py-1.5 rounded-xl font-mono text-xs text-slate-700 dark:text-slate-300">
              <span className="text-emerald-500 font-bold">https://</span>
              <span className="truncate flex-1">
                {project.customDomain || `${project.name}.preview.git2live.dev`}
              </span>
              <button
                onClick={() => setIframeKey((prev) => prev + 1)}
                className="hover:text-blue-500 p-1 cursor-pointer"
                title="Refresh Iframe"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <a
                href={`/api/v1/preview/${runtime?.id || project.id}${activeAppMode ? `?mode=${activeAppMode}` : ''}`}
                target="_blank"
                rel="noreferrer"
                className="hover:text-blue-500 p-1"
                title="فتح في نافذة كاملة"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            {/* Runtime Quick Action */}
            <div className="flex items-center gap-2">
              <a
                href={`/api/v1/preview/${runtime?.id || project.id}${activeAppMode ? `?mode=${activeAppMode}` : ''}`}
                target="_blank"
                rel="noreferrer"
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-sm"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>فتح التطبيق بالكامل ↗</span>
              </a>

              {isRunning ? (
                <button
                  onClick={() => handleRuntimeAction('restart')}
                  className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <RefreshCw className="w-3 h-3" />
                  Restart
                </button>
              ) : (
                <button
                  onClick={() => handleRuntimeAction('start')}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3 fill-current" />
                  Start Container
                </button>
              )}
            </div>
          </div>

          {/* Quick Explanatory Guidance Banner */}
          <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-500/20 rounded-xl px-4 py-2.5 flex items-center justify-between text-xs text-blue-700 dark:text-blue-300">
            <div className="flex items-center gap-2">
              <span className="text-base">🚀</span>
              <span>
                <strong>التطبيق المباشر جاهز للتجربة:</strong> يمكنك الضغط والتفاعل مع كافة عناصر التطبيق بالأسفل، أو الضغط على <strong>&quot;فتح التطبيق بالكامل ↗&quot;</strong> لفتحه في نافذة متصفح مستقلة.
              </span>
            </div>
          </div>

          {/* Sandbox Iframe Window */}
          <div className="bg-slate-900 rounded-2xl p-2 sm:p-4 border border-slate-800 flex justify-center items-center min-h-[660px] shadow-2xl">
            <div
              className="bg-white rounded-xl overflow-hidden shadow-2xl border border-slate-700 transition-all duration-300 w-full"
              style={{
                maxWidth:
                  previewDevice === 'mobile'
                    ? '390px'
                    : previewDevice === 'tablet'
                    ? '768px'
                    : '100%',
                height: '640px'
              }}
            >
              <iframe
                key={`${iframeKey}-${activeAppMode}`}
                src={`/api/v1/preview/${runtime?.id || project.id}${activeAppMode ? `?mode=${activeAppMode}` : ''}`}
                title="Live Application Preview"
                className="w-full h-full border-0"
                sandbox="allow-scripts allow-same-origin allow-forms allow-modals"
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 5: AI REPAIR STUDIO */}
      {/* ========================================================== */}
      {activeTab === 'ai' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 border border-blue-200 dark:border-blue-900 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Autonomous AI DevOps Repair Engine</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                Zero-Friction Build Error Healing
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-xl">
                Git2Live inspects stack traces, isolates missing packages, types, or bad ports, generates an atomic diff patch, and rebuilds automatically.
              </p>
            </div>

            <button
              onClick={handleRunAiRepair}
              disabled={isRepairing}
              className="px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-lg transition active:scale-95 flex items-center gap-2 cursor-pointer self-start md:self-auto"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isRepairing ? 'Running Diagnostics & Repair...' : 'Execute AI Auto-Fix'}</span>
            </button>
          </div>

          {/* AI Repair Sessions History / Current Active Session */}
          {aiSessions.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
              <Sparkles className="w-8 h-8 text-slate-400 mx-auto" />
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-sm">No Active Repair Sessions</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Trigger a simulated broken build from the Builds tab or click "Execute AI Auto-Fix" above to observe the AI repair cycle in action.
              </p>
            </div>
          ) : (
            aiSessions.map((session) => (
              <div
                key={session.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5 shadow-xs"
              >
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center font-bold text-xs">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                        AI Repair Session #{session.id.slice(0, 10)}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Provider: {session.provider} • Model: {session.model}
                      </p>
                    </div>
                  </div>

                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    Category: {session.errorClassification}
                  </span>
                </div>

                {/* Root Cause & Plan */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase">Root Cause Analysis</p>
                    <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
                      {session.rootCauseAnalysis}
                    </p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl space-y-1">
                    <p className="text-xs font-bold text-slate-400 uppercase">Repair Execution Plan</p>
                    <pre className="text-xs text-slate-800 dark:text-slate-200 whitespace-pre-wrap font-sans">
                      {session.repairPlan}
                    </pre>
                  </div>
                </div>

                {/* Tool Calling Log & Steps */}
                <div className="space-y-3 pt-2">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Agent Action Steps & Code Patch
                  </p>
                  <div className="space-y-2">
                    {session.steps.map((step) => (
                      <div
                        key={step.stepNumber}
                        className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3.5 space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 flex items-center justify-center text-[10px]">
                              {step.stepNumber}
                            </span>
                            {step.title}
                          </span>
                          <span className="text-emerald-500 font-semibold text-[11px]">✓ Completed</span>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400">{step.description}</p>

                        {/* Diff Box if present */}
                        {step.diff && (
                          <div className="mt-2 bg-slate-950 text-slate-200 p-3 rounded-lg font-mono text-[11px] overflow-x-auto border border-slate-800">
                            <div className="text-slate-500 pb-1 mb-1 border-b border-slate-800">
                              Target file: {step.targetFile || 'package.json'}
                            </div>
                            <pre className="text-emerald-400">{step.diff}</pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 6: ONLINE CODE EDITOR */}
      {/* ========================================================== */}
      {activeTab === 'editor' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-blue-500" />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 font-mono">
                {selectedFile}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveFile}
                disabled={isSavingFile}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-xs transition cursor-pointer active:scale-95"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSavingFile ? 'Saving...' : 'Save & Trigger Build'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 min-h-[480px]">
            {/* File Tree Column */}
            <div className="border-r border-slate-200 dark:border-slate-800 p-3 bg-slate-50/50 dark:bg-slate-900/50 space-y-1">
              <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider px-2 py-1">
                Workspace Files
              </p>
              {files.map((file) => (
                <button
                  key={file.path}
                  onClick={() => loadFileContent(file.path)}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono transition flex items-center justify-between cursor-pointer ${
                    selectedFile === file.path
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span className="truncate">{file.name}</span>
                  <span className="text-[10px] opacity-60">
                    {Math.round(file.size / 1024 * 10) / 10}KB
                  </span>
                </button>
              ))}
            </div>

            {/* Code Editor Column */}
            <div className="md:col-span-3 p-4 bg-slate-950 font-mono">
              <textarea
                value={fileContent}
                onChange={(e) => setFileContent(e.target.value)}
                rows={22}
                className="w-full h-full bg-transparent text-slate-200 text-xs outline-none resize-none font-mono leading-relaxed"
                spellCheck={false}
              />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================== */}
      {/* TAB 7: ENVIRONMENT VARIABLES & SETTINGS */}
      {/* ========================================================== */}
      {activeTab === 'env' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4 shadow-xs">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Environment Variables & Secrets
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Encrypted environment variables are injected at runtime into the sandboxed container process without leaking to source control.
            </p>

            {/* Form to add variable */}
            <form onSubmit={handleAddEnvVar} className="flex flex-col sm:flex-row gap-2 pt-2">
              <input
                type="text"
                placeholder="VARIABLE_NAME"
                value={newEnvKey}
                onChange={(e) => setNewEnvKey(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Variable Value"
                value={newEnvVal}
                onChange={(e) => setNewEnvVal(e.target.value)}
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
              />
              <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 px-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={newEnvSecret}
                  onChange={(e) => setNewEnvSecret(e.target.checked)}
                  className="rounded border-slate-300"
                />
                Secret
              </label>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl transition cursor-pointer"
              >
                Add Variable
              </button>
            </form>

            {/* Variables Table */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden mt-4">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2.5 px-4 font-mono">Key</th>
                    <th className="py-2.5 px-4 font-mono">Value</th>
                    <th className="py-2.5 px-4">Type</th>
                    <th className="py-2.5 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
                  {envVars.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-slate-400 font-sans">
                        No environment variables defined.
                      </td>
                    </tr>
                  ) : (
                    envVars.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-4 font-bold text-slate-800 dark:text-slate-200">
                          {item.key}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600 dark:text-slate-400">
                          {item.isSecret && !revealedSecrets[item.id] ? '••••••••••••••••' : item.value}
                        </td>
                        <td className="py-2.5 px-4 font-sans text-xs">
                          {item.isSecret ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                              Secret
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px]">
                              Plaintext
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {item.isSecret && (
                              <button
                                onClick={() =>
                                  setRevealedSecrets((prev) => ({
                                    ...prev,
                                    [item.id]: !prev[item.id]
                                  }))
                                }
                                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                              >
                                {revealedSecrets[item.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                              </button>
                            )}
                            <button
                              onClick={() => handleDeleteEnvVar(item.id)}
                              className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
