import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  CompanyDetails,
  CustomerDetails,
  GuideDetails,
  ItineraryData,
  LEGAL_NAME,
  LogoData,
  NightConfig,
  OtherCharge,
  PaxDetails,
  PricingBreakdown,
  PricingConfig,
  TermsConfig,
  TransportDetails
} from '../types';
import {
  formatLKR,
  formatNumber,
  formatUSD,
  getTemplateVariables,
  numberToWords,
  PAYMENT_SCHEDULE_TEMPLATE,
  replaceTemplateVars
} from './calc';

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 200);
}

export interface QuoteExportData {
  customer: CustomerDetails;
  pax: PaxDetails;
  nights: NightConfig[];
  transport: TransportDetails;
  guide: GuideDetails;
  pricing: PricingConfig;
  others: OtherCharge[];
  terms: TermsConfig;
  pricingBreakdown: PricingBreakdown;
  company: CompanyDetails;
  logo: LogoData | null;
}

export function generateQuotationPDF(data: QuoteExportData): Blob {
  const {
    customer,
    pax,
    nights,
    transport,
    guide,
    pricing,
    others,
    terms,
    pricingBreakdown,
    company,
    logo
  } = data;

  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const m = 36;
  const CW = W - 2 * m;

  let y = 30;
  let tx = m;

  // Logo - increased size and lifted up
  if (logo && logo.data) {
    try {
      const lh = 58;
      const lw = Math.min(165, (logo.w * lh) / logo.h);
      const actualH = (lw * logo.h) / logo.w;
      doc.addImage(logo.data, logo.data.startsWith('data:image/png') ? 'PNG' : 'JPEG', m, y - 14, lw, actualH);
      tx = m + lw + 14;
    } catch (e) {
      console.warn('Could not add logo to PDF:', e);
    }
  }

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(3, 67, 90);
  doc.text('VOYA LANKA TOURS (PVT) LTD.', tx, y + 10);

  // Tagline - reduced size and italic font
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(139, 111, 71);
  doc.text('MORE THAN A DESTINATION', tx, y + 23);

  // Quote ID & Date
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(2, 132, 199);
  doc.text(customer.qno || 'QUOTATION', W - m, y + 8, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const todayStr = new Date().toISOString().slice(0, 10);
  doc.text('Date: ' + todayStr, W - m, y + 22, { align: 'right' });

  // Divider line
  doc.setDrawColor(2, 132, 199);
  doc.setLineWidth(1.2);
  doc.line(m, y + 48, W - m, y + 48);

  // Big QUOTATION title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text('QUOTATION', W / 2, y + 66, { align: 'center' });

  // Company, Customer & Travel Info
  const coLines = [
    company.name || 'Voya Lanka Tours (Pvt) Ltd.',
    company.address,
    company.phone && 'Tel: ' + company.phone,
    company.email && 'Email: ' + company.email,
    company.website && 'Web: ' + company.website,
    company.reg && 'Reg. No: ' + company.reg
  ].filter(Boolean);

  const hasCo = coLines.length > 1;

  const custText =
    `Name: ${customer.custName || 'Valued Guest'}\n` +
    `Email: ${customer.custEmail || 'N/A'}\n` +
    `Phone / WhatsApp: ${customer.custPhone || 'N/A'}\n` +
    `Country: ${customer.custCountry || 'N/A'}`;

  const travText =
    `Arrival Date: ${customer.travelDate || 'Flexible'}\n` +
    `Special Remarks: ${customer.custNotes || 'None'}`;

  const headCols = hasCo
    ? ['COMPANY DETAILS', 'CUSTOMER DETAILS', 'TRAVEL INFO']
    : ['CUSTOMER DETAILS', 'TRAVEL INFO'];

  const bodyRow = hasCo
    ? [coLines.join('\n'), custText, travText]
    : [custText, travText];

  autoTable(doc, {
    startY: y + 76,
    margin: { left: m, right: m },
    head: [headCols],
    body: [bodyRow],
    headStyles: { fillColor: [3, 105, 161], textColor: 255, fontSize: 8, cellPadding: 3.5 },
    styles: { fontSize: 7.5, cellPadding: 4, textColor: [15, 23, 42], lineColor: [203, 213, 225], lineWidth: 0.5 }
  });

  let cy = (doc as any).lastAutoTable.finalY + 10;

  // Tour Details Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(2, 132, 199);
  doc.text('TOUR DETAILS', m, cy);

  const days = Math.max(1, pax.days || 1);
  const nightsCount = Math.max(0, days - 1);
  const totalPax = Math.max(1, (pax.adults || 0) + (pax.child12 || 0) + (pax.child5 || 0));
  const ch = (pax.child12 || 0) + (pax.child5 || 0);
  const guestsStr = `${pax.adults || 0} Adult${pax.adults === 1 ? '' : 's'}${ch > 0 ? ` + ${ch} Child${ch === 1 ? '' : 'ren'}` : ''}`;

  // Build accommodation room summary
  const firstNight = nights[0];
  let accSummary = 'N/A';
  if (firstNight && firstNight.rooms.length > 0) {
    const counts: Record<string, number> = {};
    firstNight.rooms.forEach(r => {
      counts[r.bedType] = (counts[r.bedType] || 0) + 1;
    });
    accSummary = `${firstNight.rooms.length} Room${firstNight.rooms.length === 1 ? '' : 's'}: ` +
      Object.entries(counts).map(([b, n]) => `${n} ${b}`).join(' + ');
  }

  const allHotels = Array.from(new Set(nights.slice(0, nightsCount).flatMap(n => n.rooms.map(r => r.category)))).join(' / ') || 'Selected Hotels';
  const allMeals = Array.from(new Set(nights.slice(0, nightsCount).flatMap(n => n.rooms.map(r => r.meal)))).join(' / ') || 'Half-Board';

  const tourSummaryRows: [string, string][] = [
    ['Guests', guestsStr],
    ['Duration', `${days} Days / ${nightsCount} Nights`]
  ];

  if (nightsCount > 0) {
    tourSummaryRows.push(['Accommodation', accSummary]);
    tourSummaryRows.push(['Hotels & Meals', `${allHotels} | ${allMeals}`]);
  }
  tourSummaryRows.push(['Transportation', `Private ${transport.vehicleType} for ${days} Days`]);
  tourSummaryRows.push(['Guide', guide.guideType]);

  const shownTickets = (others || []).filter(o => o.showInQuotation !== false);
  if (shownTickets.length > 0) {
    const rate = pricing.usdRate || 305;
    const tktList = shownTickets
      .map(t => {
        const qtyStr = t.qty && t.qty > 1 ? ` (${t.qty}x)` : '';
        if (t.showPriceInQuotation !== false) {
          const unitUsd =
            t.unitPriceUsd !== undefined
              ? t.unitPriceUsd
              : t.unitPrice
              ? Math.round((t.unitPrice / rate) * 100) / 100
              : Math.round((t.cost / rate) * 100) / 100;
          const totalUsd = Math.round(unitUsd * (t.qty ?? 1));
          return `${t.name}${qtyStr} — $${totalUsd} USD`;
        }
        return `${t.name}${qtyStr}`;
      })
      .join('\n');
    tourSummaryRows.push(['Included Tickets & Activities', tktList]);
  }

  autoTable(doc, {
    startY: cy + 4,
    margin: { left: m, right: m },
    body: tourSummaryRows,
    styles: { fontSize: 7.5, cellPadding: 3, textColor: [15, 23, 42], lineColor: [203, 213, 225], lineWidth: 0.5 },
    columnStyles: { 0: { fillColor: [214, 230, 244], textColor: [10, 50, 100], fontStyle: 'bold', cellWidth: 120 } }
  });

  cy = (doc as any).lastAutoTable.finalY + 10;

  // Price Card Box (Exchange rate is omitted from quotation output as requested)
  const showUsd = pricing.showUsd !== false;
  const showLkr = pricing.showLkr !== false;

  if (pax.isGroup) {
    // Group Tour: Display ONLY per-person rate in quotation (Numbering & Wording)!
    const bh = 68;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(2, 132, 199);
    doc.setLineWidth(1.2);
    doc.rect(m, cy, CW, bh, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(2, 132, 199);
    doc.text(`GROUP TOUR PACKAGE — RATE PER PERSON (${pricingBreakdown.pax} PAX)`, m + 10, cy + 15);

    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    const numDisplay = showUsd && showLkr
      ? `${formatUSD(pricingBreakdown.ppUSD)}   /   ${formatLKR(pricingBreakdown.ppLKR)} per person`
      : showUsd
      ? `${formatUSD(pricingBreakdown.ppUSD)} per person`
      : `${formatLKR(pricingBreakdown.ppLKR)} per person`;
    doc.text(numDisplay, m + 10, cy + 31);

    // Rate in words
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    const groupWords: string[] = [];
    if (showUsd) groupWords.push(`USD: ${numberToWords(pricingBreakdown.ppUSD, 'USD')}`);
    if (showLkr) groupWords.push(`LKR: ${numberToWords(pricingBreakdown.ppLKR, 'LKR')}`);
    doc.text(`Rate in Words: ${groupWords.join('  |  ')}`, m + 10, cy + 44);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Rate is quoted per person based on group size, inclusive of private transport, hotel accommodations, guide services, and all itinerary inclusions.',
      m + 10,
      cy + 56
    );

    cy += bh + 12;
  } else {
    // Standard Quotation Card (No exchange rate displayed; Numbering & Wording included)
    const bh = 80;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(15, 23, 42);
    doc.setLineWidth(0.8);
    doc.rect(m, cy, CW, bh, 'FD');

    // "TOTAL PACKAGE PRICE" font size matches the total amount size
    const titleSize = showLkr && showUsd ? 13 : 14.5;
    const titleY = pricingBreakdown.dAmt > 0 ? cy + 17 : (showLkr && showUsd ? cy + 22 : cy + 26);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(titleSize);
    doc.setTextColor(15, 23, 42);
    doc.text('TOTAL PACKAGE PRICE', m + 8, titleY);

    if (pricingBreakdown.dAmt > 0) {
      const discLabel = pricing.discType === 'pct'
        ? `${pricing.discVal}%`
        : pricing.discType === 'usd'
        ? `USD ${pricing.discVal}`
        : `LKR ${pricing.discVal}`;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      const preDiscStr = showUsd && showLkr
        ? `${formatLKR(pricingBreakdown.pre)} / ${formatUSD(pricingBreakdown.pre / (pricing.usdRate || 305))}`
        : showUsd
        ? formatUSD(pricingBreakdown.pre / (pricing.usdRate || 305))
        : formatLKR(pricingBreakdown.pre);
      doc.text(`Price before discount: ${preDiscStr}`, m + 8, cy + 25);
      doc.setTextColor(5, 150, 105);
      doc.text(`Discount (${discLabel}): Applied`, m + 8, cy + 35);
    }

    // Total package amount stays on the RIGHT side
    doc.setFont('helvetica', 'bold');
    if (showLkr && showUsd) {
      doc.setFontSize(13);
      doc.setTextColor(15, 23, 42);
      doc.text(formatLKR(pricingBreakdown.fin), W - m - 8, cy + 22, { align: 'right' });

      doc.setFontSize(10.5);
      doc.setTextColor(2, 132, 199);
      doc.text(formatUSD(pricingBreakdown.usd), W - m - 8, cy + 35, { align: 'right' });
    } else if (showUsd) {
      doc.setFontSize(14.5);
      doc.setTextColor(2, 132, 199);
      doc.text(formatUSD(pricingBreakdown.usd), W - m - 8, cy + 26, { align: 'right' });
    } else {
      doc.setFontSize(14.5);
      doc.setTextColor(15, 23, 42);
      doc.text(formatLKR(pricingBreakdown.fin), W - m - 8, cy + 26, { align: 'right' });
    }

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(m + 8, cy + 44, W - m - 8, cy + 44);

    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text(`PER PERSON PACKAGE COST (${pricingBreakdown.pax} pax)`, m + 8, cy + 54);

    doc.setTextColor(2, 132, 199);
    const ppText = showUsd && showLkr
      ? `${formatLKR(pricingBreakdown.ppLKR)}   |   ${formatUSD(pricingBreakdown.ppUSD)}`
      : showUsd
      ? `${formatUSD(pricingBreakdown.ppUSD)} / person`
      : `${formatLKR(pricingBreakdown.ppLKR)} / person`;
    doc.text(ppText, W - m - 8, cy + 54, { align: 'right' });

    // Total Rate in Words (both numbering and wording)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(15, 23, 42);
    const wordsList: string[] = [];
    if (showUsd) wordsList.push(`USD: ${numberToWords(pricingBreakdown.usd, 'USD')}`);
    if (showLkr) wordsList.push(`LKR: ${numberToWords(pricingBreakdown.fin, 'LKR')}`);
    const wordsFull = doc.splitTextToSize(`Amount in Words: ${wordsList.join('  |  ')}`, CW - 16);
    doc.text(wordsFull, m + 8, cy + 68);

    cy += bh + 12;
  }

  // Payment Schedule
  const templateVars = getTemplateVariables(
    customer,
    pax,
    nights,
    transport,
    guide,
    pricing,
    terms,
    pricingBreakdown
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  const payL = doc.splitTextToSize(replaceTemplateVars(PAYMENT_SCHEDULE_TEMPLATE, templateVars), CW);
  doc.text(payL, m, cy);
  cy += payL.length * 10 + 6;

  // Inclusions & Exclusions
  const parseLines = (text: string) =>
    text
      .split('\n')
      .map(x => x.trim())
      .filter(x => x && !(nightsCount === 0 && x.includes('{nights}')))
      .map(x => replaceTemplateVars(x, templateVars));

  const inclLines = parseLines(terms.incl);
  const exclLines = parseLines(terms.excl);
  const incExclRows: [string, string][] = [];
  const maxLines = Math.max(inclLines.length, exclLines.length);
  for (let i = 0; i < maxLines; i++) {
    incExclRows.push([
      inclLines[i] ? `\u2022 ${inclLines[i]}` : '',
      exclLines[i] ? `\u2022 ${exclLines[i]}` : ''
    ]);
  }

  doc.setFontSize(9.5);
  doc.setTextColor(2, 132, 199);
  doc.text('PACKAGE INCLUSIONS & EXCLUSIONS', m, cy);

  autoTable(doc, {
    startY: cy + 4,
    margin: { left: m, right: m },
    head: [['INCLUSIONS', 'EXCLUSIONS']],
    headStyles: { fillColor: [3, 105, 161], textColor: 255, fontSize: 8, cellPadding: 3 },
    styles: { fontSize: 7, cellPadding: 2.5, textColor: [15, 23, 42], lineColor: [203, 213, 225], lineWidth: 0.5 },
    body: incExclRows,
    columnStyles: { 0: { cellWidth: CW / 2 }, 1: { cellWidth: CW / 2 } }
  });

  cy = (doc as any).lastAutoTable.finalY + 12;

  // Terms & Conditions
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(2, 132, 199);
  doc.text('TERMS & CONDITIONS', m, cy);
  cy += 11;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  const termLines = parseLines(terms.terms);
  termLines.forEach(t => {
    const l = doc.splitTextToSize(`\u2022 ${t}`, CW - 8);
    doc.text(l, m, cy);
    cy += l.length * 9.5 + 2;
  });

  cy += 6;
  const thankMsg = doc.splitTextToSize(replaceTemplateVars(terms.thanks, templateVars), CW);
  doc.setFont('helvetica', 'bolditalic');
  doc.setFontSize(8.5);
  doc.setTextColor(2, 132, 199);
  doc.text(thankMsg, W / 2, cy, { align: 'center' });
  cy += thankMsg.length * 10;

  // Watermark and footers
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);

    // 1. Company logo watermark in the middle of the quotation page
    if (logo && logo.data) {
      try {
        doc.saveGraphicsState();
        const GState = (doc as any).GState;
        if (GState) {
          doc.setGState(new GState({ opacity: 0.08 }));
        }
        const maxW = 320;
        const maxH = 320;
        const scale = Math.min(maxW / (logo.w || 200), maxH / (logo.h || 200));
        const ww = (logo.w || 200) * scale;
        const wh = (logo.h || 200) * scale;
        const wx = (W - ww) / 2;
        const wy = (H - wh) / 2;
        doc.addImage(
          logo.data,
          logo.data.startsWith('data:image/png') ? 'PNG' : 'JPEG',
          wx,
          wy,
          ww,
          wh
        );
        doc.restoreGraphicsState();
      } catch (err) {
        console.warn('Could not draw logo watermark:', err);
      }
    } else {
      // Subtle typographic watermark if no custom logo uploaded
      try {
        doc.saveGraphicsState();
        const GState = (doc as any).GState;
        if (GState) {
          doc.setGState(new GState({ opacity: 0.05 }));
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(28);
        doc.setTextColor(3, 105, 161);
        doc.text('VOYA LANKA TOURS (PVT) LTD.', W / 2, H / 2, {
          align: 'center',
          angle: 30
        });
        doc.restoreGraphicsState();
      } catch (e) {}
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);

    if (hasCo) {
      const footLine = doc.splitTextToSize(coLines.slice(1).join('  |  '), CW);
      doc.text(footLine, W / 2, H - 20, { align: 'center' });
    }
    if (pageCount > 1) {
      doc.text(`Page ${p} of ${pageCount}`, W - m, H - 20, { align: 'right' });
    }
  }

  return doc.output('blob');
}

export interface VoucherNightData {
  nightNumber: number;
  rooms: NightConfig['rooms'];
}

export function generateVoucherPDF(
  hotelName: string,
  nightsIncluded: VoucherNightData[],
  totalNights: number,
  customer: CustomerDetails,
  pax: PaxDetails,
  company: CompanyDetails,
  confirmedBy: string,
  logo: LogoData | null,
  usdRate: number = 305
): Blob {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const m = 40;
  const CW = W - 2 * m;
  let y = 40;
  let tx = m;

  if (logo && logo.data) {
    try {
      const lh = 54;
      const lw = Math.min(130, (logo.w * lh) / logo.h);
      const actualH = (lw * logo.h) / logo.w;
      // Logo moved a bit top (from y - 20 to y - 26) as requested
      doc.addImage(logo.data, logo.data.startsWith('data:image/png') ? 'PNG' : 'JPEG', m, y - 26, lw, actualH);
      // Voya Lanka name moved little left (from m + lw + 14 to m + lw + 4)
      tx = m + lw + 4;
    } catch (e) {
      console.warn('Voucher logo error:', e);
    }
  }

  const sortedNights = [...nightsIncluded].sort((a, b) => a.nightNumber - b.nightNumber);
  const nightNums = sortedNights.map(n => n.nightNumber);
  const isMultiNight = nightNums.length > 1;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15.5);
  doc.setTextColor(3, 67, 90);
  doc.text('VOYA LANKA TOURS (PVT) LTD.', tx, y);

  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(139, 111, 71);
  doc.text('MORE THAN A DESTINATION', tx, y + 14);

  const voucherNumStr = `Voucher No: ${customer.qno || 'QT'}-N${nightNums.join('-')}`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(2, 132, 199);
  doc.text(voucherNumStr, W - m, y - 4, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Issued: ' + new Date().toISOString().slice(0, 10), W - m, y + 10, { align: 'right' });

  // Blue line moved little down (from y + 26 to y + 36)
  doc.setDrawColor(2, 132, 199);
  doc.setLineWidth(1.2);
  doc.line(m, y + 36, W - m, y + 36);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text('ROOM VOUCHER', W / 2, y + 58, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);

  const getNightFormattedDate = (num: number) => {
    let d: Date;
    if (customer.travelDate) {
      d = new Date(customer.travelDate + 'T00:00:00');
      if (isNaN(d.getTime())) d = new Date();
    } else {
      d = new Date();
    }
    d.setDate(d.getDate() + (num - 1));
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const nightSubtitle = isMultiNight
    ? `Consolidated Voucher \u2022 ${getNightFormattedDate(nightNums[0])} to ${getNightFormattedDate(nightNums[nightNums.length - 1])} (${nightNums.length} Nights at ${hotelName})`
    : `${getNightFormattedDate(nightNums[0])} \u2022 ${hotelName}`;
  doc.text(nightSubtitle, W / 2, y + 74, { align: 'center' });

  const fmtDate = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

  let checkIn = 'As per itinerary';
  let checkOut = 'As per itinerary';
  if (customer.travelDate) {
    const d0 = new Date(customer.travelDate + 'T00:00:00');
    if (!isNaN(d0.getTime())) {
      const minNight = Math.min(...nightNums);
      const maxNight = Math.max(...nightNums);
      const a = new Date(d0);
      a.setDate(a.getDate() + (minNight - 1));
      const b = new Date(d0);
      b.setDate(b.getDate() + maxNight);
      checkIn = fmtDate(a);
      checkOut = fmtDate(b);
    }
  }

  const ad = pax.adults || 0;
  const ch = (pax.child12 || 0) + (pax.child5 || 0);
  const guestsStr = `${ad} Adult${ad === 1 ? '' : 's'}${ch > 0 ? ` + ${ch} Child${ch === 1 ? '' : 'ren'}` : ''}`;

  const infoRows = [
    ['Hotel Name', hotelName],
    ['Stay Duration', `${nightNums.length} Night${nightNums.length > 1 ? 's' : ''}`],
    ['Guest Name', customer.custName || 'Valued Guest'],
    ['Country', customer.custCountry || '-'],
    ['Guests', guestsStr],
    ['Check-in Date', checkIn],
    ['Check-out Date', checkOut],
    ['Special Requests', customer.custNotes || 'None']
  ];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(2, 132, 199);
  doc.text('GUEST & STAY DETAILS', m, y + 94);

  autoTable(doc, {
    startY: y + 100,
    margin: { left: m, right: m },
    body: infoRows,
    styles: { fontSize: 8.5, cellPadding: 4, textColor: [15, 23, 42], lineColor: [203, 213, 225], lineWidth: 0.5 },
    columnStyles: { 0: { fillColor: [214, 230, 244], textColor: [10, 50, 100], fontStyle: 'bold', cellWidth: 130 } }
  });

  const getStayDate = (nightNumber: number): string => {
    let d: Date;
    if (customer.travelDate) {
      d = new Date(customer.travelDate + 'T00:00:00');
      if (isNaN(d.getTime())) d = new Date();
    } else {
      d = new Date();
    }
    d.setDate(d.getDate() + (nightNumber - 1));
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  // Build room table rows across all included nights (in USD)
  const roomTableRows: string[][] = [];
  let stayTotalUsd = 0;

  sortedNights.forEach(nightData => {
    const dateLabel = getStayDate(nightData.nightNumber);
    nightData.rooms.forEach((r, rIdx) => {
      const costUsd =
        r.costUsd !== undefined
          ? r.costUsd
          : Math.round(((Number(r.cost) || 0) / (usdRate || 305)) * 100) / 100;
      stayTotalUsd += costUsd;
      const stayColLabel = nightData.rooms.length > 1
        ? `${dateLabel} (Room ${rIdx + 1})`
        : dateLabel;

      roomTableRows.push([
        stayColLabel,
        r.hotel,
        `${r.roomCategory}\n${r.roomView}`,
        r.bedType,
        r.meal,
        `$ ${costUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      ]);
    });
  });

  let cy = (doc as any).lastAutoTable.finalY + 18;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(2, 132, 199);
  doc.text('ROOM CONFIGURATION & ALLOCATION', m, cy);

  autoTable(doc, {
    startY: cy + 6,
    margin: { left: m, right: m },
    head: [['Stay Date', 'Hotel', 'Room Category & View', 'Bed / Occupancy', 'Meal Plan', 'Room Rate / Night (USD)']],
    body: roomTableRows,
    foot: [['', '', '', '', 'Total Stay Cost (USD)', `$ ${stayTotalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`]],
    showFoot: 'lastPage',
    headStyles: { fillColor: [3, 105, 161], textColor: 255, fontSize: 8.5, cellPadding: 4.5 },
    footStyles: { fillColor: [214, 230, 244], textColor: [10, 50, 100], fontStyle: 'bold', fontSize: 8.5, cellPadding: 4.5 },
    styles: { fontSize: 8.5, cellPadding: 4, textColor: [15, 23, 42], lineColor: [203, 213, 225], lineWidth: 0.5 },
    columnStyles: { 5: { halign: 'right', cellWidth: 95 } }
  });

  cy = (doc as any).lastAutoTable.finalY + 20;

  // Room confirmed by card
  doc.setFillColor(240, 249, 255);
  doc.setDrawColor(2, 132, 199);
  doc.setLineWidth(1);
  doc.rect(m, cy, CW, 70, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text('ROOM CONFIRMED BY', m + 14, cy + 18);

  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(confirmedBy, m + 14, cy + 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Confirmation date: ' + fmtDate(new Date()), m + 14, cy + 54);

  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.6);
  doc.line(W - m - 170, cy + 46, W - m - 14, cy + 46);
  doc.text('Authorised signature', W - m - 92, cy + 58, { align: 'center' });

  cy += 70 + 16;
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  const note = doc.splitTextToSize(
    'This voucher confirms the room arrangement above for the stated stay. Please present this document upon hotel check-in. Standard hotel policies, check-in, and check-out regulations apply.',
    CW
  );
  doc.text(note, m, cy);

  // Footer & Watermark on voucher
  const cl = [
    company.address,
    company.phone && 'Tel: ' + company.phone,
    company.email && 'Email: ' + company.email,
    company.website && 'Web: ' + company.website,
    company.reg && 'Reg. No: ' + company.reg
  ].filter(Boolean);

  const voucherPages = doc.getNumberOfPages();
  for (let vp = 1; vp <= voucherPages; vp++) {
    doc.setPage(vp);

    if (logo && logo.data) {
      try {
        doc.saveGraphicsState();
        const GState = (doc as any).GState;
        if (GState) {
          doc.setGState(new GState({ opacity: 0.07 }));
        }
        const maxW = 280;
        const maxH = 280;
        const scale = Math.min(maxW / (logo.w || 200), maxH / (logo.h || 200));
        const ww = (logo.w || 200) * scale;
        const wh = (logo.h || 200) * scale;
        doc.addImage(
          logo.data,
          logo.data.startsWith('data:image/png') ? 'PNG' : 'JPEG',
          (W - ww) / 2,
          (H - wh) / 2,
          ww,
          wh
        );
        doc.restoreGraphicsState();
      } catch (e) {}
    }

    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    if (cl.length) {
      doc.text(cl.join('  |  '), W / 2, H - 20, { align: 'center', maxWidth: CW });
    }
  }

  return doc.output('blob');
}

export function generateItineraryPDF(
  itinerary: ItineraryData,
  data: QuoteExportData
): Blob {
  const { customer, pax, nights, company, logo } = data;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const m = 36;
  const CW = W - 2 * m;

  let y = 24;
  let tx = m;

  if (logo && logo.data) {
    try {
      const lh = 58;
      const lw = Math.min(165, (logo.w * lh) / logo.h);
      const h2 = (lw * logo.h) / logo.w;
      doc.addImage(logo.data, logo.data.startsWith('data:image/png') ? 'PNG' : 'JPEG', m, y - 10, lw, h2);
      tx = m + lw + 14;
    } catch (e) {
      console.warn('Itinerary logo error:', e);
    }
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(3, 67, 90);
  doc.text('VOYA LANKA TOURS (PVT) LTD.', tx, y + 10);

  // Tagline - reduced size and italic font
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7.5);
  doc.setTextColor(139, 111, 71);
  doc.text('MORE THAN A DESTINATION', tx, y + 21);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(60, 90, 100);
  doc.text('WILDLIFE | NATURE | HERITAGE | BEACHES | ADVENTURE | TREKKING | CULTURE', tx, y + 32);

  // Position SRI LANKA TOUR ITINERARY comfortably below the logo
  y = 96;

  const ensureSpace = (h: number) => {
    if (y + h > H - 36) {
      doc.addPage();
      y = 36;
    }
  };

  const drawRule = () => {
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.5);
    doc.line(m, y, W - m, y);
    y += 8;
  };

  // Header banner info
  const daysCount = itinerary.days.length || pax.days || 1;
  const nightsCount = Math.max(0, daysCount - 1);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42);
  doc.text('SRI LANKA TOUR ITINERARY', m, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `${daysCount} Days / ${nightsCount} Nights \u2022 ${customer.qno || 'Quotation'}`,
    W - m,
    y,
    { align: 'right' }
  );
  y += 10;
  drawRule();
  y += 4;

  // Greeting - compact
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Dear Sir/Madam,', m, y);
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const greetLines = doc.splitTextToSize(itinerary.greeting, CW);
  doc.text(greetLines, m, y);
  y += greetLines.length * 10 + 4;
  drawRule();

  // Days list - compact density
  const getDayDate = (dayNum: number): string | null => {
    if (!customer.travelDate) return null;
    const d0 = new Date(customer.travelDate + 'T00:00:00');
    if (isNaN(d0.getTime())) return null;
    d0.setDate(d0.getDate() + dayNum - 1);
    return d0.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  itinerary.days.forEach((day, idx) => {
    const dayDate = getDayDate(idx + 1);
    const isLast = idx === itinerary.days.length - 1;

    // Compact threshold check: only break if less than 24pt remaining
    ensureSpace(24);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(`DAY ${idx + 1}${dayDate ? ` - ${dayDate.toUpperCase()}` : ''}`, m, y);
    y += 10;

    if (day.title) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(3, 105, 161);
      doc.text(day.title.toUpperCase(), m, y);
      y += 10;
    }

    // Activities
    const actLines = day.acts
      .split('\n')
      .map(l => l.trim())
      .filter(Boolean);

    actLines.forEach(act => {
      ensureSpace(11);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('\u2022', m + 8, y);

      const isOptional = /^Optional Activity:/i.test(act);
      const timeMatch = act.match(/^(\d{1,2}:\d{2}\s*(?:AM|PM)?)\s*:\s*(.*)$/i);

      if (isOptional || timeMatch) {
        const prefix = isOptional ? 'Optional Activity: ' : `${timeMatch![1]}: `;
        const rest = isOptional ? act.replace(/^Optional Activity:\s*/i, '') : timeMatch![2];

        doc.setFont('helvetica', 'bold');
        const prefixW = doc.getTextWidth(prefix);
        doc.text(prefix, m + 18, y);

        doc.setFont('helvetica', 'normal');
        const restLines = doc.splitTextToSize(rest, CW - 20 - prefixW);
        if (restLines.length > 0) {
          doc.text(restLines[0], m + 18 + prefixW, y);
          for (let ri = 1; ri < restLines.length; ri++) {
            y += 9.5;
            ensureSpace(10);
            doc.text(restLines[ri], m + 18, y);
          }
        }
      } else {
        const lines = doc.splitTextToSize(act, CW - 20);
        lines.forEach((l: string, li: number) => {
          if (li > 0) {
            y += 9.5;
            ensureSpace(10);
          }
          doc.text(l, m + 18, y);
        });
      }
      y += 10;
    });

    if (!isLast && day.stay) {
      ensureSpace(11);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(15, 23, 42);
      doc.text('Overnight Stay: ', m + 8, y);
      const stayPrefixW = doc.getTextWidth('Overnight Stay: ');
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(71, 85, 105);
      doc.text(day.stay, m + 8 + stayPrefixW, y);
      y += 11;
    }

    // NOTE: Room Rate has been REMOVED as requested!
    y += 2;
    drawRule();
  });

  // Accommodation Summary table (NOTE: Room Cost column REMOVED as requested!)
  const hotelGroups: { stay: string; nights: number }[] = [];
  itinerary.days.slice(0, nightsCount).forEach(d => {
    if (!d.stay) return;
    const existing = hotelGroups.find(g => g.stay.toLowerCase() === d.stay.toLowerCase());
    if (existing) {
      existing.nights += 1;
    } else {
      hotelGroups.push({ stay: d.stay, nights: 1 });
    }
  });

  if (hotelGroups.length > 0) {
    ensureSpace(50);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(2, 132, 199);
    doc.text('ACCOMMODATION SUMMARY', m, y);

    const summaryTableRows = hotelGroups.map(g => {
      const commaIdx = g.stay.lastIndexOf(',');
      const dest = commaIdx > 0 ? g.stay.slice(commaIdx + 1).trim() : '-';
      const hotel = commaIdx > 0 ? g.stay.slice(0, commaIdx).trim() : g.stay;
      return [dest, hotel, `${g.nights} Night${g.nights > 1 ? 's' : ''}`];
    });

    autoTable(doc, {
      startY: y + 4,
      margin: { left: m, right: m },
      head: [['Destination', 'Hotel', 'Nights']],
      body: summaryTableRows,
      headStyles: { fillColor: [3, 105, 161], textColor: 255, fontSize: 7.5, cellPadding: 3 },
      styles: { fontSize: 7.5, cellPadding: 3, textColor: [15, 23, 42], lineColor: [203, 213, 225], lineWidth: 0.5 },
      columnStyles: { 2: { halign: 'center', cellWidth: 70 } }
    });

    y = (doc as any).lastAutoTable.finalY + 12;
  }

  // Closing & Bottom Company Details (DO NOT remove bottom company details!)
  ensureSpace(60);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(`Total Duration: ${daysCount} Days / ${nightsCount} Nights`, m, y);
  y += 12;

  const closeLines = doc.splitTextToSize(itinerary.closing, CW);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(closeLines, m, y);
  y += closeLines.length * 9.5 + 8;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('Kind Regards,', m, y);
  y += 11;
  doc.text(LEGAL_NAME, m, y);
  y += 10;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  if (company.address) {
    doc.text(company.address, m, y);
    y += 9;
  }
  const coContactBottom = [company.website && 'Web: ' + company.website, company.email && 'Email: ' + company.email, company.phone && 'Tel: ' + company.phone].filter(Boolean).join(' | ');
  if (coContactBottom) {
    doc.text(coContactBottom, m, y);
  }

  // Page Numbers & Company Logo Watermark in the middle of EVERY itinerary page!
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);

    // Company logo watermark in the middle of the itinerary page
    if (logo && logo.data) {
      try {
        doc.saveGraphicsState();
        const GState = (doc as any).GState;
        if (GState) {
          doc.setGState(new GState({ opacity: 0.08 }));
        }
        const maxW = 300;
        const maxH = 300;
        const scale = Math.min(maxW / (logo.w || 200), maxH / (logo.h || 200));
        const ww = (logo.w || 200) * scale;
        const wh = (logo.h || 200) * scale;
        doc.addImage(
          logo.data,
          logo.data.startsWith('data:image/png') ? 'PNG' : 'JPEG',
          (W - ww) / 2,
          (H - wh) / 2,
          ww,
          wh
        );
        doc.restoreGraphicsState();
      } catch (e) {}
    } else {
      try {
        doc.saveGraphicsState();
        const GState = (doc as any).GState;
        if (GState) {
          doc.setGState(new GState({ opacity: 0.05 }));
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(30);
        doc.setTextColor(3, 105, 161);
        doc.text('VOYA LANKA TOURS', W / 2, H / 2, {
          align: 'center',
          angle: 30
        });
        doc.restoreGraphicsState();
      } catch (e) {}
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text('Voya Lanka Tours \u2022 Tour Itinerary', m, H - 16);
    doc.text(`Page ${p} of ${totalPages}`, W - m, H - 16, { align: 'right' });
  }

  return doc.output('blob');
}
