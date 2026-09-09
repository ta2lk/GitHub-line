import React, { useState } from 'react';
import {
  Layers,
  Play,
  Terminal,
  AlertCircle,
  CheckCircle2,
  Clock,
  Cpu,
  HardDrive,
  Activity,
  Plus,
  Search,
  ExternalLink,
  Wrench,
  Trash2,
  RefreshCw,
  Sparkles,
  Server
} from 'lucide-react';
import { Project, SystemMetrics } from '../types.js';

interface DashboardViewProps {
  projects: Project[];
  metrics: SystemMetrics | null;
  onSelectProject: (project: Project, subtab?: string) => void;
  onOpenImport: () => void;
  onTriggerBuild: (projectId: string) => void;
  onDeleteProject: (projectId: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  projects,
  metrics,
  onSelectProject,
  onOpenImport,
  onTriggerBuild,
  onDeleteProject
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredProjects = projects
    .filter((p, index, self) => index === self.findIndex((item) => item.id === p.id))
    .filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.repositoryUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.framework.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'RUNNING' && p.status === 'RUNNING') ||
      (statusFilter === 'FAILED' && p.status === 'BUILD_FAILED') ||
      (statusFilter === 'READY' && p.status === 'READY');

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Metrics Row (Requirement #11) */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Workspace Overview</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live monitoring for sandboxed execution containers, builds, and AI sessions.
            </p>
          </div>
          <button
            onClick={onOpenImport}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-sm transition cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Import New Repository</span>
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 rounded-xl p-3.5 shadow-xs">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Projects</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {metrics?.totalProjects ?? projects.length}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 rounded-xl p-3.5 shadow-xs">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Running</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
              {metrics?.runningApps ?? 1}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 rounded-xl p-3.5 shadow-xs">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Passed</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
              {metrics?.successfulBuilds ?? 4}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 rounded-xl p-3.5 shadow-xs">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Failed</p>
            <p className="text-2xl font-bold text-rose-500 mt-1">
              {metrics?.failedBuilds ?? 1}
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 rounded-xl p-3.5 shadow-xs">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">CPU</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {metrics?.cpuUsagePercent ?? 18}%
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 rounded-xl p-3.5 shadow-xs">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">RAM</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {metrics?.ramUsagePercent ?? 32}%
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 rounded-xl p-3.5 shadow-xs">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Storage</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              {metrics ? Math.round(metrics.storageUsageMb / 1024 * 10) / 10 : 0.6}GB
            </p>
          </div>

          <div className="bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 rounded-xl p-3.5 shadow-xs">
            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Plan</p>
            <p className="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">
              {metrics?.currentPlan || 'PRO'}
            </p>
          </div>
        </div>
      </div>

      {/* Projects List Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {/* Search & Filter Controls */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by project name, repo, or framework..."
              className="w-full pl-9.5 pr-4 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-medium">
            {['ALL', 'RUNNING', 'READY', 'FAILED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
                  statusFilter === st
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Projects Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-200 dark:border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4 sm:px-6">Project & Repository</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Framework</th>
                <th className="py-3.5 px-4">Runtime & Port</th>
                <th className="py-3.5 px-4">Last Build</th>
                <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {filteredProjects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-400">
                    No repositories match your filter. Click "Import New Repository" to get started.
                  </td>
                </tr>
              ) : (
                filteredProjects.map((p) => {
                  const isRunning = p.status === 'RUNNING';
                  const isFailed = p.status === 'BUILD_FAILED';
                  const isBuilding = p.status === 'BUILDING';

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Project Name & Repo */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600/10 to-indigo-600/10 dark:bg-slate-800 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs border border-blue-200 dark:border-slate-700 shrink-0">
                            {p.framework.slice(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <button
                                onClick={() => onSelectProject(p)}
                                className="font-bold text-sm text-slate-900 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 truncate block text-left cursor-pointer"
                              >
                                {p.name}
                              </button>
                              {p.category && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-950/70 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900">
                                  {p.category}
                                </span>
                              )}
                              {p.stars ? (
                                <span className="text-[10px] text-amber-500 font-semibold flex items-center gap-0.5">
                                  ★ {p.stars.toLocaleString()}
                                </span>
                              ) : null}
                            </div>
                            <p className="text-[11px] text-slate-400 truncate font-mono mt-0.5">
                              {p.repositoryUrl.replace('https://github.com/', '')} • {p.defaultBranch}
                            </p>
                            {p.description && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5 max-w-sm">
                                {p.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status Badge */}
                      <td className="py-4 px-4">
                        {isRunning ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Live App Running
                          </span>
                        ) : isFailed ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800">
                            <AlertCircle className="w-3 h-3" />
                            Build Failed
                          </span>
                        ) : isBuilding ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/70 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Building...
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                            Ready
                          </span>
                        )}
                      </td>

                      {/* Framework & Language */}
                      <td className="py-4 px-4">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {p.framework}
                        </span>
                        <span className="text-slate-400 ml-1.5 font-mono text-[11px]">
                          ({p.language})
                        </span>
                      </td>

                      {/* Runtime Port */}
                      <td className="py-4 px-4 font-mono text-slate-600 dark:text-slate-300">
                        {p.activeRuntime ? (
                          <div className="flex items-center gap-1.5">
                            <Server className="w-3.5 h-3.5 text-blue-500" />
                            <span>:{p.port}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400">Inactive</span>
                        )}
                      </td>

                      {/* Last Build */}
                      <td className="py-4 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {p.latestBuild ? (
                          <div>
                            <span className="font-semibold text-slate-700 dark:text-slate-300">
                              #{p.latestBuild.id.slice(0, 7)}
                            </span>
                            <span className="text-slate-400 ml-1">
                              ({p.latestBuild.durationSeconds ?? 12}s)
                            </span>
                          </div>
                        ) : (
                          'No builds'
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-4 sm:px-6 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Live Preview Button */}
                          <button
                            onClick={() => onSelectProject(p, 'preview')}
                            className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-300 font-medium transition cursor-pointer"
                            title="Open Sandboxed Live Preview"
                          >
                            <Play className="w-4 h-4 fill-current" />
                          </button>

                          {/* AI Fix button if failed */}
                          {isFailed && (
                            <button
                              onClick={() => onSelectProject(p, 'ai')}
                              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-white font-semibold text-[11px] flex items-center gap-1 transition cursor-pointer"
                              title="Fix errors automatically with AI"
                            >
                              <Sparkles className="w-3 h-3" />
                              Fix with AI
                            </button>
                          )}

                          {/* Trigger Rebuild */}
                          <button
                            onClick={() => onTriggerBuild(p.id)}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
                            title="Trigger Re-build"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </button>

                          {/* Open Project Studio */}
                          <button
                            onClick={() => onSelectProject(p, 'overview')}
                            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition cursor-pointer"
                            title="Open Studio"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </button>

                          {/* Delete Project */}
                          <button
                            onClick={() => onDeleteProject(p.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-400 hover:text-rose-500 transition cursor-pointer"
                            title="Delete Project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
