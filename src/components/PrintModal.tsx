import React from 'react';
import { Printer, X } from 'lucide-react';
import {
  CompanyDetails,
  CustomerDetails,
  GuideDetails,
  LogoData,
  NightConfig,
  OtherCharge,
  PaxDetails,
  PricingBreakdown,
  PricingConfig,
  TransportDetails
} from '../types';
import { formatLKR, formatUSD, numberToWords } from '../utils/calc';

interface PrintModalProps {
  isOpen: boolean;
  customer: CustomerDetails;
  pax: PaxDetails;
  nights: NightConfig[];
  transport: TransportDetails;
  guide: GuideDetails;
  pricing: PricingConfig;
  others: OtherCharge[];
  breakdown: PricingBreakdown;
  company: CompanyDetails;
  logo: LogoData | null;
  onClose: () => void;
  onTriggerPrint: () => void;
}

export const PrintModal: React.FC<PrintModalProps> = ({
  isOpen,
  customer,
  pax,
  nights,
  transport,
  guide,
  pricing,
  others,
  breakdown,
  company,
  logo,
  onClose,
  onTriggerPrint
}) => {
  if (!isOpen) return null;

  const days = Math.max(1, pax.days || 1);
  const nightCount = Math.max(0, days - 1);

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden shadow-2xl my-auto">
        {/* Modal Toolbar */}
        <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-sky-400" />
            <b className="text-slate-100 text-sm">Quotation Print Preview</b>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onTriggerPrint}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-700 hover:bg-sky-600 text-white transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Document</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-100 p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Paper Document Preview */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-950/60">
          <div className="max-w-[800px] mx-auto bg-white text-slate-900 p-8 rounded-xl shadow-xl font-sans text-xs space-y-5">
            {/* Document Header */}
            <div className="flex justify-between items-start border-b-2 border-sky-600 pb-4">
              <div className="flex items-center gap-4">
                {logo && logo.data && (
                  <img
                    src={logo.data}
                    alt="Logo"
                    className="h-16 w-auto max-w-[160px] object-contain -mt-2"
                  />
                )}
                <div>
                  <h1 className="text-lg font-black text-slate-900 tracking-tight leading-none">
                    VOYA LANKA TOURS (PVT) LTD.
                  </h1>
                  <p className="text-[9px] text-amber-700 italic font-medium tracking-wider mt-1 uppercase">
                    MORE THAN A DESTINATION
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold tracking-wider mt-0.5">
                    Tour Itinerary &amp; Inventory Confirmation Voucher
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-mono font-bold text-sky-600 text-sm">
                  {customer.qno || 'QT-DRAFT'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Date: {new Date().toISOString().slice(0, 10)}
                </div>
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-base font-extrabold tracking-wider text-slate-900 uppercase">
                Quotation
              </h2>
            </div>

            {/* Customer & Tour details table */}
            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="space-y-1">
                <span className="font-bold text-sky-700 block text-[11px] uppercase tracking-wide">
                  Customer Details:
                </span>
                <div>Name: <b>{customer.custName || 'Valued Guest'}</b></div>
                <div>Email: {customer.custEmail || 'N/A'}</div>
                <div>Phone: {customer.custPhone || 'N/A'}</div>
                <div>Country: {customer.custCountry || 'N/A'}</div>
              </div>
              <div className="space-y-1">
                <span className="font-bold text-sky-700 block text-[11px] uppercase tracking-wide">
                  Tour Details:
                </span>
                <div>Duration: <b>{days} Days / {nightCount} Nights</b></div>
                <div>Pax: <b>{pax.adults} Adults, {pax.child12} Children (&lt;12), {pax.child5} Children (&lt;5)</b></div>
                <div>Arrival Date: {customer.travelDate || 'Flexible'}</div>
                <div>Notes: {customer.custNotes || 'None'}</div>
              </div>
            </div>

            {/* Accommodation & Meal Schedule */}
            {nightCount > 0 && (
              <div>
                <h3 className="font-bold text-sky-700 border-b border-slate-200 pb-1 mb-2 text-xs uppercase">
                  Accommodation &amp; Meal Schedule
                </h3>
                <table className="w-full border-collapse border border-slate-200 text-[11px]">
                  <thead>
                    <tr className="bg-slate-100 text-left">
                      <th className="p-2 border border-slate-200">Date</th>
                      <th className="p-2 border border-slate-200">Hotel</th>
                      <th className="p-2 border border-slate-200">Room &amp; View</th>
                      <th className="p-2 border border-slate-200">Bed</th>
                      <th className="p-2 border border-slate-200">Meal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nights.slice(0, nightCount).map(night => {
                      const getNightDateStr = (n: number) => {
                        let d0: Date;
                        if (customer.travelDate) {
                          d0 = new Date(customer.travelDate + 'T00:00:00');
                          if (isNaN(d0.getTime())) d0 = new Date();
                        } else {
                          d0 = new Date();
                        }
                        d0.setDate(d0.getDate() + (n - 1));
                        return d0.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
                      };

                      return night.rooms.map((room, rIdx) => (
                        <tr key={`${night.nightNumber}-${rIdx}`} className="border-b border-slate-200">
                          <td className="p-2 border border-slate-200 font-bold whitespace-nowrap">
                            {getNightDateStr(night.nightNumber)}
                          </td>
                          <td className="p-2 border border-slate-200">
                            <b>{room.hotel}</b>
                            <div className="text-[10px] text-slate-500">{room.category}</div>
                          </td>
                          <td className="p-2 border border-slate-200">
                            {room.roomCategory}
                            <div className="text-[10px] text-slate-500">{room.roomView}</div>
                          </td>
                          <td className="p-2 border border-slate-200">{room.bedType}</td>
                          <td className="p-2 border border-slate-200">{room.meal}</td>
                        </tr>
                      ));
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Transport & Service Inclusions */}
            <div>
              <h3 className="font-bold text-sky-700 border-b border-slate-200 pb-1 mb-2 text-xs uppercase">
                Transport &amp; Service Inclusions
              </h3>
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-lg space-y-1 text-[11px]">
                <div>&bull; <b>Vehicle:</b> Private {transport.vehicleType} for {days} Days</div>
                <div>&bull; <b>Chauffeur / Guide:</b> {guide.guideType}</div>
                <div>&bull; <b>Fuel:</b> Complete fuel charges covered for entire tour ({transport.fuelKm} km)</div>
                <div>&bull; <b>Tolls &amp; Parking:</b> Expressway toll &amp; designated site parking included</div>
                {others.filter(o => o.showInQuotation !== false).map((o, idx) => {
                  const rate = pricing.usdRate || 305;
                  const unitUsd =
                    o.unitPriceUsd !== undefined
                      ? o.unitPriceUsd
                      : o.unitPrice
                      ? Math.round((o.unitPrice / rate) * 100) / 100
                      : Math.round((o.cost / rate) * 100) / 100;
                  const totalUsd = Math.round(unitUsd * (o.qty ?? 1));
                  const showPrice = o.showPriceInQuotation !== false;
                  return (
                    <div key={idx} className="flex justify-between items-center">
                      <span>&bull; {o.name} {o.qty && o.qty > 1 ? `(${o.qty}x)` : ''}</span>
                      {showPrice ? (
                        <span className="text-emerald-700 font-semibold">$ {totalUsd} USD</span>
                      ) : (
                        <span className="text-slate-400 italic text-[10px]">Included</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Price Box (Exchange rate omitted as requested; Numbering & Wording included) */}
            {(() => {
              const showUsd = pricing.showUsd !== false;
              const showLkr = pricing.showLkr !== false;

              if (pax.isGroup) {
                return (
                  <div className="bg-slate-50 p-4 rounded-lg border-t-2 border-sky-700 space-y-2">
                    <div className="flex justify-between items-center">
                      <div className="text-xs text-slate-600">
                        <span className="font-bold text-sky-800 uppercase block text-[10px]">
                          Group Tour Package
                        </span>
                        Quotation based on <b>{breakdown.pax}</b> paying travelers
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] font-bold text-slate-500 uppercase">
                          Rate Per Person ({breakdown.pax} Pax)
                        </div>
                        {showUsd && (
                          <div className="text-xl font-black text-sky-800">
                            {formatUSD(breakdown.ppUSD)} <span className="text-xs font-normal text-slate-500">/ person</span>
                          </div>
                        )}
                        {showLkr && (
                          <div className="text-sm font-bold text-slate-700">
                            {formatLKR(breakdown.ppLKR)} / person
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Rate in Words */}
                    <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-700 font-medium">
                      <span className="font-bold text-slate-900">Rate in Words: </span>
                      {showUsd && `${numberToWords(breakdown.ppUSD, 'USD')} per person`}
                      {showUsd && showLkr && '  |  '}
                      {showLkr && `${numberToWords(breakdown.ppLKR, 'LKR')} per person`}
                    </div>
                  </div>
                );
              }

              return (
                <div className="bg-slate-50 p-4 rounded-lg border-t-2 border-slate-900 space-y-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="text-xl font-black text-slate-900 uppercase tracking-tight">
                        Total Package Price
                      </div>
                      {breakdown.dAmt > 0 && (
                        <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
                          Discount Applied: {pricing.discType === 'pct' ? `${pricing.discVal}%` : pricing.discType === 'usd' ? `USD ${pricing.discVal}` : `LKR ${pricing.discVal}`}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      {showUsd && (
                        <div className="text-xl font-black text-sky-700">
                          {formatUSD(breakdown.usd)}
                        </div>
                      )}
                      {showLkr && (
                        <div className="text-base font-bold text-slate-900">
                          {formatLKR(breakdown.fin)}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800 uppercase text-[10px]">
                      Per Person Package Cost ({breakdown.pax} Pax)
                    </span>
                    <div className="text-right text-xs text-slate-700 font-medium">
                      {showUsd && (
                        <span className="text-sky-800 font-bold">
                          {formatUSD(breakdown.ppUSD)} <span className="text-[10px] font-normal text-slate-500">/ person</span>
                        </span>
                      )}
                      {showUsd && showLkr && <span className="mx-2 text-slate-300">|</span>}
                      {showLkr && (
                        <span className="text-slate-800 font-bold">
                          {formatLKR(breakdown.ppLKR)} <span className="text-[10px] font-normal text-slate-500">/ person</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Amount in Words */}
                  <div className="pt-2 border-t border-slate-200 text-[11px] text-slate-700 font-medium">
                    <span className="font-bold text-slate-900">Amount in Words: </span>
                    {showUsd && `${numberToWords(breakdown.usd, 'USD')}`}
                    {showUsd && showLkr && '  |  '}
                    {showLkr && `${numberToWords(breakdown.fin, 'LKR')}`}
                  </div>
                </div>
              );
            })()}

            {/* Company Footer */}
            <div className="text-center text-[10px] text-slate-400 pt-3 border-t border-slate-200 space-y-1">
              <div>
                {[company.name || 'Voya Lanka Tours (Pvt) Ltd.', company.address, company.phone, company.email, company.website, company.reg]
                  .filter(Boolean)
                  .join(' | ')}
              </div>
              <div>Voya Lanka Tours (Pvt) Ltd.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
