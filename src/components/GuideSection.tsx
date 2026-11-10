import React from 'react';
import { Bed, UserCog } from 'lucide-react';
import { GUIDE_OPTIONS, GuideDetails } from '../types';
import { formatLKR } from '../utils/calc';

interface GuideSectionProps {
  guide: GuideDetails;
  days: number;
  onGuideChange: (fields: Partial<GuideDetails>) => void;
}

export const GuideSection: React.FC<GuideSectionProps> = ({
  guide,
  days,
  onGuideChange
}) => {
  const nights = Math.max(0, days - 1);
  const crewTotal = nights * (Number(guide.crewRoom) || 0);

  const handleGuideSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedLabel = e.target.value;
    const found = GUIDE_OPTIONS.find(g => g.label === selectedLabel);
    if (found) {
      onGuideChange({
        guideType: found.label,
        guideFee: found.rate
      });
    } else {
      onGuideChange({ guideType: selectedLabel });
    }
  };

  return (
    <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex items-center gap-2">
        <UserCog className="w-4 h-4 text-sky-400" />
        <h3 className="text-sm font-semibold text-slate-100">
          Guide Services &amp; Crew Accommodation
        </h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Guide Type / Language
          </label>
          <select
            value={guide.guideType}
            onChange={handleGuideSelect}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
          >
            <option value="">Select guide type...</option>
            {GUIDE_OPTIONS.map(g => (
              <option key={g.label} value={g.label}>
                {g.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1">
            Guide Daily Fee (LKR)
          </label>
          <input
            type="number"
            min="0"
            step="500"
            value={guide.guideFee || ''}
            placeholder="0"
            onChange={e =>
              onGuideChange({ guideFee: parseFloat(e.target.value) || 0 })
            }
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-right font-bold text-slate-100 focus:outline-none focus:border-sky-500 transition-colors"
          />
        </div>
      </div>

      {/* Crew Accommodation Box */}
      <div className="bg-slate-950/70 p-4 rounded-xl border border-slate-800/90 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-1 text-xs">
          <div className="flex items-center gap-1.5 font-bold text-teal-400">
            <Bed className="w-4 h-4" />
            <span>Guide or Driver Room (LKR)</span>
          </div>
          <span className="text-[11px] text-slate-400 italic">
            Rule: calculate NIGHT COUNT, not days
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Room Charge / Night
            </label>
            <input
              type="number"
              min="0"
              step="500"
              value={guide.crewRoom || ''}
              placeholder="0"
              onChange={e =>
                onGuideChange({ crewRoom: parseFloat(e.target.value) || 0 })
              }
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-right font-bold text-slate-100 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="text-xs text-slate-400">
            Calculation:{' '}
            <strong className="text-slate-200">
              {nights} Nights &times; LKR {(Number(guide.crewRoom) || 0).toLocaleString()}
            </strong>
          </div>

          <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800 text-right">
            <span className="block text-[10px] text-slate-400">Total Crew Room Cost</span>
            <span className="text-sm font-bold text-teal-300">
              {formatLKR(crewTotal)}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
