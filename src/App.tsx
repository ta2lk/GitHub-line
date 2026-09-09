import React, { useState, useEffect } from 'react';
import { Project, User, SystemMetrics } from './types.js';
import { Navbar } from './components/Navbar.js';
import { LandingHero } from './components/LandingHero.js';
import { DashboardView } from './components/DashboardView.js';
import { ProjectDetailView } from './components/ProjectDetailView.js';
import { ImportProjectModal } from './components/ImportProjectModal.js';
import { AdminPanelView } from './components/AdminPanelView.js';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'landing' | 'project' | 'admin'>('dashboard');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectSubTab, setProjectSubTab] = useState<string>('overview');
  const [user, setUser] = useState<User | null>(null);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importInitialUrl, setImportInitialUrl] = useState('');
  const [importInitialFixture, setImportInitialFixture] = useState<string | undefined>(undefined);
  const [isDark, setIsDark] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  // Sync dark class to html document element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Load projects, user, and metrics
  const fetchPlatformData = async () => {
    try {
      const [projRes, userRes, metricRes] = await Promise.all([
        fetch('/api/v1/projects'),
        fetch('/api/v1/users/me'),
        fetch('/api/v1/metrics')
      ]);

      if (projRes.ok) {
        const data: Project[] = await projRes.json();
        const seen = new Set<string>();
        const unique = data.filter((p) => {
          if (seen.has(p.id)) return false;
          seen.add(p.id);
          return true;
        });
        setProjects(unique);
        if (unique.length > 0 && !selectedProject) {
          const claw = unique.find((p) => p.name.toLowerCase().includes('claw'));
          setSelectedProject(claw || unique[0]);
        }
      }

      if (userRes.ok) {
        setUser(await userRes.json());
      }

      if (metricRes.ok) {
        setMetrics(await metricRes.json());
      }
    } catch (e) {
      console.error('Failed to load platform data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPlatformData();
    const interval = setInterval(fetchPlatformData, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectProject = (project: Project, subtab: string = 'overview') => {
    setSelectedProject(project);
    setProjectSubTab(subtab);
    setCurrentTab('project');
  };

  const handleTriggerBuild = async (projectId: string) => {
    try {
      await fetch(`/api/v1/projects/${projectId}/build`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({})
      });
      fetchPlatformData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project and stop its containers?')) return;
    try {
      await fetch(`/api/v1/projects/${projectId}`, { method: 'DELETE' });
      if (selectedProject?.id === projectId) {
        setSelectedProject(null);
        setCurrentTab('dashboard');
      }
      fetchPlatformData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleUserRole = async () => {
    if (!user) return;
    const nextRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
    try {
      const res = await fetch('/api/v1/auth/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: nextRole })
      });
      const updated = await res.json();
      setUser(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleOpenImport = (initialUrl = '', fixture?: string) => {
    setImportInitialUrl(initialUrl);
    setImportInitialFixture(fixture);
    setIsImportOpen(true);
  };

  const handleImportSuccess = (newProject: Project, targetSubTab: string = 'preview') => {
    setProjects((prev) => {
      const filtered = prev.filter((p) => p.id !== newProject.id);
      return [newProject, ...filtered];
    });
    setSelectedProject(newProject);
    setProjectSubTab(targetSubTab);
    setCurrentTab('project');
    fetchPlatformData();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors flex flex-col font-sans">
      {/* Top Main Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        projects={projects}
        selectedProject={selectedProject}
        setSelectedProject={(p) => {
          setSelectedProject(p);
          setCurrentTab('project');
        }}
        onOpenImport={() => handleOpenImport()}
        user={user}
        onToggleUserRole={handleToggleUserRole}
        isDark={isDark}
        setIsDark={setIsDark}
        metrics={metrics}
      />

      {/* Main Viewport Router */}
      <main className="flex-1 pb-12">
        {currentTab === 'landing' && (
          <LandingHero
            onStartImport={(url, fixture) => handleOpenImport(url, fixture)}
            onOpenDashboard={() => setCurrentTab('dashboard')}
          />
        )}

        {currentTab === 'dashboard' && (
          <DashboardView
            projects={projects}
            metrics={metrics}
            onSelectProject={handleSelectProject}
            onOpenImport={() => handleOpenImport()}
            onTriggerBuild={handleTriggerBuild}
            onDeleteProject={handleDeleteProject}
          />
        )}

        {currentTab === 'project' && selectedProject && (
          <ProjectDetailView
            project={selectedProject}
            initialTab={projectSubTab}
            onBackToDashboard={() => setCurrentTab('dashboard')}
            onRefreshProject={fetchPlatformData}
          />
        )}

        {currentTab === 'admin' && (
          <AdminPanelView
            currentUser={user}
            metrics={metrics}
            onRoleChange={async (role) => {
              const res = await fetch('/api/v1/auth/role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role })
              });
              setUser(await res.json());
            }}
          />
        )}
      </main>

      {/* Import Project Modal Wizard */}
      <ImportProjectModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        initialUrl={importInitialUrl}
        initialFixture={importInitialFixture}
        onSuccess={handleImportSuccess}
      />
    </div>
  );
}
