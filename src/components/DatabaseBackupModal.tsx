import React, { useRef, useState } from 'react';
import {
  ArrowDownToLine,
  Check,
  Database,
  Download,
  ExternalLink,
  FileCheck,
  FolderOpen,
  Globe,
  HardDrive,
  Laptop,
  ShieldCheck,
  Terminal,
  Upload,
  Users,
  X
} from 'lucide-react';
import { DatabaseBackup } from '../types';
import {
  getFullDatabaseBackup,
  loadCustomers,
  loadCustomPartnerHotels,
  loadSavedQuotes,
  restoreFullDatabase
} from '../utils/storage';

interface DatabaseBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  showToast: (msg: string) => void;
}

export const DatabaseBackupModal: React.FC<DatabaseBackupModalProps> = ({
  isOpen,
  onClose,
  showToast
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingBackupData, setPendingBackupData] = useState<DatabaseBackup | null>(null);
  const [pendingFileName, setPendingFileName] = useState<string>('');
  const [isRestoring, setIsRestoring] = useState(false);

  // Live stats from storage
  const quotes = loadSavedQuotes();
  const customers = loadCustomers();
  const customHotels = loadCustomPartnerHotels();

  // Export database as portable JSON file
  const handleExportLocalJson = () => {
    try {
      const backup = getFullDatabaseBackup();
      const jsonStr = JSON.stringify(backup, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = `Voya_Lanka_Database_Backup_${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Database backup downloaded successfully.');
    } catch (err) {
      console.error('Export error:', err);
      showToast('Failed to export database backup.');
    }
  };

  // Select local JSON file for restoration
  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPendingFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string);
        if (
          parsed &&
          typeof parsed === 'object' &&
          (Array.isArray(parsed.savedQuotes) || Array.isArray(parsed.customers))
        ) {
          setPendingBackupData(parsed as DatabaseBackup);
        } else {
          showToast('Invalid backup format. File must contain savedQuotes or customers.');
          setPendingBackupData(null);
        }
      } catch (err) {
        console.error('Local restore read error:', err);
        showToast('Invalid JSON file format.');
        setPendingBackupData(null);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Confirm restoration
  const handleConfirmRestore = () => {
    if (!pendingBackupData) return;
    setIsRestoring(true);
    try {
      const success = restoreFullDatabase(pendingBackupData);
      if (success) {
        showToast(
          `Database restored successfully! (${pendingBackupData.customers?.length || 0} customers, ${pendingBackupData.savedQuotes?.length || 0} quotations)`
        );
        setPendingBackupData(null);
        setPendingFileName('');
        onClose();
        // Dispatch storage events to refresh all components
        window.dispatchEvent(new Event('storage'));
      } else {
        showToast('Could not restore database from selected file.');
      }
    } catch (err) {
      console.error('Restore execution error:', err);
      showToast('Failed to restore database.');
    } finally {
      setIsRestoring(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh] relative">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>Database Backup &amp; Restoration</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-950 border border-sky-800 text-sky-300">
                  Local Storage
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Safely export and restore all quotation records, customer database, partner hotels, and settings.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Active Database Summary Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center text-amber-400 mb-1">
                <FolderOpen className="w-4 h-4" />
              </div>
              <span className="text-lg font-black text-slate-100 block">
                {quotes.length}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Saved Quotes
              </span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center text-purple-400 mb-1">
                <Users className="w-4 h-4" />
              </div>
              <span className="text-lg font-black text-slate-100 block">
                {customers.length}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Customers
              </span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-center">
              <div className="flex items-center justify-center text-teal-400 mb-1">
                <HardDrive className="w-4 h-4" />
              </div>
              <span className="text-lg font-black text-slate-100 block">
                {customHotels.length}
              </span>
              <span className="text-[10px] uppercase font-bold text-slate-400">
                Custom Hotels
              </span>
            </div>
          </div>

          {/* Action 1: Export Complete Backup */}
          <div className="bg-slate-950/80 border border-sky-800/40 rounded-xl p-4.5 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0 mt-0.5">
                  <ArrowDownToLine className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">
                    Export Complete Database Backup (.json)
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                    Download a full snapshot of your system containing all {quotes.length} saved quotations, {customers.length} customer records, partner hotels, and tour templates in standard JSON format.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleExportLocalJson}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-900/30 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Complete Backup File</span>
            </button>
          </div>

          {/* Action 2: Import & Restore Backup */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4.5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 mt-0.5">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-100">
                  Restore Database from Backup File
                </h4>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  Select a previously downloaded backup (.json) file to restore quotation records, customer database, and custom configurations.
                </p>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelected}
              className="hidden"
            />

            {!pendingBackupData ? (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                <FolderOpen className="w-4 h-4 text-emerald-400" />
                <span>Choose Backup File to Restore...</span>
              </button>
            ) : (
              /* Confirmation Card for Pending Restore */
              <div className="bg-slate-900 border border-emerald-500/40 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                    <FileCheck className="w-4 h-4 text-emerald-400" />
                    <span>Ready to Restore: {pendingFileName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingBackupData(null);
                      setPendingFileName('');
                    }}
                    className="text-xs text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                </div>

                <div className="text-[11px] text-slate-300 space-y-1 bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                  <div>
                    Backup Date:{' '}
                    <b className="text-slate-100">
                      {pendingBackupData.exportedAt
                        ? new Date(pendingBackupData.exportedAt).toLocaleString()
                        : 'Unknown'}
                    </b>
                  </div>
                  <div>
                    Quotations to restore:{' '}
                    <b className="text-amber-300">
                      {pendingBackupData.savedQuotes?.length || 0}
                    </b>
                  </div>
                  <div>
                    Customers to restore:{' '}
                    <b className="text-purple-300">
                      {pendingBackupData.customers?.length || 0}
                    </b>
                  </div>
                  {pendingBackupData.partnerHotels && (
                    <div>
                      Partner Hotels to restore:{' '}
                      <b className="text-teal-300">
                        {pendingBackupData.partnerHotels.length}
                      </b>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmRestore}
                    disabled={isRestoring}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isRestoring ? 'Restoring...' : 'Confirm & Restore Database'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingBackupData(null);
                      setPendingFileName('');
                    }}
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Action 3: Run on Localhost (Complete Source Code) */}
          <div className="bg-slate-950/80 border border-indigo-500/30 rounded-xl p-4.5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0 mt-0.5">
                <Laptop className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-100">
                    Run on Localhost (Complete Project Source Code)
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-950 border border-indigo-800 text-indigo-300">
                    Full Codebase .zip
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Download all source files, configurations (<code className="text-indigo-300">package.json</code>, <code className="text-indigo-300">vite.config.ts</code>, <code className="text-indigo-300">tsconfig.json</code>), components, and assets to run the entire system on your local machine.
                </p>
              </div>
            </div>

            {/* Quick terminal guide box */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-2.5 font-mono text-[11px] text-slate-300 space-y-1">
              <div className="flex items-center gap-1.5 text-indigo-400 font-sans font-bold text-[10px] uppercase tracking-wider mb-1">
                <Terminal className="w-3 h-3" />
                <span>3-Step Localhost Terminal Setup</span>
              </div>
              <div className="text-slate-400">1. Extract zip and open terminal in folder</div>
              <div className="text-emerald-400"><span className="text-slate-500">$</span> npm install</div>
              <div className="text-emerald-400"><span className="text-slate-500">$</span> npm run dev</div>
              <div className="text-sky-300">➜ Open in browser: <span className="underline">http://localhost:3000</span></div>
            </div>

            <a
              href="/voya-lanka-complete-source.zip"
              download="voya-lanka-complete-source.zip"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-900/30 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Complete Localhost Source Code (.zip)</span>
            </a>
          </div>

          {/* Free Web Deployment Package (.zip) */}
          <div className="bg-slate-950/80 border border-teal-500/30 rounded-xl p-4.5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 shrink-0 mt-0.5">
                <Globe className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-100">
                    Publish Online 100% Free (No Credit Card / No Billing)
                  </h4>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300">
                    $0 / Month
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Download the ready-to-host production package. You can drag and drop it directly onto{' '}
                  <span className="text-sky-300 font-semibold">Netlify Drop</span>,{' '}
                  <span className="text-sky-300 font-semibold">Vercel</span>, or{' '}
                  <span className="text-sky-300 font-semibold">Cloudflare Pages</span> to get an instant live website URL with free SSL forever.
                </p>
              </div>
            </div>

            <a
              href="/voya-lanka-production-build.zip"
              download="voya-lanka-production-build.zip"
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold shadow-md shadow-teal-900/30 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Free Production Website Package (.zip)</span>
            </a>
          </div>

          {/* Data Privacy & Portability Guarantee */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3.5 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
            <p className="text-[11px] text-slate-400 leading-relaxed">
              All data is stored directly in your local environment. Backups are exported as clean, standard JSON that you can archive, store, or migrate at any time.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-950 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
