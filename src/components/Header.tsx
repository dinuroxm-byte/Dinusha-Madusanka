import React, { useRef } from 'react';
import {
  Building2,
  Cloud,
  Database,
  Eye,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  Globe,
  Image as ImageIcon,
  MessageCircle,
  Plane,
  Printer,
  RotateCcw,
  Route,
  Share2,
  Sparkles,
  Trash2,
  Users
} from 'lucide-react';
import { LogoData } from '../types';

interface HeaderProps {
  logo: LogoData | null;
  savedCount: number;
  customerCount: number;
  onOpenItinerary: () => void;
  onOpenSaved: () => void;
  onOpenCustomers: () => void;
  onOpenBackup: () => void;
  onOpenWhatsAppShare: () => void;
  onPreviewOnlineProposal: () => void;
  onLoadDemo: () => void;
  onReset: () => void;
  onOpenCompany: () => void;
  onDownloadPDF: () => void;
  onExportExcel: () => void;
  onPrint: () => void;
  onLogoUpload: (logo: LogoData) => void;
  onLogoRemove: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  logo,
  savedCount,
  customerCount,
  onOpenItinerary,
  onOpenSaved,
  onOpenCustomers,
  onOpenBackup,
  onOpenWhatsAppShare,
  onPreviewOnlineProposal,
  onLoadDemo,
  onReset,
  onOpenCompany,
  onDownloadPDF,
  onExportExcel,
  onPrint,
  onLogoUpload,
  onLogoRemove
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const iw = img.naturalWidth || 400;
        const ih = img.naturalHeight || 200;
        const scale = Math.min(1, 400 / iw, 200 / ih);
        const w = Math.max(1, Math.round(iw * scale));
        const h = Math.max(1, Math.round(ih * scale));

        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          let dataUrl = canvas.toDataURL('image/png');
          if (dataUrl.length > 180000) {
            ctx.globalCompositeOperation = 'destination-over';
            ctx.fillStyle = '#fff';
            ctx.fillRect(0, 0, w, h);
            dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          }
          onLogoUpload({ data: dataUrl, w, h });
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  return (
    <header className="bg-slate-950 border-b border-slate-800 sticky top-0 z-40 py-2.5">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand Zone */}
        <div className="flex items-center gap-3">
          {logo && logo.data ? (
            <img
              src={logo.data}
              alt="Company logo"
              className="h-14 w-auto max-w-[155px] object-contain rounded-lg bg-white p-1 shadow-sm -mt-0.5"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-700 to-teal-600 flex items-center justify-center text-white shadow-md shadow-sky-900/40 -mt-0.5">
              <Plane className="w-6 h-6 -rotate-45" />
            </div>
          )}
          <div className="flex flex-col">
            <h1 className="text-sm sm:text-base font-bold leading-tight tracking-tight text-slate-100">
              Voya Lanka<br />Tours (Pvt) Ltd.
            </h1>
            <p className="text-[9px] font-medium italic tracking-wider text-amber-400 uppercase mt-0.5 leading-tight">
              MORE THAN A<br />DESTINATION
            </p>
          </div>
        </div>

        {/* Action Controls - Two Rows matching reference */}
        <div className="flex flex-col items-start md:items-end gap-2">
          {/* Top Row: Itinerary, Saved, Customers, Share Proposal, Backup & Restore, Demo, Reset, Logo */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <button
              onClick={onOpenItinerary}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-sky-300 transition-colors cursor-pointer"
              title="Tour itinerary schedule"
            >
              <Route className="w-3.5 h-3.5" />
              <span>Itinerary</span>
            </button>

            <button
              onClick={onOpenSaved}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-amber-300 transition-colors cursor-pointer"
              title="Saved quotations"
            >
              <FolderOpen className="w-3.5 h-3.5" />
              <span>Saved</span>
              <span className="bg-amber-500 text-slate-950 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {savedCount}
              </span>
            </button>

            <button
              onClick={onOpenCustomers}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-purple-800/80 bg-purple-950/40 hover:bg-purple-900/60 text-purple-300 transition-colors cursor-pointer"
              title="Customer database and directory"
            >
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>Customers</span>
              <span className="bg-indigo-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                {customerCount}
              </span>
            </button>

            <button
              onClick={onPreviewOnlineProposal}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-500/80 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 transition-colors cursor-pointer"
              title="Create shareable web link and preview proposal"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Share Proposal</span>
            </button>

            <button
              onClick={onOpenBackup}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-sky-500/80 bg-sky-950/40 hover:bg-sky-900/60 text-sky-300 transition-colors cursor-pointer"
              title="Database Backup & Restore"
            >
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <span>Backup &amp; Restore</span>
            </button>

            <button
              onClick={onLoadDemo}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              title="Load sample tour configuration"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Demo</span>
            </button>

            <button
              onClick={onReset}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              title="Reset form to defaults"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-sky-400 transition-colors cursor-pointer"
              title="Upload custom company logo"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>Logo</span>
            </button>

            {logo && (
              <button
                onClick={onLogoRemove}
                className="p-1.5 text-xs font-semibold rounded-lg border border-rose-900/60 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 transition-colors cursor-pointer"
                title="Remove logo"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Second Row: Company, PDF, Excel, Print (right aligned) */}
          <div className="flex items-center gap-1.5 sm:gap-2 justify-end self-end">
            <button
              onClick={onOpenCompany}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-sky-400 transition-colors cursor-pointer"
              title="Edit company profile and contact details"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Company</span>
            </button>

            <button
              onClick={onDownloadPDF}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-sky-600 hover:bg-sky-500 text-white shadow-sm transition-colors cursor-pointer"
              title="Download PDF Quotation"
            >
              <FileText className="w-3.5 h-3.5 text-white" />
              <span>PDF</span>
            </button>

            <button
              onClick={onExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-emerald-400 transition-colors cursor-pointer"
              title="Export everything to multi-sheet Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>

            <button
              onClick={onPrint}
              className="p-1.5 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
              title="Print quotation"
            >
              <Printer className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
