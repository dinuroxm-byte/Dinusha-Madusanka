import React from 'react';
import { Users } from 'lucide-react';
import { PaxDetails } from '../types';

interface PaxSectionProps {
  pax: PaxDetails;
  onPaxChange: (fields: Partial<PaxDetails>) => void;
  onDaysChange: (days: number) => void;
}

export const PaxSection: React.FC<PaxSectionProps> = ({
  pax,
  onPaxChange,
  onDaysChange
}) => {
  const nights = Math.max(0, (pax.days || 0) > 0 ? (pax.days || 0) - 1 : 0);
  const totalPax = (pax.adults || 0) + (pax.child12 || 0) + (pax.child5 || 0);

  return (
    <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-sky-400" />
        <h3 className="text-sm font-semibold text-slate-100">
          Pax &amp; Trip Duration
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Adults (12+)
          </label>
          <select
            value={pax.adults ?? 0}
            onChange={e => onPaxChange({ adults: parseInt(e.target.value) || 0 })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
          >
            <option value={0}>0 Adults (Select)</option>
            {[1, 2, 3, 4, 5, 6, 8, 10, 15, 20, 30].map(n => (
              <option key={n} value={n}>
                {n} Adult{n > 1 ? 's' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Children (&lt; 12)
          </label>
          <select
            value={pax.child12}
            onChange={e => onPaxChange({ child12: parseInt(e.target.value) || 0 })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
          >
            {[0, 1, 2, 3, 4, 5].map(n => (
              <option key={n} value={n}>
                {n} Child{n === 1 ? '' : 'ren'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Children (&lt; 05)
          </label>
          <select
            value={pax.child5}
            onChange={e => onPaxChange({ child5: parseInt(e.target.value) || 0 })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
          >
            {[0, 1, 2, 3].map(n => (
              <option key={n} value={n}>
                {n} Child{n === 1 ? '' : 'ren'}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Days
          </label>
          <input
            type="number"
            min="0"
            max="60"
            value={pax.days || ''}
            placeholder="0"
            onChange={e => onDaysChange(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Nights (Days - 1)
          </label>
          <div className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-bold text-teal-400 flex items-center">
            {nights}
          </div>
        </div>
      </div>

      <div className="p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <span>
          Total Group Pax:{' '}
          <strong className="text-amber-400 font-bold ml-1">
            {totalPax} Pax
          </strong>{' '}
          ({pax.adults} Adults, {pax.child12} Child &lt;12, {pax.child5} Child &lt;5)
        </span>
        <span className="text-[11px] text-slate-500">
          Duration: {pax.days} Days / {nights} Nights
        </span>
      </div>

      {/* Group Tour Checkbox Option */}
      <div className="p-3.5 bg-gradient-to-r from-sky-950/50 via-slate-950 to-slate-950 border border-sky-800/50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={!!pax.isGroup}
            onChange={e => onPaxChange({ isGroup: e.target.checked })}
            className="w-4 h-4 rounded border-slate-700 text-sky-500 focus:ring-sky-500 bg-slate-900 cursor-pointer"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-100">
                Group Tour Booking
              </span>
              {pax.isGroup ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30">
                  Per-Person Rate Only in Quotation
                </span>
              ) : (
                <span className="text-[10px] text-slate-400">
                  (Click to enable per-person quote mode)
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              If selected, the quotation output (PDF, Print, Online Proposal, WhatsApp) displays <b>only the per-person rate</b> instead of the grand total lump sum.
            </p>
          </div>
        </label>
      </div>
    </section>
  );
};
