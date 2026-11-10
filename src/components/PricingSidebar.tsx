import React from 'react';
import {
  Calculator,
  Download,
  FileSpreadsheet,
  FileText,
  Globe,
  MessageCircle,
  Percent,
  Printer,
  Save,
  Tag
} from 'lucide-react';
import { PricingBreakdown, PricingConfig } from '../types';
import { formatLKR, formatUSD, numberToWords } from '../utils/calc';

interface PricingSidebarProps {
  pricing: PricingConfig;
  breakdown: PricingBreakdown;
  isGroup?: boolean;
  onPricingChange: (fields: Partial<PricingConfig>) => void;
  onSaveQuote: () => void;
  onDownloadPDF: () => void;
  onPrintQuote: () => void;
  onExportExcel: () => void;
  onShareWhatsApp?: () => void;
  onPreviewOnlineProposal?: () => void;
}

export const PricingSidebar: React.FC<PricingSidebarProps> = ({
  pricing,
  breakdown,
  isGroup,
  onPricingChange,
  onSaveQuote,
  onDownloadPDF,
  onPrintQuote,
  onExportExcel,
  onShareWhatsApp,
  onPreviewOnlineProposal
}) => {
  const costRows: [string, number][] = [
    ['Accommodation & Meals Total', breakdown.accom],
    ['Vehicle Cost', breakdown.veh],
    ['Fuel Cost', breakdown.fuel],
    ['Driver Charge', breakdown.drv],
    ['Guide Daily Fee Total', breakdown.guide],
    ['Guide or Driver Room (LKR)', breakdown.crew],
    ['Toll + Parking Charges', breakdown.toll],
    ['Entrance Tickets & Extras', breakdown.oth]
  ];

  return (
    <aside className="w-full">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg sticky top-20 space-y-4">
        {/* Header */}
        <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Calculator className="w-4 h-4 text-sky-400" />
            <h3 className="font-bold text-sm text-slate-100">
              Total Cost &amp; Final Pricing
            </h3>
          </div>
          <span className="text-[10px] font-bold tracking-wider uppercase bg-emerald-950/60 text-emerald-400 border border-emerald-800/40 px-2 py-0.5 rounded-full">
            Live
          </span>
        </div>

        {/* Live subtotal breakdown rows */}
        <div className="space-y-2 text-xs text-slate-400">
          {costRows.map(([label, val]) => (
            <div key={label} className="flex justify-between items-center">
              <span>{label}:</span>
              <strong className="text-slate-200 font-medium tabular-nums">
                {formatLKR(val)}
              </strong>
            </div>
          ))}
        </div>

        {/* Subtotal Cost */}
        <div className="pt-3 border-t border-slate-800 flex justify-between items-center font-bold text-sm text-slate-100">
          <span>Total Cost (LKR):</span>
          <span className="text-sky-400 tabular-nums">
            {formatLKR(breakdown.sub)}
          </span>
        </div>

        {/* Markup block */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
          <div className="flex justify-between items-center text-xs font-semibold text-amber-400">
            <span className="flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5" />
              Add Markup (%)
            </span>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min="0"
                max="100"
                value={pricing.markup}
                onChange={e =>
                  onPricingChange({
                    markup: Math.max(0, parseFloat(e.target.value) || 0)
                  })
                }
                className="w-16 bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-right font-bold text-amber-300 focus:outline-none focus:border-amber-400 text-xs"
              />
              <span className="text-slate-400">%</span>
            </div>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Markup Value:</span>
            <strong className="text-amber-400 font-medium tabular-nums">
              {formatLKR(breakdown.mk)}
            </strong>
          </div>
        </div>

        {/* Discount block */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-emerald-400">
            <span className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              Discount
            </span>
            <div className="flex items-center gap-1.5">
              <select
                value={pricing.discType}
                onChange={e =>
                  onPricingChange({
                    discType: e.target.value as 'pct' | 'lkr' | 'usd'
                  })
                }
                className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-emerald-400"
              >
                <option value="pct">%</option>
                <option value="lkr">LKR</option>
                <option value="usd">USD</option>
              </select>
              <input
                type="number"
                min="0"
                value={pricing.discVal}
                onChange={e =>
                  onPricingChange({
                    discVal: Math.max(0, parseFloat(e.target.value) || 0)
                  })
                }
                className="w-24 bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-right font-bold text-emerald-300 focus:outline-none focus:border-emerald-400 text-xs"
              />
            </div>
          </div>

          <div className="flex justify-between text-xs text-slate-400">
            <span>Price before discount:</span>
            <span className="tabular-nums font-medium text-slate-300">
              {formatLKR(breakdown.pre)}
            </span>
          </div>

          <div className="flex justify-between text-xs text-slate-400">
            <span>Discount given:</span>
            <strong className="text-emerald-400 font-medium tabular-nums">
              {breakdown.dAmt > 0 ? '- ' : ''}
              {formatLKR(breakdown.dAmt)}
            </strong>
          </div>
          <p className="text-[10px] text-slate-500 italic">
            Choose % or a fixed amount (LKR / USD). Only one applies at a time.
          </p>
        </div>

        {/* Quotation Currency Checkboxes */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
          <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-300">
            Quotation Currency Display
          </span>
          <div className="grid grid-cols-1 gap-2 pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-200">
              <input
                type="checkbox"
                checked={pricing.showUsd !== false}
                onChange={e => {
                  const val = e.target.checked;
                  if (!val && pricing.showLkr === false) return;
                  onPricingChange({ showUsd: val });
                }}
                className="w-4 h-4 rounded border-slate-700 text-teal-500 focus:ring-teal-500 bg-slate-900 cursor-pointer"
              />
              <span className="font-semibold text-teal-400">Show USD ($) in Quotation</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-200">
              <input
                type="checkbox"
                checked={pricing.showLkr !== false}
                onChange={e => {
                  const val = e.target.checked;
                  if (!val && pricing.showUsd === false) return;
                  onPricingChange({ showLkr: val });
                }}
                className="w-4 h-4 rounded border-slate-700 text-sky-500 focus:ring-sky-500 bg-slate-900 cursor-pointer"
              />
              <span className="font-semibold text-sky-400">
                Show LKR (Rs) in Quotation <span className="text-[10px] text-slate-400 font-normal">(incl. Per-Person LKR rate)</span>
              </span>
            </label>
          </div>
          <p className="text-[10px] text-slate-500">
            Controls which currencies appear on the quotation output, including the Per-Person LKR rate.
          </p>
        </div>

        {/* Final Price Displays */}
        <div className="space-y-3 pt-1">
          {/* Final LKR */}
          {pricing.showLkr !== false && (
            <div className="bg-gradient-to-r from-sky-950 to-slate-900 border border-sky-600/40 p-4 rounded-xl text-right shadow-sm">
              <span className="block text-[11px] uppercase font-bold tracking-wider text-sky-400">
                Final Package Price (LKR)
              </span>
              <div className="text-2xl font-black text-slate-100 mt-0.5 tabular-nums">
                {formatLKR(breakdown.fin)}
              </div>
            </div>
          )}

          {/* Final USD */}
          {pricing.showUsd !== false && (
            <div className="bg-gradient-to-r from-slate-900 to-teal-950 border border-teal-500/40 p-4 rounded-xl text-right shadow-sm">
              <span className="block text-[11px] uppercase font-bold tracking-wider text-teal-400">
                Final Package Price (USD)
              </span>
              <div className="text-2xl font-black text-teal-300 mt-0.5 tabular-nums">
                {formatUSD(breakdown.usd)}
              </div>
              <span className="text-[10px] text-slate-400 mt-1 block">
                1 USD = {pricing.usdRate.toLocaleString()} LKR
              </span>
            </div>
          )}

          {/* Per Person */}
          <div className="bg-slate-950 border border-amber-500/40 p-3.5 rounded-xl text-right shadow-sm">
            <span className="block text-[11px] uppercase font-bold tracking-wider text-amber-400">
              Per Person Package Cost ({breakdown.pax} Pax)
            </span>
            {pricing.showLkr !== false && (
              <div className="text-lg font-black text-slate-100 mt-0.5 tabular-nums">
                {formatLKR(breakdown.ppLKR)} <span className="text-xs font-normal text-slate-400">/ person</span>
              </div>
            )}
            {pricing.showUsd !== false && (
              <div className="text-sm font-bold text-teal-300 tabular-nums">
                {formatUSD(breakdown.ppUSD)} <span className="text-xs font-normal text-slate-400">/ person</span>
              </div>
            )}
            {isGroup && (
              <div className="mt-2 text-left bg-sky-950/80 border border-sky-700/60 p-2 rounded-lg text-[10px] text-sky-300 font-medium">
                ★ <b>Group Tour Mode Active:</b> Quotation outputs (PDF, Print, Online Proposal, WhatsApp) will display only this per-person rate.
              </div>
            )}
          </div>

          {/* Amount in Words (Numbering & Wording display) */}
          <div className="p-3 bg-slate-950/90 rounded-xl border border-slate-800 space-y-1.5 text-left">
            <span className="block text-[10px] font-bold uppercase tracking-wider text-amber-400">
              Total Rate in Words (Official Wording):
            </span>
            {pricing.showUsd !== false && (
              <div className="text-[11px] text-teal-300 leading-tight">
                <b>USD:</b> {numberToWords(breakdown.usd, 'USD')}
              </div>
            )}
            {pricing.showLkr !== false && (
              <div className="text-[11px] text-sky-300 leading-tight">
                <b>LKR:</b> {numberToWords(breakdown.fin, 'LKR')}
              </div>
            )}
            {isGroup && (
              <div className="pt-1.5 border-t border-slate-800/80 text-[10px] text-slate-400">
                <span className="text-amber-300 font-medium">Per-Person Wording:</span>{' '}
                {pricing.showUsd !== false && `${numberToWords(breakdown.ppUSD, 'USD')} per person`}
                {pricing.showUsd !== false && pricing.showLkr !== false && '  |  '}
                {pricing.showLkr !== false && `${numberToWords(breakdown.ppLKR, 'LKR')} per person`}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 pt-2">
          {/* WhatsApp Share Button */}
          {onShareWhatsApp && (
            <button
              type="button"
              onClick={onShareWhatsApp}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Share via WhatsApp</span>
            </button>
          )}

          {/* Online Web Proposal Button */}
          {onPreviewOnlineProposal && (
            <button
              type="button"
              onClick={onPreviewOnlineProposal}
              className="w-full py-2.5 px-4 bg-sky-950 hover:bg-sky-900 border border-sky-800/80 text-sky-200 font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-sm"
            >
              <Globe className="w-4 h-4 text-sky-400" />
              <span>Generate Shareable Online Link</span>
            </button>
          )}

          <button
            type="button"
            onClick={onSaveQuote}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-400 font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save Quotation Record</span>
          </button>

          <button
            type="button"
            onClick={onDownloadPDF}
            className="w-full py-2.5 px-4 bg-sky-700 hover:bg-sky-600 text-white font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <FileText className="w-4 h-4" />
            <span>Download Quotation PDF</span>
          </button>

          <button
            type="button"
            onClick={onPrintQuote}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Quotation</span>
          </button>

          <button
            type="button"
            onClick={onExportExcel}
            className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Export to Excel Workbook</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
