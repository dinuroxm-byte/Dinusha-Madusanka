import React from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  Download,
  FileText,
  Hotel,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Plane,
  Printer,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
  Utensils,
  XCircle
} from 'lucide-react';
import { LEGAL_NAME, ShareableQuotationData } from '../types';
import { formatLKR, formatUSD, numberToWords } from '../utils/calc';
import { downloadBlob, generateQuotationPDF, QuoteExportData } from '../utils/pdfExport';
import { cleanWhatsAppPhone } from '../utils/shareLink';

interface OnlineProposalViewProps {
  data: ShareableQuotationData;
  onBackToEditor?: () => void;
  showToast?: (msg: string) => void;
}

export const OnlineProposalView: React.FC<OnlineProposalViewProps> = ({
  data,
  onBackToEditor,
  showToast
}) => {
  const c = data.customer;
  const p = data.pax;
  const b = data.breakdown;
  const comp = data.company;
  const totalNights = Math.max(0, p.days - 1);
  const totalPax = p.adults + p.child12 + p.child5;

  const travelDateFormatted = c.travelDate
    ? new Date(c.travelDate + 'T00:00:00').toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    : 'Date to be confirmed';

  const getNightDate = (nightNumber: number): string => {
    let d0: Date;
    if (c.travelDate) {
      d0 = new Date(c.travelDate + 'T00:00:00');
      if (isNaN(d0.getTime())) {
        d0 = new Date();
      }
    } else {
      d0 = new Date();
    }
    d0.setDate(d0.getDate() + (nightNumber - 1));
    return d0.toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleDownloadPDF = () => {
    try {
      if (showToast) showToast('Preparing your quotation PDF...');
      const logoObj = data.logoUrl
        ? { data: data.logoUrl, w: 200, h: 80 }
        : null;

      const exportData: QuoteExportData = {
        customer: data.customer,
        pax: data.pax,
        nights: data.nights,
        transport: data.transport,
        guide: data.guide,
        pricing: data.pricing,
        others: data.others,
        terms: data.terms,
        pricingBreakdown: data.breakdown,
        company: data.company,
        logo: logoObj
      };

      const blob = generateQuotationPDF(exportData);
      const filename = `Voya_Lanka_Quotation_${data.customer.qno || data.id}.pdf`;
      downloadBlob(blob, filename);
      if (showToast) showToast('Quotation PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF download error:', err);
      if (showToast) showToast('Could not generate PDF. Please try again.');
    }
  };

  const handleContactWhatsApp = () => {
    const agentPhone = cleanWhatsAppPhone(comp.phone || '+94770216300');
    const msg = encodeURIComponent(
      `Hello Voya Lanka Tours! 🌴\nI have reviewed my online tour proposal (Ref: ${c.qno || data.id}) for ${c.custName || 'our trip'} (${p.days} Days).\nI would like to proceed with the booking!`
    );
    window.open(`https://wa.me/${agentPhone}?text=${msg}`, '_blank');
  };

  // Parse inclusions and exclusions into bullet arrays
  const rawInclusions = (data.terms.incl || '')
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);

  const shownTickets = (data.others || []).filter(o => o.showInQuotation !== false);
  const ticketInclusions = shownTickets.map(t => {
    const rate = data.pricing.usdRate || 305;
    const unitUsd =
      t.unitPriceUsd !== undefined
        ? t.unitPriceUsd
        : t.unitPrice
        ? Math.round((t.unitPrice / rate) * 100) / 100
        : Math.round((t.cost / rate) * 100) / 100;
    const totalUsd = Math.round(unitUsd * (t.qty ?? 1));
    const qtyStr = t.qty && t.qty > 1 ? ` (${t.qty} Tickets)` : '';
    const priceStr = t.showPriceInQuotation !== false ? ` — $${totalUsd} USD` : '';
    return `${t.name}${qtyStr}${priceStr}`;
  });

  const inclusionsList = [...rawInclusions, ...ticketInclusions];

  const exclusionsList = (data.terms.excl || '')
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);

  const termsList = (data.terms.terms || '')
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-white pb-20">
      {/* Top Client Bar */}
      <nav className="bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {onBackToEditor && (
              <button
                onClick={onBackToEditor}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                title="Return to Quotation Generator"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Editor Workspace</span>
              </button>
            )}
            <div className="flex items-center gap-2.5">
              {data.logoUrl ? (
                <img
                  src={data.logoUrl}
                  alt="Voya Lanka Tours (Pvt) Ltd."
                  className="h-11 w-auto max-w-[140px] object-contain rounded bg-white p-1 -mt-0.5 shadow-sm"
                />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-sky-600 to-teal-500 flex items-center justify-center text-white -mt-0.5">
                  <Plane className="w-4 h-4 -rotate-45" />
                </div>
              )}
              <div>
                <span className="text-xs sm:text-sm font-bold text-slate-100 block leading-tight">
                  Voya Lanka Tours (Pvt) Ltd.
                </span>
                <span className="text-[9px] text-amber-400 italic font-medium uppercase tracking-wider block mt-0.5 leading-tight">
                  MORE THAN A DESTINATION
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleContactWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chat on WhatsApp</span>
              <span className="sm:hidden">WhatsApp</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-700 hover:bg-sky-600 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Download PDF</span>
            </button>

            <button
              onClick={() => window.print()}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
              title="Print Proposal"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 space-y-8">
        {/* Hero Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-sky-950/70 to-slate-900 border border-slate-800 p-6 sm:p-10 shadow-2xl">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-96 h-96 rounded-full bg-sky-600/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 space-y-4 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-950/80 border border-sky-800/80 text-sky-300 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Bespoke Travel Proposal &bull; Ref: {c.qno || data.id}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              {c.custName ? `Exclusive Journey for ${c.custName}` : 'Exclusive Sri Lanka Discovery'}
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              {data.itinerary?.greeting ||
                'We are delighted to present your personalized Sri Lanka tour itinerary, meticulously crafted for an unforgettable travel experience filled with tropical beauty, heritage, and luxury.'}
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                <span>{travelDateFormatted}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  {p.days} Days / {totalNights} Nights
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
                <Users className="w-3.5 h-3.5 text-teal-400" />
                <span>
                  {p.adults} Adults{p.child12 > 0 ? `, ${p.child12} Children` : ''} ({totalPax} Travelers)
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing & Key Investment Highlights (Exchange rate omitted; Numbering & Wording included) */}
        {(() => {
          const showUsd = data.pricing.showUsd !== false;
          const showLkr = data.pricing.showLkr !== false;

          return (
            <section className={`grid grid-cols-1 ${p.isGroup ? 'md:grid-cols-2' : 'md:grid-cols-3'} gap-4`}>
              {!p.isGroup && (
                <div className="bg-slate-900/90 border border-teal-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-teal-400 mb-1 flex items-center gap-1.5">
                      <span>Total Package Investment</span>
                    </div>
                    {showUsd && (
                      <div className="text-3xl font-black text-teal-300 tabular-nums">
                        {formatUSD(b.usd)}
                      </div>
                    )}
                    {showLkr && (
                      <div className="text-xl font-bold text-slate-100 mt-1 tabular-nums">
                        {formatLKR(b.fin)}
                      </div>
                    )}
                  </div>
                  <div className="pt-3 border-t border-slate-800/80 mt-2">
                    <span className="text-[10px] uppercase font-bold text-amber-400 block mb-0.5">
                      Amount in Words:
                    </span>
                    <p className="text-xs text-slate-300 leading-tight">
                      {showUsd && numberToWords(b.usd, 'USD')}
                      {showUsd && showLkr && <br />}
                      {showLkr && numberToWords(b.fin, 'LKR')}
                    </p>
                  </div>
                </div>
              )}

              <div className="bg-slate-900/90 border border-amber-500/30 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400 mb-1">
                    {p.isGroup ? `Group Tour Rate (${totalPax} Pax)` : `Per Person Rate (${totalPax} Pax)`}
                  </div>
                  {showUsd && (
                    <div className="text-3xl font-black text-amber-300 tabular-nums">
                      {formatUSD(b.ppUSD)}
                    </div>
                  )}
                  {showLkr && (
                    <div className="text-lg font-bold text-sky-300 mt-0.5 tabular-nums">
                      {formatLKR(b.ppLKR)} <span className="text-xs font-normal text-slate-400">/ person</span>
                    </div>
                  )}
                </div>
                <div className="pt-3 border-t border-slate-800/80 mt-2">
                  <span className="text-[10px] uppercase font-bold text-amber-400 block mb-0.5">
                    {p.isGroup ? 'Rate in Words:' : 'Per-Person Wording:'}
                  </span>
                  <p className="text-xs text-slate-300 leading-tight">
                    {showUsd && `${numberToWords(b.ppUSD, 'USD')} per person`}
                    {showUsd && showLkr && <br />}
                    {showLkr && `${numberToWords(b.ppLKR, 'LKR')} per person`}
                  </p>
                </div>
              </div>

              <div className="bg-slate-900/90 border border-sky-500/30 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-sky-400 mb-1">
                    Vehicle &amp; Chauffeur Service
                  </div>
                  <div className="text-base font-bold text-slate-100">
                    {data.transport.vehicleType || 'Private Air-Conditioned Vehicle'}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {data.guide.guideType || 'English-Speaking Private Chauffeur Guide'} &bull; Passenger insurance &amp; tolls included.
                  </p>
                </div>
                <button
                  onClick={handleContactWhatsApp}
                  className="mt-3 w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Confirm via WhatsApp</span>
                </button>
              </div>
            </section>
          );
        })()}

        {/* Day-by-Day Detailed Itinerary */}
        {data.itinerary && data.itinerary.days && data.itinerary.days.length > 0 && (
          <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-100">
                    Day-by-Day Travel Itinerary
                  </h2>
                  <p className="text-xs text-slate-400">
                    Your complete route, sightseeing excursions, and overnight stays
                  </p>
                </div>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sky-950 border border-sky-800/80 text-sky-300">
                {data.itinerary.days.length} Days
              </span>
            </div>

            <div className="space-y-6 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
              {data.itinerary.days.map((day, idx) => {
                const dayNum = idx + 1;
                return (
                  <div key={idx} className="relative flex items-start gap-4 group">
                    <div className="w-7 h-7 rounded-full bg-slate-900 border-2 border-sky-500 flex items-center justify-center text-[11px] font-bold text-sky-400 shrink-0 z-10 group-hover:bg-sky-500 group-hover:text-white transition-colors">
                      {dayNum}
                    </div>

                    <div className="flex-1 bg-slate-950/80 border border-slate-800 group-hover:border-slate-700/80 rounded-xl p-4 transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-2">
                        <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                          <span>Day {dayNum}:</span>
                          <span className="text-sky-300">{day.title}</span>
                        </h3>
                        {day.stay && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400 bg-amber-950/40 border border-amber-900/60 px-2 py-0.5 rounded-md">
                            <Hotel className="w-3 h-3" />
                            <span>Overnight: {day.stay}</span>
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                        {day.acts}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Accommodation Stays Showcase */}
        {data.nights && data.nights.length > 0 && (
          <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-4">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Hotel className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">
                  Accommodations &amp; Meal Plans
                </h2>
                <p className="text-xs text-slate-400">
                  Handpicked trusted partner hotels booked for your journey
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {data.nights.map((n, idx) => {
                const room = n.rooms[0] || {
                  hotel: 'Selected Hotel',
                  category: '4-Star Premium',
                  meal: 'Half Board',
                  roomCategory: 'Deluxe Room',
                  bedType: 'Double Bed'
                };

                return (
                  <div
                    key={idx}
                    className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-xl p-4 space-y-2.5 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-sky-400 flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-sky-400" />
                        {getNightDate(n.nightNumber)}
                      </span>
                      <span className="text-amber-400 font-semibold flex items-center gap-0.5">
                        <Star className="w-3 h-3 fill-amber-400/20" />
                        {room.category}
                      </span>
                    </div>

                    <div className="font-bold text-sm text-slate-100 truncate">
                      {room.hotel || 'Hotel to be confirmed'}
                    </div>

                    <div className="space-y-1 text-xs text-slate-400 pt-1 border-t border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <span>Room Type:</span>
                        <strong className="text-slate-300 font-medium">
                          {room.roomCategory || 'Standard'} ({room.bedType || 'Double'})
                        </strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Meal Plan:</span>
                        <span className="text-emerald-400 font-semibold flex items-center gap-1">
                          <Utensils className="w-3 h-3" />
                          {room.meal || 'Half Board'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Inclusions & Exclusions */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Inclusions */}
          <div className="bg-slate-900/80 border border-emerald-900/40 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm border-b border-slate-800 pb-3">
              <CheckCircle2 className="w-4 h-4" />
              <span>What&apos;s Included In This Package</span>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-300">
              {inclusionsList.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Exclusions */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-slate-400 font-bold text-sm border-b border-slate-800 pb-3">
              <XCircle className="w-4 h-4 text-rose-400" />
              <span>Exclusions &amp; Direct Expenses</span>
            </div>
            <ul className="space-y-2.5 text-xs text-slate-400">
              {exclusionsList.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Terms & Conditions */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-slate-200 font-bold text-sm border-b border-slate-800 pb-3">
            <ShieldCheck className="w-4 h-4 text-sky-400" />
            <span>Booking Conditions &amp; Payment Terms</span>
          </div>
          <ul className="space-y-2 text-xs text-slate-400 list-disc list-inside">
            {termsList.map((t, idx) => (
              <li key={idx}>{t}</li>
            ))}
          </ul>
        </section>

        {/* Agency Footer Card */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 text-center sm:text-left">
          <div className="space-y-1.5">
            <h4 className="text-base font-bold text-slate-100">
              {LEGAL_NAME}
            </h4>
            <p className="text-xs text-slate-400 max-w-md">{comp.address}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 pt-1 text-xs text-slate-300">
              <span className="flex items-center gap-1 text-sky-400">
                <Phone className="w-3.5 h-3.5" />
                {comp.phone}
              </span>
              <span className="flex items-center gap-1 text-sky-400">
                <Mail className="w-3.5 h-3.5" />
                {comp.email}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
            <button
              onClick={handleContactWhatsApp}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg transition-colors cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Confirm &amp; Message on WhatsApp</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center gap-2 border border-slate-700 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};
