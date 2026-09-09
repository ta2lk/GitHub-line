import React from 'react';
import {
  Layers,
  Terminal,
  Play,
  Wrench,
  Code2,
  Shield,
  Plus,
  Server,
  Sun,
  Moon,
  Github,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FolderGit2
} from 'lucide-react';
import { Project, User, SystemMetrics } from '../types.js';

interface NavbarProps {
  currentTab: 'dashboard' | 'landing' | 'project' | 'admin';
  setCurrentTab: (tab: 'dashboard' | 'landing' | 'project' | 'admin') => void;
  projects: Project[];
  selectedProject: Project | null;
  setSelectedProject: (p: Project) => void;
  onOpenImport: () => void;
  user: User | null;
  onToggleUserRole: () => void;
  isDark: boolean;
  setIsDark: (val: boolean) => void;
  metrics: SystemMetrics | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  projects,
  selectedProject,
  setSelectedProject,
  onOpenImport,
  user,
  onToggleUserRole,
  isDark,
  setIsDark,
  metrics
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand & Slogan */}
        <div className="flex items-center gap-6">
          <button
            onClick={() => setCurrentTab('landing')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-xl shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <FolderGit2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  Git<span className="text-blue-600 dark:text-blue-400">2</span>Live
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                  v1.0
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
                From GitHub to Live App
              </p>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                currentTab === 'dashboard'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => {
                if (projects.length > 0) {
                  if (!selectedProject) setSelectedProject(projects[0]);
                  setCurrentTab('project');
                } else {
                  onOpenImport();
                }
              }}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                currentTab === 'project'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Project Studio
            </button>
            <button
              onClick={() => setCurrentTab('admin')}
              className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                currentTab === 'admin'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Admin
            </button>
          </nav>
        </div>

        {/* Right Section: Project Switcher & Controls */}
        <div className="flex items-center gap-3">
          {/* Active Project Selector */}
          {projects.length > 0 && (
            <div className="hidden lg:flex items-center gap-2">
              <span className="text-xs text-slate-400">Project:</span>
              <select
                value={selectedProject?.id || ''}
                onChange={(e) => {
                  const found = projects.find((p) => p.id === e.target.value);
                  if (found) {
                    setSelectedProject(found);
                    setCurrentTab('project');
                  }
                }}
                className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-medium rounded-lg px-2.5 py-1.5 text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
              >
                {projects
                  .filter((p, index, self) => index === self.findIndex((item) => item.id === p.id))
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.framework})
                    </option>
                  ))}
              </select>
            </div>
          )}

          {/* Import New Repo Button */}
          <button
            onClick={onOpenImport}
            className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Import GitHub Repo</span>
          </button>

          {/* Role Switcher Pill (User / Admin) */}
          <button
            onClick={onToggleUserRole}
            title="Click to toggle User/Admin RBAC permissions"
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                user?.role === 'ADMIN' ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
            />
            {user?.role || 'USER'}
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={() => setIsDark(!isDark)}
            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>
        </div>
      </div>
    </header>
  );
};
