import React from 'react';
import {
  FileText,
  RefreshCw,
  Route,
  Save,
  X
} from 'lucide-react';
import { CustomerDetails, ItineraryData, NightConfig, PaxDetails } from '../types';

interface ItineraryModalProps {
  isOpen: boolean;
  itinerary: ItineraryData;
  customer: CustomerDetails;
  pax: PaxDetails;
  nights: NightConfig[];
  onClose: () => void;
  onItineraryChange: (itinerary: ItineraryData) => void;
  onRefreshOvernightStays: () => void;
  onSaveWithQuotation: () => void;
  onExportItineraryPDF: () => void;
}

export const ItineraryModal: React.FC<ItineraryModalProps> = ({
  isOpen,
  itinerary,
  customer,
  pax,
  nights,
  onClose,
  onItineraryChange,
  onRefreshOvernightStays,
  onSaveWithQuotation,
  onExportItineraryPDF
}) => {
  if (!isOpen) return null;

  const daysCount = pax.days || 1;
  const nightsCount = Math.max(0, daysCount - 1);

  const getDayDateStr = (dayNum: number): string | null => {
    if (!customer.travelDate) return null;
    const d0 = new Date(customer.travelDate + 'T00:00:00');
    if (isNaN(d0.getTime())) return null;
    d0.setDate(d0.getDate() + dayNum - 1);
    return d0.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const handleDayUpdate = (index: number, fields: { title?: string; acts?: string; stay?: string; auto?: boolean }) => {
    const updatedDays = [...itinerary.days];
    updatedDays[index] = { ...updatedDays[index], ...fields };
    onItineraryChange({ ...itinerary, days: updatedDays });
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl my-6 overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex flex-wrap justify-between items-center bg-slate-950 gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Route className="w-5 h-5 text-sky-400" />
              <b className="text-slate-100 text-sm">Tour Itinerary Builder</b>
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {daysCount} Days / {nightsCount} Nights &middot; {customer.qno || 'Draft'}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={onRefreshOvernightStays}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
              title="Refresh overnight hotels from accommodation cards"
            >
              <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
              <span>Refresh Overnight Stays</span>
            </button>

            <button
              onClick={onSaveWithQuotation}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save with Quotation</span>
            </button>

            <button
              onClick={onExportItineraryPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-sky-700 hover:bg-sky-600 text-white transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export Itinerary PDF</span>
            </button>

            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Customer & Traveler Summary Card */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-semibold text-sky-400">
              <span>Customer &amp; Traveler Details (Included in Itinerary Output)</span>
              <span className="text-[11px] text-slate-400 font-normal">
                Arrival: <strong className="text-slate-200">{customer.travelDate || 'Flexible'}</strong>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-xs text-slate-300">
              <div>
                <span className="text-[10px] text-slate-500 block">Customer Name</span>
                <span className="font-medium text-slate-100">{customer.custName || 'Valued Guest'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Country / Nationality</span>
                <span className="font-medium text-slate-200">{customer.custCountry || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Contact</span>
                <span className="font-medium text-slate-200">{customer.custPhone || customer.custEmail || 'N/A'}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Travelers</span>
                <span className="font-medium text-amber-400">
                  {pax.adults} Adults{(pax.child12 || 0) + (pax.child5 || 0) > 0 ? `, ${(pax.child12 || 0) + (pax.child5 || 0)} Children` : ''}
                </span>
              </div>
            </div>
            {customer.custNotes && (
              <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-900">
                Special Remarks: <span className="text-slate-200">{customer.custNotes}</span>
              </div>
            )}
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Tour dates automatically calculate from the <b>Travel Arrival Date</b> and number of days. Overnight hotels reflect the <b>Accommodation &amp; Overnight Dates</b> cards. Start an activity line with a time like <code className="text-amber-300 font-mono">04:30 AM:</code> or with <code className="text-amber-300 font-mono">Optional Activity:</code> to automatically bold that segment in the exported PDF.
          </p>

          {/* Greeting */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Client Greeting Message
            </label>
            <textarea
              rows={3}
              value={itinerary.greeting}
              onChange={e => onItineraryChange({ ...itinerary, greeting: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:border-sky-500 leading-relaxed"
            />
          </div>

          {/* Days */}
          <div className="space-y-4 pt-1">
            {itinerary.days.map((day, idx) => {
              const dateStr = getDayDateStr(idx + 1);
              const isLastDay = idx === itinerary.days.length - 1;

              return (
                <div
                  key={idx}
                  className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3"
                >
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400">
                    <span className="w-6 h-6 rounded-full bg-sky-700 text-white flex items-center justify-center font-bold text-xs">
                      {idx + 1}
                    </span>
                    <span>DAY {idx + 1}</span>
                    {dateStr && (
                      <span className="text-slate-400 font-normal">
                        - {dateStr.toUpperCase()}
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Day Title (e.g. ARRIVAL IN SRI LANKA - COLOMBO CITY TOUR)
                    </label>
                    <input
                      type="text"
                      value={day.title}
                      onChange={e => handleDayUpdate(idx, { title: e.target.value })}
                      placeholder="e.g. ARRIVAL IN SRI LANKA - AIRPORT PICKUP & DAMBULLA"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Activities for this day (One per line)
                    </label>
                    <textarea
                      rows={4}
                      value={day.acts}
                      onChange={e => handleDayUpdate(idx, { acts: e.target.value })}
                      placeholder="08:00 AM: Breakfast at the hotel&#10;09:30 AM: Guided tour of Sigiriya Lion Rock fortress&#10;Optional Activity: Ayurvedic Spa & Massage treatment in evening"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500 font-mono leading-relaxed"
                    />
                  </div>

                  {!isLastDay && (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 mb-1">
                        Overnight Stay Hotel &amp; Location
                      </label>
                      <input
                        type="text"
                        value={day.stay}
                        onChange={e =>
                          handleDayUpdate(idx, { stay: e.target.value, auto: false })
                        }
                        placeholder="e.g. Heritance Kandalama, Dambulla"
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Closing Message */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Closing Message
            </label>
            <textarea
              rows={2}
              value={itinerary.closing}
              onChange={e => onItineraryChange({ ...itinerary, closing: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-100 focus:outline-none focus:border-sky-500 leading-relaxed"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
