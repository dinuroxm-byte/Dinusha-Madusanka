import React from 'react';
import { Bookmark, BookmarkCheck, MessageCircle, RefreshCw, UserCheck, Users } from 'lucide-react';
import { CustomerDetails } from '../types';

interface CustomerSectionProps {
  customer: CustomerDetails;
  usdRate: number;
  customerCount?: number;
  onCustomerChange: (fields: Partial<CustomerDetails>) => void;
  onUsdRateChange: (rate: number) => void;
  onRegenerateId: () => void;
  onOpenCustomerDb?: () => void;
  onSaveToDatabase?: () => void;
  onShareWhatsApp?: () => void;
}

export const CustomerSection: React.FC<CustomerSectionProps> = ({
  customer,
  usdRate,
  customerCount = 0,
  onCustomerChange,
  onUsdRateChange,
  onRegenerateId,
  onOpenCustomerDb,
  onSaveToDatabase,
  onShareWhatsApp
}) => {
  const [rateInput, setRateInput] = React.useState<string>(usdRate ? String(usdRate) : '305');

  React.useEffect(() => {
    if (usdRate && parseFloat(rateInput) !== usdRate) {
      setRateInput(String(usdRate));
    }
  }, [usdRate]);

  const handleRateInputChange = (val: string) => {
    setRateInput(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num > 0) {
      onUsdRateChange(num);
    }
  };

  const handleRateInputBlur = () => {
    const num = parseFloat(rateInput);
    if (!isNaN(num) && num > 0) {
      onUsdRateChange(num);
    } else {
      setRateInput(String(usdRate || 305));
      onUsdRateChange(usdRate || 305);
    }
  };

  return (
    <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Top row: System Auto ID & USD Exchange Rate */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400 block mb-1">
            SYSTEM AUTO ID
          </span>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={customer.qno}
              className="w-52 bg-slate-950 border border-slate-700/80 rounded-lg px-3 py-1.5 font-mono font-bold text-sky-400 text-sm focus:outline-none focus:border-sky-500"
            />
            <button
              onClick={onRegenerateId}
              title="Generate new ID"
              className="p-2 text-xs rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="bg-slate-950/90 px-4 py-2.5 rounded-xl border border-slate-800 flex items-center gap-3">
          <div>
            <label className="block text-[11px] text-slate-400 font-medium mb-1">
              USD Conversion Rate (Manual)
            </label>
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="text-slate-300 font-medium">1 USD =</span>
              <input
                type="number"
                min="1"
                step="any"
                value={rateInput}
                onChange={e => handleRateInputChange(e.target.value)}
                onBlur={handleRateInputBlur}
                placeholder="305"
                className="w-24 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-center font-bold text-amber-400 focus:outline-none focus:border-amber-400"
              />
              <span className="font-semibold text-slate-400">LKR</span>
            </div>
          </div>
        </div>
      </div>

      {/* Title & Saved in CRM Badge */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-sky-400">
            <UserCheck className="w-4 h-4" />
            <h3 className="text-sm font-semibold text-slate-100">
              Customer &amp; Traveler Details
            </h3>
          </div>
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-emerald-950/80 border border-emerald-700/60 text-emerald-300">
            <BookmarkCheck className="w-3 h-3 text-emerald-400" />
            <span>Saved in CRM</span>
          </span>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {onSaveToDatabase && (
            <button
              type="button"
              onClick={onSaveToDatabase}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-950/60 hover:bg-sky-900/60 border border-sky-800 text-sky-300 transition-colors cursor-pointer"
              title="Save current customer to database CRM"
            >
              <Bookmark className="w-3.5 h-3.5 text-sky-400" />
              <span>Save to Database</span>
            </button>
          )}

          {onOpenCustomerDb && (
            <button
              type="button"
              onClick={onOpenCustomerDb}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-950/40 hover:bg-purple-900/60 border border-purple-800/80 text-purple-300 transition-colors cursor-pointer"
              title="Search customer database and directory"
            >
              <Users className="w-3.5 h-3.5 text-purple-400" />
              <span>Customer Database</span>
              <span className="bg-indigo-600 text-white font-bold text-[10px] px-1.5 py-0.2 rounded-full ml-0.5">
                {customerCount}
              </span>
            </button>
          )}

          {onShareWhatsApp && (
            <button
              type="button"
              onClick={onShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/80 text-emerald-300 transition-colors cursor-pointer"
              title="Share quotation summary and link via WhatsApp"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400 fill-emerald-400/20" />
              <span>Share via WhatsApp</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Customer Full Name
          </label>
          <input
            type="text"
            value={customer.custName}
            placeholder="e.g. John Doe"
            onChange={e => onCustomerChange({ custName: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Email Address
          </label>
          <input
            type="email"
            value={customer.custEmail}
            placeholder="john@example.com"
            onChange={e => onCustomerChange({ custEmail: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Contact / WhatsApp
          </label>
          <input
            type="text"
            value={customer.custPhone}
            placeholder="+1 234 567 890"
            onChange={e => onCustomerChange({ custPhone: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Country / Nationality
          </label>
          <input
            type="text"
            value={customer.custCountry}
            placeholder="e.g. United Kingdom"
            onChange={e => onCustomerChange({ custCountry: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Travel Arrival Date
          </label>
          <input
            type="date"
            value={customer.travelDate}
            onChange={e => onCustomerChange({ travelDate: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Special Remarks / Notes
          </label>
          <input
            type="text"
            value={customer.custNotes}
            placeholder="Honeymooners, Veg, etc."
            onChange={e => onCustomerChange({ custNotes: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>
      </div>
    </section>
  );
};
