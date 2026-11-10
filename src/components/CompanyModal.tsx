import React, { useState } from 'react';
import { Building2, Save, ShieldAlert, X } from 'lucide-react';
import { CompanyDetails, UserProfile } from '../types';

interface CompanyModalProps {
  isOpen: boolean;
  company: CompanyDetails;
  currentUser?: UserProfile | null;
  onClose: () => void;
  onSave: (company: CompanyDetails) => void;
}

export const CompanyModal: React.FC<CompanyModalProps> = ({
  isOpen,
  company,
  currentUser,
  onClose,
  onSave
}) => {
  const [form, setForm] = useState<CompanyDetails>({ ...company });
  const isAdmin = !currentUser || currentUser.role === 'ADMIN';

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-sky-400" />
            <b className="text-slate-100 text-sm">Travel Company Details</b>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {!isAdmin && (
            <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl text-xs text-amber-200 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>
                Company profile is read-only for <b>STAFF</b> accounts. Official branding, address, and registration details can only be edited by an <b>ADMIN</b>.
              </span>
            </div>
          )}

          <p className="text-xs text-slate-400">
            These company contact details are saved permanently and printed on every exported quotation PDF, itinerary, and voucher. Leave a field empty to hide it.
          </p>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Company Name
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              value={form.name || 'Voya Lanka Tours (Pvt) Ltd.'}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Voya Lanka Tours (Pvt) Ltd."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-bold focus:outline-none focus:border-sky-500 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Registered Address
            </label>
            <input
              type="text"
              disabled={!isAdmin}
              value={form.address}
              onChange={e => setForm({ ...form, address: e.target.value })}
              placeholder="e.g. No. 93/2, Dabare Mawatha, Colombo 05, Sri Lanka"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 disabled:opacity-60 disabled:cursor-not-allowed"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Phone / WhatsApp
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                placeholder="+94 77 ..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Official Email
              </label>
              <input
                type="email"
                disabled={!isAdmin}
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                placeholder="info@voyalankatours.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Website
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={form.website}
                onChange={e => setForm({ ...form, website: e.target.value })}
                placeholder="www.voyalankatours.com"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Registration / SLTDA No.
              </label>
              <input
                type="text"
                disabled={!isAdmin}
                value={form.reg}
                onChange={e => setForm({ ...form, reg: e.target.value })}
                placeholder="SLTDA/SQA/PRO/..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 disabled:opacity-60 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              {isAdmin ? 'Cancel' : 'Close'}
            </button>
            {isAdmin && (
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Company Details</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
