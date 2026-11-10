import React from 'react';
import { RotateCcw, Save, ScrollText } from 'lucide-react';
import { TermsConfig } from '../types';
import { PAYMENT_SCHEDULE_TEMPLATE, replaceTemplateVars, TemplateVariables } from '../utils/calc';

interface TermsSectionProps {
  terms: TermsConfig;
  templateVars: TemplateVariables;
  onTermsChange: (fields: Partial<TermsConfig>) => void;
  onResetStandard: () => void;
  onSaveAsDefault: () => void;
}

export const TermsSection: React.FC<TermsSectionProps> = ({
  terms,
  templateVars,
  onTermsChange,
  onResetStandard,
  onSaveAsDefault
}) => {
  const paymentScheduleText = replaceTemplateVars(
    PAYMENT_SCHEDULE_TEMPLATE,
    templateVars
  );

  return (
    <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Header with actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-2 border-b border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <ScrollText className="w-4 h-4 text-sky-400" />
            <h3 className="text-sm font-semibold text-slate-100">
              Payment, Inclusions, Exclusions &amp; Terms (Printed in PDF)
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            One item per line. Auto-fill tags:{' '}
            <span className="text-sky-300 font-mono text-[11px]">
              {'{days}'} {'{nights}'} {'{vehicle}'} {'{hotels}'} {'{meals}'} {'{guide}'} {'{water}'} {'{validUntil}'} {'{dep}'} {'{bal}'} {'{depAmt}'} {'{balAmt}'}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onResetStandard}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Standard</span>
          </button>
          <button
            onClick={onSaveAsDefault}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save as Default</span>
          </button>
        </div>
      </div>

      {/* Row: Deposit %, Balance %, Validity, Valid Until */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Advance / Deposit (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={terms.dep}
            onChange={e =>
              onTermsChange({
                dep: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0))
              })
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-right font-bold text-amber-300 focus:outline-none focus:border-amber-400 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Balance (%) - Auto
          </label>
          <div className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-right font-bold text-slate-200 flex items-center justify-end">
            {templateVars.bal}%
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Quotation Valid (Days)
          </label>
          <input
            type="number"
            min="1"
            max="90"
            value={terms.valid}
            onChange={e =>
              onTermsChange({
                valid: Math.max(1, parseInt(e.target.value) || 14)
              })
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-right font-bold text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Valid Until (Auto)
          </label>
          <div className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-right text-slate-300 flex items-center justify-end">
            {templateVars.validUntil}
          </div>
        </div>
      </div>

      {/* Payment schedule preview */}
      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/90 text-xs font-semibold text-amber-300">
        {paymentScheduleText}
      </div>

      {/* Inclusions and Exclusions side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Package Inclusions (One per line)
          </label>
          <textarea
            rows={6}
            value={terms.incl}
            onChange={e => onTermsChange({ incl: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-mono transition-colors leading-relaxed"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Package Exclusions (One per line)
          </label>
          <textarea
            rows={6}
            value={terms.excl}
            onChange={e => onTermsChange({ excl: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-mono transition-colors leading-relaxed"
          />
        </div>
      </div>

      {/* Terms & Conditions */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">
          Terms &amp; Conditions (One per line)
        </label>
        <textarea
          rows={4}
          value={terms.terms}
          onChange={e => onTermsChange({ terms: e.target.value })}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-mono transition-colors leading-relaxed"
        />
      </div>

      {/* Closing Thanks Message */}
      <div>
        <label className="block text-xs font-medium text-slate-400 mb-1">
          Closing Thank-You Message
        </label>
        <input
          type="text"
          value={terms.thanks}
          onChange={e => onTermsChange({ thanks: e.target.value })}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
        />
      </div>
    </section>
  );
};
