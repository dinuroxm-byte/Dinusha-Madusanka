import React, { useEffect, useMemo, useState } from 'react';
import {
  Activity,
  AlertCircle,
  Building2,
  Calendar,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileCheck,
  FileDown,
  FileSpreadsheet,
  FileText,
  Filter,
  History,
  Hotel,
  KeyRound,
  Layers,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User,
  UserCheck,
  UserPlus,
  Users,
  X
} from 'lucide-react';
import { ActivityAction, ActivityEntityType, ActivityLog, UserProfile, UserRole } from '../types';
import { fetchActivityLogs, loadLocalActivityLogs } from '../utils/supabaseStorage';
import { isSupabaseConfigured } from '../lib/supabase';

interface ActivityLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  showToast: (msg: string) => void;
}

export const ActivityLogsModal: React.FC<ActivityLogsModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  showToast
}) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const fetched = await fetchActivityLogs(150);
      setLogs(fetched);
    } catch (err) {
      console.error('Failed to load activity logs:', err);
      setLogs(loadLocalActivityLogs());
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadLogs();
      setExpandedLogId(null);
    }
  }, [isOpen]);

  // Listen for realtime activity logs dispatched locally or remotely
  useEffect(() => {
    const handleNewLog = (e: any) => {
      const newLog = e.detail as ActivityLog;
      if (newLog) {
        setLogs(prev => {
          if (prev.some(l => l.id === newLog.id)) return prev;
          return [newLog, ...prev];
        });
      }
    };

    window.addEventListener('voya_activity_logged', handleNewLog);
    return () => window.removeEventListener('voya_activity_logged', handleNewLog);
  }, []);

  const formatRelativeTime = (isoString: string): string => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffSec = Math.floor(diffMs / 1000);
      if (diffSec < 5) return 'Just now';
      if (diffSec < 60) return `${diffSec}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDays = Math.floor(diffHr / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return new Date(isoString).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const formatFullDate = (isoString: string): string => {
    try {
      return new Date(isoString).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  const getActionBadge = (action: ActivityAction) => {
    if (action.startsWith('CREATE_') || action === 'ADD_HOTEL') {
      return {
        label: action.replace('CREATE_', '').replace('ADD_', ''),
        bg: 'bg-emerald-950/80 border-emerald-700/80 text-emerald-300',
        dot: 'bg-emerald-400'
      };
    }
    if (action.startsWith('UPDATE_')) {
      return {
        label: action.replace('UPDATE_', ''),
        bg: 'bg-amber-950/80 border-amber-700/80 text-amber-300',
        dot: 'bg-amber-400'
      };
    }
    if (action.startsWith('DELETE_') || action === 'CLEAR_QUOTATIONS' || action === 'REMOVE_LOGO') {
      return {
        label: action.replace('DELETE_', ''),
        bg: 'bg-rose-950/80 border-rose-700/80 text-rose-300',
        dot: 'bg-rose-400'
      };
    }
    if (action.startsWith('EXPORT_')) {
      return {
        label: action.replace('EXPORT_', ''),
        bg: 'bg-purple-950/80 border-purple-700/80 text-purple-300',
        dot: 'bg-purple-400'
      };
    }
    if (action.startsWith('USER_')) {
      return {
        label: action.replace('USER_', ''),
        bg: 'bg-sky-950/80 border-sky-700/80 text-sky-300',
        dot: 'bg-sky-400'
      };
    }
    return {
      label: action,
      bg: 'bg-slate-800 border-slate-700 text-slate-300',
      dot: 'bg-slate-400'
    };
  };

  const getEntityIcon = (type: ActivityEntityType) => {
    switch (type) {
      case 'quotation':
        return <FileText className="w-3.5 h-3.5 text-amber-400" />;
      case 'customer':
        return <Users className="w-3.5 h-3.5 text-purple-400" />;
      case 'hotel':
        return <Hotel className="w-3.5 h-3.5 text-teal-400" />;
      case 'company':
        return <Building2 className="w-3.5 h-3.5 text-sky-400" />;
      case 'user':
        return <UserCheck className="w-3.5 h-3.5 text-blue-400" />;
      case 'export':
        return <FileDown className="w-3.5 h-3.5 text-indigo-400" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-slate-400" />;
    }
  };

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      // Role filter
      if (selectedRole !== 'all' && log.user_role !== selectedRole) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'all' && log.entity_type !== selectedCategory) {
        return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        log.summary.toLowerCase().includes(q) ||
        log.user_name.toLowerCase().includes(q) ||
        log.user_email.toLowerCase().includes(q) ||
        log.action.toLowerCase().includes(q) ||
        (log.entity_id && log.entity_id.toLowerCase().includes(q))
      );
    });
  }, [logs, selectedCategory, selectedRole, searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: logs.length,
      quotation: 0,
      customer: 0,
      hotel: 0,
      company: 0,
      user: 0,
      export: 0
    };
    logs.forEach(l => {
      if (counts[l.entity_type] !== undefined) {
        counts[l.entity_type]++;
      }
    });
    return counts;
  }, [logs]);

  const handleExportCSV = () => {
    if (filteredLogs.length === 0) {
      showToast('No logs to export.');
      return;
    }

    const headers = ['Timestamp', 'User Name', 'User Email', 'Role', 'Action', 'Category', 'Entity ID', 'Summary'];
    const rows = filteredLogs.map(l => [
      `"${formatFullDate(l.created_at)}"`,
      `"${(l.user_name || '').replace(/"/g, '""')}"`,
      `"${(l.user_email || '').replace(/"/g, '""')}"`,
      `"${l.user_role}"`,
      `"${l.action}"`,
      `"${l.entity_type}"`,
      `"${(l.entity_id || '').replace(/"/g, '""')}"`,
      `"${(l.summary || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Voya_Lanka_Audit_Logs_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Activity & audit log exported as CSV.');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh] relative">
        {/* Modal Top Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/90 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-600 to-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-950/50">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">
                  User Activity &amp; Audit Logs
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Tamper-Proof
                </span>
                {isSupabaseConfigured() && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-700 text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Supabase Cloud
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Centralized audit trail tracking quotation revisions, customer CRM updates, and admin operations.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              title="Download audit records as CSV spreadsheet"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>

            <button
              onClick={loadLogs}
              disabled={isLoading}
              className="p-1.5 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh logs feed"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-sky-400' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Toolbar: Search, Category Tabs, Role Filter */}
        <div className="p-3 sm:p-4 bg-slate-900/90 border-b border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search audit trail by user, quotation ID, customer, action..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-sky-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-200 text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
              <span className="text-slate-400 text-[11px] font-medium">Role:</span>
              <select
                value={selectedRole}
                onChange={e => setSelectedRole(e.target.value)}
                className="bg-transparent text-slate-200 text-xs font-semibold focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-slate-900">All Roles</option>
                <option value="ADMIN" className="bg-slate-900">Admins Only</option>
                <option value="STAFF" className="bg-slate-900">Staff Only</option>
              </select>
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-thin">
            {[
              { id: 'all', label: 'All Activities', count: categoryCounts.all },
              { id: 'quotation', label: 'Quotations', count: categoryCounts.quotation },
              { id: 'customer', label: 'Customers', count: categoryCounts.customer },
              { id: 'hotel', label: 'Partner Hotels', count: categoryCounts.hotel },
              { id: 'company', label: 'Company Settings', count: categoryCounts.company },
              { id: 'user', label: 'User Accounts', count: categoryCounts.user },
              { id: 'export', label: 'Exports & Docs', count: categoryCounts.export }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSelectedCategory(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === tab.id
                    ? 'bg-sky-600 text-white shadow-sm'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700/80 border border-slate-700/60'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    selectedCategory === tab.id
                      ? 'bg-sky-800 text-sky-100'
                      : 'bg-slate-900 text-slate-400'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Audit Log Entries List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-sky-400 mb-2" />
              <p className="text-xs">Loading audit events from Supabase Cloud...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-16 px-4 border border-dashed border-slate-800 rounded-xl bg-slate-950/40">
              <Activity className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-300">No activity events found</p>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {searchQuery || selectedCategory !== 'all' || selectedRole !== 'all'
                  ? 'No records match your current filter parameters. Try clearing your search query.'
                  : 'System activity will automatically appear here as team members create quotations, update rates, or modify records.'}
              </p>
            </div>
          ) : (
            filteredLogs.map(log => {
              const actionBadge = getActionBadge(log.action);
              const isExpanded = expandedLogId === log.id;
              const hasDetails = log.details && Object.keys(log.details).length > 0;

              return (
                <div
                  key={log.id}
                  className={`border rounded-xl transition-all duration-200 bg-slate-950/60 ${
                    isExpanded
                      ? 'border-sky-500/60 shadow-lg shadow-sky-950/20'
                      : 'border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    {/* User Identity + Entity + Action */}
                    <div className="flex items-start sm:items-center gap-3 min-w-0">
                      {/* User Avatar Initial */}
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-700 flex items-center justify-center text-slate-100 font-bold text-xs shrink-0 shadow-inner">
                        {log.user_name ? log.user_name.charAt(0).toUpperCase() : 'U'}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* User Name & Role */}
                          <span className="text-xs font-bold text-slate-200 truncate max-w-[140px]">
                            {log.user_name || log.user_email}
                          </span>
                          <span
                            className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border ${
                              log.user_role === 'ADMIN'
                                ? 'bg-amber-950/80 border-amber-700 text-amber-300'
                                : 'bg-sky-950/80 border-sky-700 text-sky-300'
                            }`}
                          >
                            {log.user_role}
                          </span>

                          {/* Action Badge */}
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${actionBadge.bg}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${actionBadge.dot}`} />
                            {actionBadge.label}
                          </span>

                          {/* Entity Type Tag */}
                          <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md capitalize">
                            {getEntityIcon(log.entity_type)}
                            <span>{log.entity_type}</span>
                          </span>
                        </div>

                        {/* Summary Message */}
                        <p className="text-xs text-slate-300 mt-1 font-medium leading-relaxed break-words">
                          {log.summary}
                        </p>
                      </div>
                    </div>

                    {/* Timestamp & Expand Details */}
                    <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center gap-1 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-slate-800/60">
                      <div
                        className="flex items-center gap-1 text-[11px] text-slate-400 font-mono"
                        title={formatFullDate(log.created_at)}
                      >
                        <Clock className="w-3 h-3 text-slate-500" />
                        <span>{formatRelativeTime(log.created_at)}</span>
                      </div>

                      {hasDetails && (
                        <button
                          onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300 cursor-pointer pt-0.5"
                        >
                          <span>{isExpanded ? 'Hide Details' : 'View Payload'}</span>
                          {isExpanded ? (
                            <ChevronDown className="w-3 h-3" />
                          ) : (
                            <ChevronRight className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Expanded Payload / JSON Drawer */}
                  {isExpanded && hasDetails && (
                    <div className="border-t border-slate-800 bg-slate-950 p-3 sm:p-4 rounded-b-xl space-y-2 text-xs">
                      <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono pb-1 border-b border-slate-900">
                        <span>Event ID: {log.id}</span>
                        <span>Logged At: {formatFullDate(log.created_at)}</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {Object.entries(log.details || {}).map(([key, value]) => {
                          const displayVal =
                            typeof value === 'object' && value !== null
                              ? JSON.stringify(value, null, 2)
                              : String(value);

                          return (
                            <div
                              key={key}
                              className="bg-slate-900/80 border border-slate-800 rounded-lg p-2 font-mono text-[11px]"
                            >
                              <span className="text-slate-400 font-semibold block capitalize mb-0.5">
                                {key.replace(/_/g, ' ')}:
                              </span>
                              <span className="text-slate-200 break-words whitespace-pre-wrap">
                                {displayVal}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer Summary & Compliance Notice */}
        <div className="p-3 sm:p-4 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>
              Showing <b className="text-slate-200">{filteredLogs.length}</b> audit events
              {selectedCategory !== 'all' ? ` in ${selectedCategory}` : ''}.
            </span>
          </div>

          <p className="text-[11px] text-slate-500 text-center sm:text-right">
            Append-only legal audit log enforced by Supabase Row Level Security.
          </p>
        </div>
      </div>
    </div>
  );
};
