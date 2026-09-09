import React, { useState } from 'react';
import {
  Github,
  ArrowRight,
  Sparkles,
  Zap,
  Play,
  Terminal,
  ShieldCheck,
  Cpu,
  Layers,
  CheckCircle,
  RefreshCw,
  Search
} from 'lucide-react';

interface LandingHeroProps {
  onStartImport: (initialUrl?: string, fixture?: string) => void;
  onOpenDashboard: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onStartImport, onOpenDashboard }) => {
  const [urlInput, setUrlInput] = useState('https://github.com/facebook/react');

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-between py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="text-center max-w-4xl mx-auto space-y-6 pt-4">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/70 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold shadow-xs">
          <Sparkles className="w-3.5 h-3.5 text-blue-500" />
          <span>Git2Live Autonomous Engine • Zero-Config Cloud Preview</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight">
          Turn Any GitHub Project Into a{' '}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
            Live App
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
          Import a repository, build it automatically, fix errors with AI, and launch a live preview directly in your browser.
        </p>

        {/* Quick URL Input Bar */}
        <div className="max-w-2xl mx-auto mt-8 bg-white dark:bg-slate-800/90 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col sm:flex-row gap-2">
          <div className="flex-1 flex items-center gap-2.5 px-3 py-2 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <Github className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="https://github.com/user/project"
              className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 outline-none font-mono"
            />
          </div>
          <button
            onClick={() => onStartImport(urlInput)}
            className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold px-6 py-3 rounded-xl shadow-md transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <span>Analyze & Launch</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Visual Pipeline (Requirement #10) */}
        <div className="pt-8 pb-4">
          <div className="text-xs font-semibold tracking-wider text-slate-400 uppercase mb-4">
            Automated Execution Pipeline
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 max-w-4xl mx-auto">
            {[
              { title: '1. GitHub', desc: 'SSRF verification & tree clone', icon: Github, color: 'text-purple-500' },
              { title: '2. Analyze', desc: 'Framework & port scoring', icon: Search, color: 'text-blue-500' },
              { title: '3. Build', desc: 'Isolated sandbox compilation', icon: Terminal, color: 'text-amber-500' },
              { title: '4. AI Fix', desc: 'Automated diagnostic patch', icon: Sparkles, color: 'text-emerald-500' },
              { title: '5. Live', desc: 'Instant interactive iframe', icon: Play, color: 'text-cyan-500' }
            ].map((step, idx) => {
              const Icon = step.icon;
              return (
                <div
                  key={step.title}
                  className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3.5 text-left relative shadow-xs"
                >
                  <Icon className={`w-5 h-5 ${step.color} mb-2`} />
                  <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{step.title}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">{step.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* 1-Click Fast Fixture Presets */}
        <div className="pt-4 max-w-3xl mx-auto">
          <p className="text-xs text-slate-400 font-medium mb-3">Or explore pre-configured test fixtures:</p>
          <div className="flex flex-wrap justify-center gap-2.5">
            <button
              onClick={() => onStartImport('https://github.com/facebook/react', 'simple-vite')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              React + Vite (:5173)
            </button>
            <button
              onClick={() => onStartImport('https://github.com/vercel/next.js', 'simple-next')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-500" />
              Next.js (:3000)
            </button>
            <button
              onClick={() => onStartImport('https://github.com/tiangolo/fastapi', 'simple-python')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Python FastAPI (:8000)
            </button>
            <button
              onClick={onOpenDashboard}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 text-xs font-semibold text-blue-700 dark:text-blue-300 transition cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5" />
              Open Live Projects Dashboard
            </button>
          </div>
        </div>
      </div>

      {/* Feature Badges Footer */}
      <div className="pt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto border-t border-slate-200 dark:border-slate-800 text-left">
        <div className="flex gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-blue-50 dark:bg-blue-950 flex items-center justify-center text-blue-600 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Hardened Sandboxes</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Zero host access, dropped Linux capabilities, network egress restrictions, and isolated file namespaces.
            </p>
          </div>
        </div>

        <div className="flex gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">AI Repair Engine</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Autonomous diagnosis for dependency, TypeScript, and port errors with automated code patching.
            </p>
          </div>
        </div>

        <div className="flex gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-purple-50 dark:bg-purple-950 flex items-center justify-center text-purple-600 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Live Streaming Logs</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Server-Sent Events (SSE) log terminal with real-time process monitoring and sub-second health probes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
