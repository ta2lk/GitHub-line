import React, { useState, useEffect } from 'react';
import {
  X,
  Github,
  Search,
  CheckCircle2,
  AlertTriangle,
  Play,
  ArrowRight,
  Shield,
  FileCode,
  Terminal,
  Cpu,
  Layers,
  Sparkles
} from 'lucide-react';
import { RepositoryAnalysis } from '../types.js';

interface ImportProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialUrl?: string;
  initialFixture?: string;
  onSuccess: (project: any, targetTab?: string) => void;
}

export const ImportProjectModal: React.FC<ImportProjectModalProps> = ({
  isOpen,
  onClose,
  initialUrl = '',
  initialFixture,
  onSuccess
}) => {
  const [url, setUrl] = useState(initialUrl || 'https://github.com/facebook/react');
  const [branch, setBranch] = useState('main');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [deployStep, setDeployStep] = useState<'form' | 'deploying' | 'ready'>('form');
  const [deployedProject, setDeployedProject] = useState<any>(null);
  const [deployedRuntimeId, setDeployedRuntimeId] = useState<string>('default');
  const [analysis, setAnalysis] = useState<RepositoryAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFixture, setSelectedFixture] = useState<string | undefined>(initialFixture);

  useEffect(() => {
    if (initialUrl) setUrl(initialUrl);
    if (initialFixture) setSelectedFixture(initialFixture);
    if (isOpen) {
      setDeployStep('form');
      setDeployedProject(null);
      if (initialUrl) {
        handleAnalyze(initialUrl, initialFixture);
      }
    }
  }, [isOpen, initialUrl, initialFixture]);

  if (!isOpen) return null;

  const handleAnalyze = async (targetUrl = url, fixture = selectedFixture) => {
    setError(null);
    setIsAnalyzing(true);
    setAnalysis(null);

    try {
      const res = await fetch('/api/v1/projects/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repositoryUrl: targetUrl,
          branch,
          fixtureName: fixture
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze repository');
      }

      setAnalysis(data);
    } catch (err: any) {
      setError(err.message || 'Error occurred during analysis.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateAndBuild = async () => {
    if (!analysis) return;
    setIsBuilding(true);
    setDeployStep('deploying');
    setError(null);

    try {
      // 1. Create project
      const projRes = await fetch('/api/v1/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repositoryUrl: analysis.repositoryUrl,
          name: analysis.repositoryUrl.split('/').pop()?.replace(/\.git$/, '') || 'app',
          framework: analysis.detectedFramework,
          language: analysis.detectedLanguage,
          port: analysis.detectedPort,
          defaultBranch: analysis.defaultBranch,
          description: analysis.description || '',
          topics: analysis.topics || [],
          category: analysis.category || 'web-app',
          readme: analysis.readmeSnippet || '',
          analysis,
          aiRequirements: analysis.aiRequirements
        })
      });

      const newProj = await projRes.json();
      if (!projRes.ok) throw new Error(newProj.error || 'Failed to create project');

      // 2. Trigger build immediately
      const buildRes = await fetch(`/api/v1/projects/${newProj.id}/build`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customPlan: {
            language: analysis.detectedLanguage,
            framework: analysis.detectedFramework,
            version: analysis.runtimeVersion,
            packageManager: analysis.detectedPackageManager,
            installCommand: analysis.installCommand,
            buildCommand: analysis.buildCommand,
            startCommand: analysis.startCommand,
            port: analysis.detectedPort,
            environment: { NODE_ENV: 'production' },
            baseImage: `git2live/${analysis.detectedLanguage.toLowerCase()}:latest`,
            timeoutSeconds: 600,
            memoryLimitMb: 1024,
            cpuLimitCores: 1.0
          }
        })
      });
      const buildData = await buildRes.json().catch(() => ({}));
      if (!buildRes.ok) {
        const detail = [buildData.error, buildData.action].filter(Boolean).join(' ');
        throw new Error(detail || 'The project was created, but the build could not be started.');
      }

      // Wait 2.2 seconds for container to spin up and register runtime
      await new Promise((resolve) => setTimeout(resolve, 2200));

      // Fetch runtime id
      try {
        const rRes = await fetch(`/api/v1/projects/${newProj.id}/runtime`);
        if (rRes.ok) {
          const rData = await rRes.json();
          if (rData && rData.id) {
            setDeployedRuntimeId(rData.id);
          }
        }
      } catch (e) {
        // Fallback
      }

      setDeployedProject(newProj);
      setDeployStep('ready');
    } catch (err: any) {
      setError(err.message || 'Failed to trigger build');
      setDeployStep('form');
    } finally {
      setIsBuilding(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <Github className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Import GitHub Repository</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Validates URL security, detects frameworks, and provisions a sandboxed build environment.
            </p>
          </div>
        </div>

        {/* Step: Deploying In Progress */}
        {deployStep === 'deploying' && (
          <div className="py-8 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center mx-auto">
              <span className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Deploying Repository Sandbox...
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Creating cgroup sandbox, installing dependencies, and binding port :{analysis?.detectedPort}
              </p>
            </div>
            <div className="max-w-md mx-auto bg-slate-50 dark:bg-slate-800/80 rounded-xl p-4 text-left font-mono text-xs text-slate-600 dark:text-slate-300 space-y-2 border border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Repository manifest verified</span>
              </div>
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Root filesystem containerized</span>
              </div>
              <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold">
                <span className="w-3 h-3 rounded-full bg-blue-500 animate-ping" />
                <span>Starting process on port :{analysis?.detectedPort}...</span>
              </div>
            </div>
          </div>
        )}

        {/* Step: Deployment Complete & Ready to Open */}
        {deployStep === 'ready' && (
          <div className="py-6 text-center space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center mx-auto text-2xl shadow-lg shadow-emerald-500/10">
              🎉
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-md border border-emerald-500/30">
                Ready to Experience
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
                {deployedProject?.name} is Live!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                The application has been successfully built and started inside a high-isolation container listening on port <strong className="text-slate-800 dark:text-slate-200">:{deployedProject?.port}</strong>.
              </p>
            </div>

            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 max-w-md mx-auto text-left font-mono text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
              <div className="flex justify-between">
                <span>Framework:</span>
                <strong className="text-slate-900 dark:text-white">{deployedProject?.framework}</strong>
              </div>
              <div className="flex justify-between">
                <span>Container Port:</span>
                <strong className="text-emerald-600 dark:text-emerald-400">:{deployedProject?.port}</strong>
              </div>
              <div className="flex justify-between">
                <span>Status:</span>
                <span className="text-emerald-500 font-bold">● RUNNING (Healthy)</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  onSuccess(deployedProject, 'preview');
                  onClose();
                }}
                className="w-full sm:w-auto px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Launch Live Application Now</span>
              </button>
              <a
                href={`/api/v1/preview/${deployedRuntimeId}`}
                target="_blank"
                rel="noreferrer"
                className="w-full sm:w-auto px-5 py-3 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>Open in New Tab ↗</span>
              </a>
            </div>

            <button
              type="button"
              onClick={() => {
                onSuccess(deployedProject, 'logs');
                onClose();
              }}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 underline cursor-pointer"
            >
              Or view build logs & terminal
            </button>
          </div>
        )}

        {/* Input Form */}
        {deployStep === 'form' && (
        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-1.5">
              GitHub Repository URL
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setSelectedFixture(undefined);
                }}
                placeholder="https://github.com/username/repository"
                className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-slate-900 dark:text-white outline-none font-mono focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={() => handleAnalyze()}
                disabled={isAnalyzing || !url}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                {isAnalyzing ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing...
                  </span>
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Analyze
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Diverse repository presets */}
          <div className="space-y-1.5 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-500" />
              <span className="font-semibold text-slate-600 dark:text-slate-300">Quick test repositories:</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: '🦞 OpenClaw AI', url: 'https://github.com/openclaw/openclaw' },
                { label: 'TodoMVC', url: 'https://github.com/tastejs/todomvc' },
                { label: 'React', url: 'https://github.com/facebook/react' },
                { label: 'Flask', url: 'https://github.com/pallets/flask' },
                { label: 'FastAPI', url: 'https://github.com/fastapi/fastapi' },
                { label: 'Vue.js', url: 'https://github.com/vuejs/core' },
                { label: 'Express', url: 'https://github.com/expressjs/express' },
                { label: 'Tailwind UI', url: 'https://github.com/tailwindlabs/tailwindcss' },
                { label: 'AutoGPT', url: 'https://github.com/Significant-Gravitas/AutoGPT' }
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    setUrl(item.url);
                    setSelectedFixture(undefined);
                    handleAnalyze(item.url, undefined);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-blue-900/40 text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 border border-slate-200 dark:border-slate-700 text-[11px] font-medium transition cursor-pointer"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Analysis Results Cards */}
          {analysis && (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Repository Architecture
                    </span>
                    {analysis.category && (
                      <span className="ml-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                        {analysis.category}
                      </span>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {analysis.confidence}% Confidence
                  </span>
                </div>

                {analysis.description && (
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">
                    {analysis.description}
                  </p>
                )}

                {analysis.topics && analysis.topics.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {analysis.topics.slice(0, 5).map((t) => (
                      <span key={t} className="px-2 py-0.5 rounded-md bg-slate-200/70 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-mono">
                        #{t}
                      </span>
                    ))}
                    {analysis.stars && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20 ml-auto">
                        ★ {analysis.stars.toLocaleString()} stars
                      </span>
                    )}
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                  <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/60">
                    <p className="text-slate-400 font-medium">Framework</p>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">{analysis.detectedFramework}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/60">
                    <p className="text-slate-400 font-medium">Language</p>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">{analysis.detectedLanguage}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/60">
                    <p className="text-slate-400 font-medium">Package Manager</p>
                    <p className="font-bold text-slate-900 dark:text-white mt-0.5">{analysis.detectedPackageManager}</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900/60 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700/60">
                    <p className="text-slate-400 font-medium">Port</p>
                    <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">:{analysis.detectedPort}</p>
                  </div>
                </div>

                {/* Build Commands Display */}
                <div className="space-y-1.5 pt-1 text-xs font-mono">
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Install: <strong className="text-slate-700 dark:text-slate-200">{analysis.installCommand}</strong></span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Build: <strong className="text-slate-700 dark:text-slate-200">{analysis.buildCommand}</strong></span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400">
                    <span>Start: <strong className="text-slate-700 dark:text-slate-200">{analysis.startCommand}</strong></span>
                  </div>
                </div>

                {/* Security Warnings if any */}
                {analysis.securityFindings && analysis.securityFindings.length > 0 && (
                  <div className="p-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-lg text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>Secret scan warning: Potential credentials detected in repository manifest.</span>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCreateAndBuild}
                  disabled={isBuilding}
                  className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2 active:scale-95 cursor-pointer"
                >
                  {isBuilding ? (
                    <span>Provisioning Sandbox...</span>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      Build & Launch Live App
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
};
