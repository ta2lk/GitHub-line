import React, { useState, useEffect } from 'react';
import {
  Shield,
  Server,
  Activity,
  UserCheck,
  Clock,
  HardDrive,
  Cpu,
  AlertTriangle,
  FileText,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { User, AuditLog, SystemMetrics } from '../types.js';

interface AdminPanelViewProps {
  currentUser: User | null;
  metrics: SystemMetrics | null;
  onRoleChange: (newRole: 'USER' | 'ADMIN' | 'SUPER_ADMIN') => void;
}

export const AdminPanelView: React.FC<AdminPanelViewProps> = ({
  currentUser,
  metrics,
  onRoleChange
}) => {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [selectedRole, setSelectedRole] = useState<'USER' | 'ADMIN' | 'SUPER_ADMIN'>(
    currentUser?.role || 'ADMIN'
  );

  const loadAuditLogs = async () => {
    try {
      const res = await fetch('/api/v1/audit-logs');
      const data = await res.json();
      setAuditLogs(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const handleApplyRole = (role: 'USER' | 'ADMIN' | 'SUPER_ADMIN') => {
    setSelectedRole(role);
    onRoleChange(role);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              Platform Administration & Observability
            </h1>
            <span className="px-2 py-0.5 rounded-md text-[10px] uppercase font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              RBAC: {currentUser?.role}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Global system health, container worker allocation, audit trails, and security policies.
          </p>
        </div>

        <button
          onClick={loadAuditLogs}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh Metrics
        </button>
      </div>

      {/* Cluster Health & Security Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Worker Pool</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {metrics?.activeWorkers ?? 4} Nodes
          </p>
          <p className="text-xs text-slate-500">Active Build Workers Ready</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Sandbox Ingress</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            Traefik + TLS
          </p>
          <p className="text-xs text-slate-500">Dynamic Port Router Active</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Cleanup Daemon</span>
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            30m TTL
          </p>
          <p className="text-xs text-slate-500">Auto-pruning idle runtimes</p>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Security Policy</span>
            <Shield className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            Strict Non-Root
          </p>
          <p className="text-xs text-slate-500">CAP_DROP ALL • SSRF Blocked</p>
        </div>
      </div>

      {/* RBAC Role Simulator */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-blue-500" />
          Role-Based Access Control (RBAC) Switcher
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Switch active user role to verify platform permissions and tenant isolation.
        </p>

        <div className="flex flex-wrap gap-3">
          {(['USER', 'ADMIN', 'SUPER_ADMIN'] as const).map((role) => (
            <button
              key={role}
              onClick={() => handleApplyRole(role)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 ${
                currentUser?.role === role
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {currentUser?.role === role && <CheckCircle2 className="w-3.5 h-3.5" />}
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-500" />
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">Security & Audit Trails</h2>
          </div>
          <span className="text-xs text-slate-400">{auditLogs.length} events logged</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 sm:px-6">Timestamp</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-4 sm:px-6">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-mono">
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-slate-400 font-sans">
                    No audit records logged.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log, idx) => (
                  <tr key={`${log.id}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-4 sm:px-6 text-slate-400 text-[11px]">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 text-[11px] font-bold">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {log.userId}
                    </td>
                    <td className="py-3 px-4 sm:px-6 text-slate-600 dark:text-slate-300 text-[11px] truncate max-w-md">
                      {JSON.stringify(log.details)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
