import ExcelJS from 'exceljs';
import {
  ItineraryData,
  NightConfig,
  SavedQuotation
} from '../types';
import {
  getTemplateVariables,
  PAYMENT_SCHEDULE_TEMPLATE,
  replaceTemplateVars
} from './calc';
import { QuoteExportData } from './pdfExport';

export async function buildExcelWorkbookBlob(
  data: QuoteExportData,
  itinerary: ItineraryData | null,
  vconf: Record<number, string>,
  allSavedQuotes: SavedQuotation[]
): Promise<Blob> {
  const { customer, pax, nights, transport, guide, pricing, others, terms, pricingBreakdown } = data;

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Voya Lanka Tours';
  wb.created = new Date();

  const days = Math.max(1, pax.days || 1);
  const nightsCount = Math.max(0, days - 1);
  const LKR = '#,##0';
  const USD2 = '#,##0.00';
  const DT = 'dd mmm yyyy';

  const thin = { style: 'thin' as const, color: { argb: 'FFCBD5E1' } };
  const bd: Partial<ExcelJS.Borders> = { top: thin, left: thin, bottom: thin, right: thin };

  const HF: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0369A1' } };
  const LF: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD6E6F4' } };
  const GF: ExcelJS.Fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEAF6EE' } };

  const head = (row: ExcelJS.Row) => {
    row.eachCell(c => {
      c.fill = HF;
      c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      c.border = bd;
      c.alignment = { vertical: 'middle', wrapText: true };
    });
  };

  const addSheetHeader = (ws: ExcelJS.Worksheet, titleText: string, spanCols: number) => {
    ws.mergeCells(1, 1, 1, spanCols);
    const c = ws.getCell(1, 1);
    c.value = titleText;
    c.font = { bold: true, size: 16, color: { argb: 'FF03435A' } };

    ws.mergeCells(2, 1, 2, spanCols);
    const d = ws.getCell(2, 1);
    d.value = 'MORE THAN A DESTINATION';
    d.font = { bold: true, size: 10, color: { argb: 'FF8B6F47' } };

    ws.addRow([]);
  };

  const getDayDateObj = (dayNum: number): Date | null => {
    if (!customer.travelDate) return null;
    const d0 = new Date(customer.travelDate + 'T00:00:00');
    if (isNaN(d0.getTime())) return null;
    d0.setDate(d0.getDate() + dayNum - 1);
    return d0;
  };

  // 1. Quotation Sheet
  const sQ = wb.addWorksheet('Quotation');
  sQ.columns = [{ width: 28 }, { width: 60 }];
  addSheetHeader(sQ, 'VOYA LANKA TOURS - QUOTATION', 2);
  const qh = sQ.addRow(['Field', 'Details']);
  head(qh);

  const ad = pax.adults || 0;
  const c12 = pax.child12 || 0;
  const c5 = pax.child5 || 0;
  const tdObj = getDayDateObj(1);

  const quoteInfoRows: [string, any][] = [
    ['Quotation No.', customer.qno || 'Draft'],
    ['Date Issued', new Date()],
    ['Customer Name', customer.custName || 'Valued Guest'],
    ['Email', customer.custEmail || 'N/A'],
    ['Phone / WhatsApp', customer.custPhone || 'N/A'],
    ['Country / Nationality', customer.custCountry || 'N/A'],
    ['Arrival Date', tdObj || 'Flexible'],
    ['Duration', `${days} Days / ${nightsCount} Nights`],
    ['Adults (12+)', ad],
    ['Children (< 12)', c12],
    ['Children (< 5)', c5],
    ['Total Pax', ad + c12 + c5],
    ['Vehicle', transport.vehicleType],
    ['Guide', guide.guideType],
    ['Total Kilometers', transport.fuelKm],
    ['Special Remarks', customer.custNotes || 'None'],
    ['Final Price (LKR)', pricingBreakdown.fin],
    ['Final Price (USD)', pricingBreakdown.usd],
    ['Per Person (LKR)', pricingBreakdown.ppLKR],
    ['Per Person (USD)', pricingBreakdown.ppUSD]
  ];

  quoteInfoRows.forEach(([k, v]) => {
    const row = sQ.addRow([k, v]);
    row.eachCell(c => (c.border = bd));
    row.getCell(1).fill = LF;
    row.getCell(1).font = { bold: true };
    row.getCell(2).alignment = { horizontal: 'left', wrapText: true };
    if (v instanceof Date) row.getCell(2).numFmt = DT;
    if (k.includes('(LKR)')) row.getCell(2).numFmt = LKR;
    if (k.includes('(USD)')) row.getCell(2).numFmt = USD2;
  });

  // 2. Accommodation Sheet
  const sA = wb.addWorksheet('Accommodation');
  sA.columns = [
    { width: 8 },
    { width: 14 },
    { width: 8 },
    { width: 34 },
    { width: 16 },
    { width: 18 },
    { width: 16 },
    { width: 16 },
    { width: 16 },
    { width: 18 },
    { width: 22 }
  ];
  addSheetHeader(sA, 'VOYA LANKA TOURS - ACCOMMODATION', 11);
  const ah = sA.addRow([
    'Night',
    'Date',
    'Room',
    'Hotel',
    'Hotel Category',
    'Room Category',
    'Room View',
    'Bed / Occupancy',
    'Meal Plan',
    'Rate / Night (LKR)',
    'Room Confirmed By'
  ]);
  head(ah);

  let aFirst: number | null = null;
  let aLast: number | null = null;

  nights.slice(0, nightsCount).forEach((night, ni) => {
    const d = getDayDateObj(ni + 1);
    night.rooms.forEach((r, ri) => {
      const row = sA.addRow([
        ni + 1,
        d || '',
        ri + 1,
        r.hotel,
        r.category,
        r.roomCategory,
        r.roomView,
        r.bedType,
        r.meal,
        Number(r.cost) || 0,
        vconf[ni + 1] || ''
      ]);
      row.eachCell(c => (c.border = bd));
      if (d) row.getCell(2).numFmt = DT;
      row.getCell(10).numFmt = LKR;
      if (!aFirst) aFirst = row.number;
      aLast = row.number;
    });
  });

  let accRef = '0';
  if (aFirst && aLast) {
    const totalRow = sA.addRow([
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      'TOTAL',
      { formula: `SUM(J${aFirst}:J${aLast})`, result: pricingBreakdown.accom },
      ''
    ]);
    totalRow.eachCell(c => {
      c.border = bd;
      c.font = { bold: true };
    });
    totalRow.getCell(10).numFmt = LKR;
    totalRow.getCell(10).fill = GF;
    accRef = `Accommodation!J${totalRow.number}`;
  }

  // 3. Other Charges Sheet
  const sO = wb.addWorksheet('Other Charges');
  sO.columns = [{ width: 44 }, { width: 20 }];
  addSheetHeader(sO, 'VOYA LANKA TOURS - OTHER CHARGES', 2);
  const oh = sO.addRow(['Item', 'Amount (LKR)']);
  head(oh);

  const o1 = sO.addRow(['Toll + Parking charges', pricing.toll]);
  o1.eachCell(c => (c.border = bd));
  o1.getCell(2).numFmt = LKR;
  let oLast = o1.number;

  others.forEach(o => {
    const row = sO.addRow([o.name || '', o.cost || 0]);
    row.eachCell(c => (c.border = bd));
    row.getCell(2).numFmt = LKR;
    oLast = row.number;
  });

  const ot = sO.addRow([
    'TOTAL',
    { formula: `SUM(B${o1.number}:B${oLast})`, result: pricing.toll + pricingBreakdown.oth }
  ]);
  ot.eachCell(c => {
    c.border = bd;
    c.font = { bold: true };
  });
  ot.getCell(2).numFmt = LKR;
  ot.getCell(2).fill = GF;

  // 4. Costing Sheet
  const sC = wb.addWorksheet('Costing');
  sC.columns = [{ width: 40 }, { width: 22 }, { width: 48 }];
  addSheetHeader(sC, 'VOYA LANKA TOURS - COSTING', 3);
  const ch = sC.addRow(['Item', 'Amount', 'Notes']);
  head(ch);

  const addCostLine = (
    label: string,
    val: any,
    note?: string,
    numFmt?: string,
    isBold?: boolean
  ): number => {
    const row = sC.addRow([label, val, note || '']);
    row.eachCell(c => (c.border = bd));
    row.getCell(1).fill = LF;
    row.getCell(1).font = { bold: true };
    if (numFmt) row.getCell(2).numFmt = numFmt;
    row.getCell(2).alignment = { horizontal: 'right' };
    if (isBold) {
      row.getCell(2).fill = GF;
      row.getCell(2).font = { bold: true };
    }
    return row.number;
  };

  const r1 = addCostLine(
    'Accommodation & Meals (LKR)',
    { formula: accRef, result: pricingBreakdown.accom },
    'Sum of room rates on Accommodation sheet',
    LKR
  );
  addCostLine(
    'Vehicle (LKR)',
    pricingBreakdown.veh,
    `${days} days x LKR ${Number(transport.vRate).toLocaleString()}`,
    LKR
  );
  addCostLine(
    'Fuel (LKR)',
    pricingBreakdown.fuel,
    `${transport.fuelKm} km / ${transport.fuelAvg} km/L x LKR ${transport.fuelPrice}`,
    LKR
  );
  addCostLine(
    'Driver (LKR)',
    pricingBreakdown.drv,
    `${days} days x LKR ${Number(transport.drvDay).toLocaleString()}`,
    LKR
  );
  addCostLine(
    'Guide Daily Fee (LKR)',
    pricingBreakdown.guide,
    `${days} days x LKR ${Number(guide.guideFee).toLocaleString()}`,
    LKR
  );
  addCostLine(
    'Guide / Driver Room (LKR)',
    pricingBreakdown.crew,
    `${nightsCount} nights x LKR ${Number(guide.crewRoom).toLocaleString()}`,
    LKR
  );
  addCostLine('Toll + Parking (LKR)', pricing.toll, '', LKR);
  const rLast = addCostLine(
    'Other Charges (LKR)',
    pricingBreakdown.oth,
    'See Other Charges sheet',
    LKR
  );

  const rTot = addCostLine(
    'TOTAL COST (LKR)',
    { formula: `SUM(B${r1}:B${rLast})`, result: pricingBreakdown.sub },
    '',
    LKR,
    true
  );

  const rPct = addCostLine('Markup (%)', pricing.markup, '', '0.##');
  const rMk = addCostLine(
    'Markup Amount (LKR)',
    { formula: `B${rTot}*B${rPct}/100`, result: pricingBreakdown.mk },
    '',
    LKR
  );
  const rPre = addCostLine(
    'Price Before Discount (LKR)',
    { formula: `B${rTot}+B${rMk}`, result: pricingBreakdown.pre },
    '',
    LKR
  );
  const rRate = addCostLine('Exchange Rate (1 USD = LKR)', pricing.usdRate, 'Manual rate', '#,##0.00');

  const dtLabel = {
    pct: 'Percentage (%)',
    lkr: 'Amount (LKR)',
    usd: 'Amount (USD)'
  }[pricing.discType];

  addCostLine('Discount Type', dtLabel, 'Only one discount type applies');
  const rDv = addCostLine('Discount Value', pricing.discVal, '', '0.##');

  const dFormula =
    pricing.discType === 'pct'
      ? `MIN(B${rPre},B${rPre}*B${rDv}/100)`
      : pricing.discType === 'usd'
      ? `MIN(B${rPre},B${rDv}*B${rRate})`
      : `MIN(B${rPre},B${rDv})`;

  const rDa = addCostLine(
    'Discount Amount (LKR)',
    { formula: dFormula, result: pricingBreakdown.dAmt },
    '',
    LKR
  );

  const rFin = addCostLine(
    'FINAL PACKAGE PRICE (LKR)',
    { formula: `B${rPre}-B${rDa}`, result: pricingBreakdown.fin },
    '',
    LKR,
    true
  );

  const rUsd = addCostLine(
    'FINAL PACKAGE PRICE (USD)',
    { formula: `B${rFin}/B${rRate}`, result: pricingBreakdown.usd },
    '',
    USD2,
    true
  );

  const rPax = addCostLine('Travellers (Pax)', pricingBreakdown.pax, 'Adults + children');
  addCostLine(
    'Per Person (LKR)',
    { formula: `B${rFin}/B${rPax}`, result: pricingBreakdown.ppLKR },
    '',
    LKR,
    true
  );
  addCostLine(
    'Per Person (USD)',
    { formula: `B${rUsd}/B${rPax}`, result: pricingBreakdown.ppUSD },
    '',
    USD2,
    true
  );

  // 5. Itinerary Sheet
  const sI = wb.addWorksheet('Itinerary');
  sI.columns = [
    { width: 8 },
    { width: 14 },
    { width: 36 },
    { width: 70 },
    { width: 34 },
    { width: 22 },
    { width: 50 }
  ];
  addSheetHeader(sI, 'VOYA LANKA TOURS - TOUR ITINERARY', 7);
  const ih = sI.addRow(['Day', 'Date', 'Title', 'Activities', 'Overnight Stay', 'Room Rate / Night (LKR)', 'Rooms']);
  head(ih);

  if (itinerary && itinerary.days) {
    itinerary.days.forEach((d, i) => {
      const rs = (i < nightsCount && nights[i]?.rooms) || [];
      const row = sI.addRow([
        i + 1,
        getDayDateObj(i + 1) || '',
        d.title || '',
        d.acts
          .split('\n')
          .map(x => x.trim())
          .filter(Boolean)
          .map(x => `\u2022 ${x}`)
          .join('\n'),
        i < nightsCount ? d.stay || '' : '',
        rs.reduce((sum, r) => sum + (Number(r.cost) || 0), 0),
        rs.map((r, k) => `Room ${k + 1}: ${r.roomCategory}, ${r.bedType}, ${r.meal} - LKR ${(Number(r.cost) || 0).toLocaleString()}`).join('\n')
      ]);
      row.getCell(6).numFmt = LKR;
      row.eachCell(c => {
        c.border = bd;
        c.alignment = { vertical: 'top', wrapText: true };
      });
      if (getDayDateObj(i + 1)) row.getCell(2).numFmt = DT;
    });
  }

  // 6. Terms & Payment Sheet
  const sT = wb.addWorksheet('Terms & Payment');
  sT.columns = [{ width: 70 }, { width: 70 }];
  addSheetHeader(sT, 'VOYA LANKA TOURS - PAYMENT, INCLUSIONS, EXCLUSIONS & TERMS', 2);

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

  sT.mergeCells(4, 1, 4, 2);
  const payCell = sT.getCell(4, 1);
  payCell.value = replaceTemplateVars(PAYMENT_SCHEDULE_TEMPLATE, templateVars);
  payCell.font = { bold: true };
  payCell.fill = GF;
  payCell.border = bd;
  sT.addRow([]);

  const thRow = sT.addRow(['Package Inclusions', 'Package Exclusions']);
  head(thRow);

  const parseLines = (text: string) =>
    text
      .split('\n')
      .map(x => x.trim())
      .filter(x => x && !(nightsCount === 0 && x.includes('{nights}')))
      .map(x => replaceTemplateVars(x, templateVars));

  const inc = parseLines(terms.incl);
  const exc = parseLines(terms.excl);
  for (let i = 0; i < Math.max(inc.length, exc.length); i++) {
    const row = sT.addRow([inc[i] || '', exc[i] || '']);
    row.eachCell(c => {
      c.border = bd;
      c.alignment = { wrapText: true, vertical: 'top' };
    });
  }

  sT.addRow([]);
  const termHead = sT.addRow(['Terms & Conditions', '']);
  head(termHead);
  parseLines(terms.terms).forEach(t => {
    const row = sT.addRow([t, '']);
    sT.mergeCells(row.number, 1, row.number, 2);
    row.getCell(1).border = bd;
    row.getCell(1).alignment = { wrapText: true };
  });

  // 7. All Saved Quotations Sheet
  const sS = wb.addWorksheet('All Saved Quotations');
  const cols = [
    { header: 'Quotation ID', width: 16 },
    { header: 'Saved On', width: 14 },
    { header: 'Customer', width: 24 },
    { header: 'Email', width: 28 },
    { header: 'Phone', width: 18 },
    { header: 'Country', width: 18 },
    { header: 'Arrival Date', width: 14 },
    { header: 'Days', width: 8 },
    { header: 'Nights', width: 8 },
    { header: 'Adults', width: 8 },
    { header: 'Children <12', width: 12 },
    { header: 'Children <5', width: 12 },
    { header: 'Vehicle', width: 32 },
    { header: 'Guide', width: 36 },
    { header: 'Markup %', width: 10 },
    { header: 'Discount', width: 16 },
    { header: 'Final LKR', width: 16 },
    { header: 'Final USD', width: 14 },
    { header: 'Notes', width: 40 }
  ];

  sS.columns = cols.map(c => ({ width: c.width }));
  addSheetHeader(sS, 'VOYA LANKA TOURS - ALL SAVED QUOTATIONS', cols.length);
  const sh = sS.addRow(cols.map(c => c.header));
  head(sh);

  allSavedQuotes.forEach(q => {
    const dd = q.customer.travelDate ? new Date(q.customer.travelDate + 'T00:00:00') : '';
    const dl = { pct: '%', lkr: ' LKR', usd: ' USD' }[q.pricing.discType] || '';
    const row = sS.addRow([
      q.id,
      q.savedAt ? new Date(q.savedAt) : '',
      q.customer.custName || '',
      q.customer.custEmail || '',
      q.customer.custPhone || '',
      q.customer.custCountry || '',
      dd,
      Number(q.pax.days) || 0,
      Math.max(0, (Number(q.pax.days) || 1) - 1),
      Number(q.pax.adults) || 0,
      Number(q.pax.child12) || 0,
      Number(q.pax.child5) || 0,
      q.transport.vehicleType || '',
      q.guide.guideType || '',
      Number(q.pricing.markup) || 0,
      Number(q.pricing.discVal) ? `${q.pricing.discVal}${dl}` : 'None',
      q.finLKRn || 0,
      q.finUSDn || 0,
      q.customer.custNotes || ''
    ]);
    row.eachCell(c => (c.border = bd));
    row.getCell(2).numFmt = DT;
    if (dd) row.getCell(7).numFmt = DT;
    row.getCell(17).numFmt = LKR;
    row.getCell(18).numFmt = USD2;
  });

  const buffer = await wb.xlsx.writeBuffer();
  return new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
}
