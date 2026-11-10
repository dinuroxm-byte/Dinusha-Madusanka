import React, { useEffect, useRef, useState } from 'react';
import { Building2, CheckSquare, FileCheck, Layers, Square, X } from 'lucide-react';

interface VoucherModalProps {
  isOpen: boolean;
  nightNumber: number | null;
  hotelName: string;
  nightsWithSameHotel: number[];
  initialConfirmedBy: string;
  travelDate?: string;
  onClose: () => void;
  onExport: (nightNumbers: number[], confirmedBy: string) => void;
}

export const VoucherModal: React.FC<VoucherModalProps> = ({
  isOpen,
  nightNumber,
  hotelName,
  nightsWithSameHotel,
  initialConfirmedBy,
  travelDate,
  onClose,
  onExport
}) => {
  const [confirmedBy, setConfirmedBy] = useState(initialConfirmedBy);
  const [combineSameHotel, setCombineSameHotel] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const getFormattedDate = (num: number, short = false): string => {
    let d: Date;
    if (travelDate) {
      d = new Date(travelDate + 'T00:00:00');
      if (isNaN(d.getTime())) d = new Date();
    } else {
      d = new Date();
    }
    d.setDate(d.getDate() + (num - 1));
    return d.toLocaleDateString('en-GB', {
      weekday: short ? undefined : 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const hasMultipleNights = nightsWithSameHotel.length > 1;

  useEffect(() => {
    if (isOpen) {
      setConfirmedBy(initialConfirmedBy);
      setCombineSameHotel(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, initialConfirmedBy]);

  if (!isOpen || nightNumber === null) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmedBy.trim()) return;
    const nightsToInclude = (hasMultipleNights && combineSameHotel)
      ? nightsWithSameHotel
      : [nightNumber];
    onExport(nightsToInclude, confirmedBy.trim());
  };

  const includedNights = (hasMultipleNights && combineSameHotel)
    ? nightsWithSameHotel
    : [nightNumber];

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div className="flex items-center gap-2">
            <FileCheck className="w-5 h-5 text-emerald-400" />
            <b className="text-slate-100 text-sm">
              {hasMultipleNights && combineSameHotel
                ? `Export Consolidated Voucher - ${hotelName || 'Hotel'}`
                : `Export Room Voucher - ${getFormattedDate(nightNumber)}`}
            </b>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Hotel & Night summary callout */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Building2 className="w-4 h-4 text-sky-400" />
              <span>{hotelName || 'Designated Hotel'}</span>
            </div>

            {hasMultipleNights ? (
              <div className="space-y-2 pt-1 border-t border-slate-800/80">
                <div className="flex items-start gap-2 text-xs text-amber-300">
                  <Layers className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Matching Hotel Stay Detected:</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      This hotel is booked for multiple dates: <b>{nightsWithSameHotel.map(n => getFormattedDate(n, true)).join(', ')}</b> ({nightsWithSameHotel.length} Nights total).
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCombineSameHotel(!combineSameHotel)}
                  className="flex items-center gap-2 text-xs font-medium text-emerald-300 bg-emerald-950/50 hover:bg-emerald-900/40 border border-emerald-800/60 rounded-lg p-2 w-full text-left transition-colors cursor-pointer"
                >
                  {combineSameHotel ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                  <span>
                    Include all <b>{nightsWithSameHotel.length} nights</b> at this hotel in one consolidated voucher (Recommended)
                  </span>
                </button>
              </div>
            ) : (
              <div className="text-xs text-slate-400">
                Stay Date: <strong className="text-sky-300">{getFormattedDate(nightNumber)}</strong>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Room Confirmed By (Staff / Reservation Agent Name)
            </label>
            <input
              ref={inputRef}
              type="text"
              value={confirmedBy}
              onChange={e => setConfirmedBy(e.target.value)}
              placeholder="Enter name (e.g. Kasun Fernando / Reservations Desk)"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-sky-500"
            />
            <p className="text-[11px] text-slate-400 mt-1.5">
              This confirmation agent name will be printed on the official voucher for{' '}
              <strong className="text-sky-300">
                {includedNights.map(n => getFormattedDate(n, true)).join(', ')}
              </strong>.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!confirmedBy.trim()}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition-colors cursor-pointer"
            >
              <FileCheck className="w-3.5 h-3.5" />
              <span>
                {includedNights.length > 1
                  ? `Export Consolidated Voucher (${includedNights.length} Nights)`
                  : 'Export Room Voucher'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
