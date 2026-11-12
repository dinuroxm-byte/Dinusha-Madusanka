import * as XLSX from 'xlsx';
import { CalculatedHotelRate, HotelRateCard, RoomConfig } from '../types';

export const HOTEL_RATES_STORAGE_KEY = 'voya_lanka_hotel_rate_cards_v4';

/**
 * Robust date parser supporting DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD
 */
export function parseDateString(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const trimmed = String(raw).trim();

  // Pattern 1: DD.MM.YYYY or DD/MM/YYYY or DD-MM-YYYY
  const dmyMatch = trimmed.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Pattern 2: YYYY-MM-DD or YYYY.MM.DD or YYYY/MM/DD
  const ymdMatch = trimmed.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (ymdMatch) {
    const year = ymdMatch[1];
    const month = ymdMatch[2].padStart(2, '0');
    const day = ymdMatch[3].padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Pattern 3: Standard JS Date
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return null;
}

/**
 * Parses date range strings such as "01.11.2026-11.11.2026", "01/11/2026 - 11/11/2026", "2026-11-01 to 2026-11-11"
 */
export function parseDateRange(raw: string | undefined | null): {
  validFrom?: string;
  validTo?: string;
  label: string;
} | null {
  if (!raw || typeof raw !== 'string') return null;
  const clean = raw.trim();
  if (!clean) return null;

  // Split on separator like ' - ', '-', ' to ', ' until ', etc.
  const parts = clean.split(/\s*[-–—~]\s*|\s+to\s+|\s+until\s+/i);
  if (parts.length >= 2) {
    const fromStr = parseDateString(parts[0].trim());
    const toStr = parseDateString(parts[1].trim());
    if (fromStr && toStr) {
      return {
        validFrom: fromStr,
        validTo: toStr,
        label: clean
      };
    }
  }

  // If single date
  const single = parseDateString(clean);
  if (single) {
    return {
      validFrom: single,
      validTo: single,
      label: clean
    };
  }

  return { label: clean };
}

// Preloaded sample rate cards matching the user's latest specification & attachment with Rate Valid Dates
export const DEFAULT_HOTEL_RATES: HotelRateCard[] = [
  {
    id: 'rate_taj_samudra_period_1',
    hotelName: 'Taj Samudra',
    hotelCategory: '5-star',
    validFrom: '2026-11-01',
    validTo: '2026-11-11',
    validDateRangeStr: '01.11.2026-11.11.2026',
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    bedRates: {
      'Single': 10,
      'Double (DBL)': 15,
      'DBL + ExtraBed': 20,
      'Twin': 25,
      'Triple': 30,
      'Family Suite': 40
    },
    mealRates: {
      'Room Only': 0,
      'Bed & Breakfast': 1,
      'Half-Board': 50,
      'Full Board': 100
    },
    roomCategoryRates: {
      'Standard Room': 1,
      'Delux Room': 2,
      'Deluxe Room': 2,
      'Superior Room': 3,
      'Executive room': 4,
      'Executive Suite': 4
    },
    roomViewRates: {
      'Garden View': 1,
      'Sea View': 50,
      'Mountain View': 3,
      'City View': 4,
      'Pool View': 5,
      'Lagoon View': 6
    }
  },
  {
    id: 'rate_taj_samudra_period_2',
    hotelName: 'Taj Samudra',
    hotelCategory: '5-star',
    validFrom: '2026-11-12',
    validTo: '2026-11-20',
    validDateRangeStr: '12.11.2026-20.11.2026',
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    bedRates: {
      'Single': 10,
      'Double (DBL)': 15,
      'DBL + ExtraBed': 20,
      'Twin': 25,
      'Triple': 30,
      'Family Suite': 40
    },
    mealRates: {
      'Room Only': 0,
      'Bed & Breakfast': 0,
      'Half-Board': 50,
      'Full Board': 100
    },
    roomCategoryRates: {
      'Standard Room': 1,
      'Delux Room': 2,
      'Deluxe Room': 2,
      'Superior Room': 3,
      'Executive room': 4,
      'Executive Suite': 4
    },
    roomViewRates: {
      'Garden View': 1,
      'Sea View': 60,
      'Mountain View': 3,
      'City View': 4,
      'Pool View': 5,
      'Lagoon View': 6
    }
  },
  {
    id: 'rate_aliya_resort_period_1',
    hotelName: 'Aliya Resort & Spa',
    hotelCategory: '5-star',
    validFrom: '2026-11-01',
    validTo: '2026-11-20',
    validDateRangeStr: '01.11.2026-20.11.2026',
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    bedRates: {
      'Single': 100,
      'Double (DBL)': 110,
      'DBL + ExtraBed': 120,
      'Twin': 130,
      'Triple': 140,
      'Family Suite': 150
    },
    mealRates: {
      'Room Only': 0,
      'Bed & Breakfast': 20,
      'Half-Board': 40,
      'Full Board': 80
    },
    roomCategoryRates: {
      'Standard Room': 1,
      'Delux Room': 2,
      'Deluxe Room': 2,
      'Superior Room': 3,
      'Executive room': 4,
      'Executive Suite': 4
    },
    roomViewRates: {
      'Garden View': 0,
      'Sea View': 70,
      'Mountain View': 20,
      'City View': 3,
      'Pool View': 4,
      'Lagoon View': 5
    }
  },
  {
    id: 'rate_aliya_resort_period_2',
    hotelName: 'Aliya Resort & Spa',
    hotelCategory: '5-star',
    validFrom: '2026-11-21',
    validTo: '2026-11-30',
    validDateRangeStr: '21.11.2026-30.11.2026',
    currency: 'USD',
    updatedAt: new Date().toISOString(),
    bedRates: {
      'Single': 100,
      'Double (DBL)': 110,
      'DBL + ExtraBed': 120,
      'Twin': 130,
      'Triple': 140,
      'Family Suite': 150
    },
    mealRates: {
      'Room Only': 0,
      'Bed & Breakfast': 20,
      'Half-Board': 40,
      'Full Board': 80
    },
    roomCategoryRates: {
      'Standard Room': 1,
      'Delux Room': 2,
      'Deluxe Room': 2,
      'Superior Room': 3,
      'Executive room': 4,
      'Executive Suite': 4
    },
    roomViewRates: {
      'Garden View': 0,
      'Sea View': 80,
      'Mountain View': 20,
      'City View': 3,
      'Pool View': 4,
      'Lagoon View': 5
    }
  }
];

// Helper to normalize strings for robust comparison
export function cleanKey(str: string | undefined | null): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .replace(/deluxe/g, 'delux')
    .replace(/suite/g, 'room')
    .replace(/[^a-z0-9]/g, '')
    .trim();
}

/**
 * Find the matching rate value from a record map using normalized matching
 */
function lookupRate(map: Record<string, number>, key: string | undefined | null): number {
  if (!map || !key) return 0;
  const targetClean = cleanKey(key);
  if (!targetClean) return 0;

  // 1. Direct exact match
  if (typeof map[key] === 'number') return map[key];

  // 2. Normalized match
  for (const [mapKey, val] of Object.entries(map)) {
    if (cleanKey(mapKey) === targetClean) {
      return Number(val) || 0;
    }
  }

  // 3. Substring / Alias matching
  for (const [mapKey, val] of Object.entries(map)) {
    const cleanMap = cleanKey(mapKey);
    if (
      (cleanMap.length > 3 && targetClean.includes(cleanMap)) ||
      (targetClean.length > 3 && cleanMap.includes(targetClean))
    ) {
      return Number(val) || 0;
    }
  }

  return 0;
}

/**
 * Locate the correct hotel rate card by hotel name AND matching validity date
 */
export function findMatchingHotelRateCard(
  hotelName: string,
  rateCards: HotelRateCard[],
  targetDate?: string | Date
): HotelRateCard | null {
  if (!hotelName || !rateCards.length) return null;
  const cleanTarget = cleanKey(hotelName);
  if (!cleanTarget) return null;

  // 1. Filter candidates matching the hotel name
  const candidates = rateCards.filter((card) => {
    const cleanCard = cleanKey(card.hotelName);
    return (
      cleanCard === cleanTarget ||
      (cleanTarget.length >= 4 && cleanCard.includes(cleanTarget)) ||
      (cleanCard.length >= 4 && cleanTarget.includes(cleanCard))
    );
  });

  if (!candidates.length) return null;

  // 2. If targetDate is specified, find the rate card valid for this exact date
  if (targetDate) {
    let targetIso: string;
    if (typeof targetDate === 'string') {
      const parsed = parseDateString(targetDate);
      targetIso = parsed || targetDate.split('T')[0];
    } else {
      targetIso = targetDate.toISOString().split('T')[0];
    }

    // Try exact interval match: validFrom <= targetIso <= validTo
    const matchedByDate = candidates.find((card) => {
      if (card.validFrom && card.validTo) {
        return targetIso >= card.validFrom && targetIso <= card.validTo;
      } else if (card.validFrom) {
        return targetIso >= card.validFrom;
      } else if (card.validTo) {
        return targetIso <= card.validTo;
      }
      return false;
    });

    if (matchedByDate) {
      return matchedByDate;
    }
  }

  // 3. Fallback: if no date matched or no targetDate given, prefer a card without dates or the first candidate
  const fallbackNoDate = candidates.find((c) => !c.validFrom && !c.validTo);
  return fallbackNoDate || candidates[0];
}

/**
 * Calculate the total rate and price breakdown for a selected room
 */
export function calculateRoomRate(
  room: Partial<RoomConfig>,
  rateCards: HotelRateCard[],
  usdRate: number = 305,
  nightDate?: string | Date
): CalculatedHotelRate {
  const emptyResult: CalculatedHotelRate = {
    hotelMatched: false,
    totalUsd: 0,
    totalLkr: 0,
    breakdown: {
      bed: { name: room.bedType || 'Not selected', rate: 0 },
      meal: { name: room.meal || 'Not selected', rate: 0 },
      category: { name: room.roomCategory || 'Standard Room', rate: 0 },
      view: { name: room.roomView || 'Garden View', rate: 0 }
    }
  };

  if (!room.hotel) return emptyResult;

  const card = findMatchingHotelRateCard(room.hotel, rateCards, nightDate);
  if (!card) return emptyResult;

  const bedType = room.bedType || 'Double (DBL)';
  const mealPlan = room.meal || 'Half-Board';
  const roomCategory = room.roomCategory || 'Standard Room';
  const roomView = room.roomView || 'Garden View';

  const bedRate = lookupRate(card.bedRates, bedType);
  const mealRate = lookupRate(card.mealRates, mealPlan);
  const categoryRate = lookupRate(card.roomCategoryRates, roomCategory);
  const viewRate = lookupRate(card.roomViewRates, roomView);

  const isLkr = card.currency === 'LKR';
  const effectiveUsdRate = usdRate || 305;

  let totalUsd = bedRate + mealRate + categoryRate + viewRate;
  let totalLkr = 0;

  if (isLkr) {
    totalLkr = totalUsd;
    totalUsd = Math.round((totalLkr / effectiveUsdRate) * 100) / 100;
  } else {
    totalLkr = Math.round(totalUsd * effectiveUsdRate);
  }

  let formattedNightDate = '';
  if (nightDate) {
    if (typeof nightDate === 'string') {
      formattedNightDate = nightDate.split('T')[0];
    } else {
      formattedNightDate = nightDate.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  }

  return {
    hotelMatched: true,
    rateCard: card,
    validDateRangeStr: card.validDateRangeStr,
    nightDateFormatted: formattedNightDate,
    totalUsd,
    totalLkr,
    breakdown: {
      bed: { name: bedType, rate: bedRate },
      meal: { name: mealPlan, rate: mealRate },
      category: { name: roomCategory, rate: categoryRate },
      view: { name: roomView, rate: viewRate }
    }
  };
}

/**
 * Parse an uploaded Excel workbook (supports Matrix format with date headers as well as flat tables)
 */
export async function parseHotelRatesExcel(
  buffer: ArrayBuffer
): Promise<{ rateCards: HotelRateCard[]; warnings: string[] }> {
  const warnings: string[] = [];
  const workbook = XLSX.read(buffer, { type: 'array' });

  if (!workbook.SheetNames.length) {
    throw new Error('The uploaded Excel file contains no worksheets.');
  }

  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  // Convert worksheet to a 2D array of rows
  const rawRows: any[][] = XLSX.utils.sheet_to_json(worksheet, {
    header: 1,
    defval: ''
  });

  if (!rawRows || rawRows.length < 3) {
    throw new Error(
      'The Excel file does not have enough rows. Expected at least a Header row and rate items.'
    );
  }

  // Detect Matrix layout:
  // Find row containing "Hotel Name" in first column
  let hotelNameRowIdx = -1;
  for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
    const firstCell = String(rawRows[r]?.[0] || '').toLowerCase().trim();
    if (firstCell.includes('hotel name') || firstCell === 'hotel') {
      hotelNameRowIdx = r;
      break;
    }
  }

  if (hotelNameRowIdx !== -1) {
    // MATRIX FORMAT (Matching user's attached screenshot with valid dates)
    return parseMatrixFormat(rawRows, hotelNameRowIdx, warnings);
  }

  // Fallback: Check if it's Tabular format
  const headerRow = rawRows[0].map((c: any) => String(c).toLowerCase().trim());
  const hasHotelCol = headerRow.some((h: string) => h.includes('hotel'));
  const hasRateCol = headerRow.some(
    (h: string) => h.includes('rate') || h.includes('price') || h.includes('cost')
  );

  if (hasHotelCol && hasRateCol) {
    return parseTabularFormat(rawRows, warnings);
  }

  return parseMatrixFormat(rawRows, 0, warnings);
}

/**
 * Parse Matrix format (Column A = Category/Items, Columns B... = Hotel Rate Periods)
 */
function parseMatrixFormat(
  rows: any[][],
  hotelRowIdx: number,
  warnings: string[]
): { rateCards: HotelRateCard[]; warnings: string[] } {
  const hotelRow = rows[hotelRowIdx];
  const totalCols = hotelRow.length;

  const hotels: {
    colIdx: number;
    name: string;
    category?: string;
    validDateRangeStr?: string;
    validFrom?: string;
    validTo?: string;
  }[] = [];

  // Find all hotel columns
  for (let c = 1; c < totalCols; c++) {
    const val = String(hotelRow[c] || '').trim();
    if (val) {
      hotels.push({ colIdx: c, name: val });
    }
  }

  if (!hotels.length) {
    throw new Error(
      'Could not find any Hotel Names in the columns. Please verify that column B, C, etc. contain hotel names.'
    );
  }

  // Look for "Rate Valid date" or date ranges in the rows above or immediately below Hotel Name
  // In the user's screenshot:
  // Row 0 has "Rate Valid date"
  // Row 1 has "01.11.2026-11.11.2026", "12.11.2026-20.11.2026", etc.
  // Row 2 has "Hotel Name"
  for (const h of hotels) {
    // Check rows above hotelRowIdx
    for (let r = 0; r < hotelRowIdx; r++) {
      const cellVal = String(rows[r]?.[h.colIdx] || '').trim();
      const firstCell = String(rows[r]?.[0] || '').toLowerCase().trim();

      // If cell looks like a date range or row label indicates valid date
      if (cellVal && (firstCell.includes('valid') || firstCell.includes('date') || cellVal.match(/\d{1,2}[./-]\d{1,2}/))) {
        const parsedRange = parseDateRange(cellVal);
        if (parsedRange && (parsedRange.validFrom || parsedRange.validTo)) {
          h.validDateRangeStr = parsedRange.label;
          h.validFrom = parsedRange.validFrom;
          h.validTo = parsedRange.validTo;
          break;
        }
      }
    }

    // If not found above, check 1 row below hotelRowIdx (in case dates are below)
    if (!h.validFrom && rows[hotelRowIdx + 1]) {
      const firstCell = String(rows[hotelRowIdx + 1]?.[0] || '').toLowerCase().trim();
      if (firstCell.includes('valid') || firstCell.includes('date')) {
        const cellVal = String(rows[hotelRowIdx + 1]?.[h.colIdx] || '').trim();
        const parsedRange = parseDateRange(cellVal);
        if (parsedRange) {
          h.validDateRangeStr = parsedRange.label;
          h.validFrom = parsedRange.validFrom;
          h.validTo = parsedRange.validTo;
        }
      }
    }
  }

  // Inspect optional category row (usually below Hotel Name, e.g. "Hotel Category")
  for (let r = hotelRowIdx + 1; r < Math.min(rows.length, hotelRowIdx + 3); r++) {
    const firstCell = String(rows[r]?.[0] || '').toLowerCase();
    if (firstCell.includes('hotel category') || firstCell.includes('category') || firstCell.includes('star')) {
      for (const h of hotels) {
        h.category = String(rows[r]?.[h.colIdx] || '').trim();
      }
      break;
    }
  }

  // Initialize rate cards
  const rateCardsMap = new Map<number, HotelRateCard>();
  for (const h of hotels) {
    const cardId =
      'rate_' +
      cleanKey(h.name) +
      (h.validFrom ? '_' + h.validFrom : '') +
      '_' +
      Math.random().toString(36).substr(2, 5);

    rateCardsMap.set(h.colIdx, {
      id: cardId,
      hotelName: h.name,
      hotelCategory: h.category || '5-star',
      validFrom: h.validFrom,
      validTo: h.validTo,
      validDateRangeStr: h.validDateRangeStr,
      currency: 'USD',
      updatedAt: new Date().toISOString(),
      bedRates: {},
      mealRates: {},
      roomCategoryRates: {},
      roomViewRates: {}
    });
  }

  // State machine for sections in Column A
  type Section = 'occupancy' | 'meal' | 'roomCategory' | 'roomView' | 'other';
  let currentSection: Section = 'occupancy';

  const startRow = hotelRowIdx + 1;
  for (let r = startRow; r < rows.length; r++) {
    const row = rows[r];
    const rawLabel = String(row[0] || '').trim();
    if (!rawLabel) continue;

    const lowerLabel = rawLabel.toLowerCase();

    // Check for section header transitions
    if (
      lowerLabel.includes('occupancy') ||
      lowerLabel.includes('bed type') ||
      lowerLabel.includes('occupancy / bed')
    ) {
      currentSection = 'occupancy';
      continue;
    }
    if (lowerLabel.includes('meal plan') || lowerLabel === 'meals' || lowerLabel === 'meal') {
      currentSection = 'meal';
      continue;
    }
    if (lowerLabel.includes('room category') || lowerLabel.includes('room type')) {
      currentSection = 'roomCategory';
      continue;
    }
    if (lowerLabel.includes('room view') || lowerLabel.includes('view')) {
      currentSection = 'roomView';
      continue;
    }
    if (
      lowerLabel.includes('hotel category') ||
      lowerLabel.includes('category') ||
      lowerLabel.includes('rate valid') ||
      lowerLabel.includes('valid date')
    ) {
      continue;
    }

    // Process the item row across each hotel column
    for (const h of hotels) {
      const card = rateCardsMap.get(h.colIdx);
      if (!card) continue;

      const rawVal = row[h.colIdx];
      let numVal = 0;
      if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
        const cleanedStr = String(rawVal).replace(/[^0-9.-]/g, '');
        numVal = Number(cleanedStr) || 0;
      }

      switch (currentSection) {
        case 'occupancy':
          card.bedRates[rawLabel] = numVal;
          break;
        case 'meal':
          card.mealRates[rawLabel] = numVal;
          break;
        case 'roomCategory': {
          const cleanLabel = cleanKey(rawLabel);
          if (cleanLabel === 'seaviewroom' || cleanLabel === 'seaview') {
            // Sea View belongs to room view, not room category
            if (numVal > 0 && (!card.roomViewRates['Sea View'] || card.roomViewRates['Sea View'] === 0)) {
              card.roomViewRates['Sea View'] = numVal;
            }
            break;
          }
          card.roomCategoryRates[rawLabel] = numVal;
          break;
        }
        case 'roomView':
          card.roomViewRates[rawLabel] = numVal;
          break;
        default:
          break;
      }
    }
  }

  const resultCards = Array.from(rateCardsMap.values());
  return { rateCards: resultCards, warnings };
}

/**
 * Parse Tabular format (one row per hotel option or flat table)
 */
function parseTabularFormat(
  rows: any[][],
  warnings: string[]
): { rateCards: HotelRateCard[]; warnings: string[] } {
  const header = rows[0].map((c: any) => String(c).toLowerCase().trim());
  const hotelIdx = header.findIndex((h: string) => h.includes('hotel'));
  const dateIdx = header.findIndex(
    (h: string) => h.includes('valid') || h.includes('date') || h.includes('period')
  );
  const bedIdx = header.findIndex((h: string) => h.includes('bed') || h.includes('occupancy'));
  const mealIdx = header.findIndex((h: string) => h.includes('meal'));
  const catIdx = header.findIndex((h: string) => h.includes('category') && !h.includes('hotel'));
  const viewIdx = header.findIndex((h: string) => h.includes('view'));
  const rateIdx = header.findIndex(
    (h: string) => h.includes('rate') || h.includes('price') || h.includes('cost')
  );

  const cardsMap = new Map<string, HotelRateCard>();

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const hotelName = String(row[hotelIdx] || '').trim();
    if (!hotelName) continue;

    const dateStr = dateIdx !== -1 ? String(row[dateIdx] || '').trim() : '';
    const dateParsed = parseDateRange(dateStr);

    const mapKey = `${hotelName}_${dateParsed?.validFrom || 'all'}_${dateParsed?.validTo || 'all'}`;

    let card = cardsMap.get(mapKey);
    if (!card) {
      card = {
        id: 'rate_' + cleanKey(hotelName) + '_' + Math.random().toString(36).substr(2, 5),
        hotelName,
        hotelCategory: '5-star',
        validFrom: dateParsed?.validFrom,
        validTo: dateParsed?.validTo,
        validDateRangeStr: dateParsed?.label,
        currency: 'USD',
        updatedAt: new Date().toISOString(),
        bedRates: {},
        mealRates: {},
        roomCategoryRates: {},
        roomViewRates: {}
      };
      cardsMap.set(mapKey, card);
    }

    const rate = Number(String(row[rateIdx] || '').replace(/[^0-9.-]/g, '')) || 0;

    if (bedIdx !== -1 && row[bedIdx]) {
      card.bedRates[String(row[bedIdx]).trim()] = rate;
    }
    if (mealIdx !== -1 && row[mealIdx]) {
      card.mealRates[String(row[mealIdx]).trim()] = rate;
    }
    if (catIdx !== -1 && row[catIdx]) {
      card.roomCategoryRates[String(row[catIdx]).trim()] = rate;
    }
    if (viewIdx !== -1 && row[viewIdx]) {
      card.roomViewRates[String(row[viewIdx]).trim()] = rate;
    }
  }

  return { rateCards: Array.from(cardsMap.values()), warnings };
}

/**
 * Generate a downloadable Excel workbook matching the exact structure from the user's latest screenshot
 * Row 1: Rate Valid date
 * Row 2: Date ranges (01.11.2026-11.11.2026, 12.11.2026-20.11.2026, etc.)
 * Row 3: Hotel Name (Taj Samudra, Taj Samudra, Aliya Resort & Spa, Aliya Resort & Spa)
 * Row 4: Hotel Category (5-star, 5-star, 5-star, 5-star)
 * Row 5+: Occupancy / Bed, Meal Plan, Room Category, Room View
 */
export function generateSampleHotelRatesWorkbook(): Uint8Array {
  const wb = XLSX.utils.book_new();

  const data = [
    ['', 'Rate Valid date', 'Rate Valid date', 'Rate Valid date', 'Rate Valid date'],
    ['', '01.11.2026-11.11.2026', '12.11.2026-20.11.2026', '01.11.2026-20.11.2026', '21.11.2026-30.11.2026'],
    ['Hotel Name', 'Taj Samudra', 'Taj Samudra', 'Aliya Resort & Spa', 'Aliya Resort & Spa'],
    ['Hotel Category', '5-star', '5-star', '5-star', '5-star'],
    ['Occupancy / Bed', '', '', '', ''],
    ['Single', 10, 10, 100, 100],
    ['Double (DBL)', 15, 15, 110, 110],
    ['DBL + ExtraBed', 20, 20, 120, 120],
    ['Twin', 25, 25, 130, 130],
    ['Triple', 30, 30, 140, 140],
    ['Family Suite', 40, 40, 150, 150],
    ['Meal Plan', '', '', '', ''],
    ['Room Only', 0, '', '', ''],
    ['Bed & Breakfast', 1, '', 20, 20],
    ['Half-Board', 50, 50, 40, 40],
    ['Full Board', 100, 100, 80, 80],
    ['Room Category', '', '', '', ''],
    ['Standard Room', 1, 1, 1, 1],
    ['Delux Room', 2, 2, 2, 2],
    ['Superior Room', 3, 3, 3, 3],
    ['Executive room', 4, 4, 4, 4],
    ['Room View', '', '', '', ''],
    ['Garden View', 1, 1, '', ''],
    ['Sea View', 50, 60, 70, 80],
    ['Mountain View', 3, 3, 20, 20],
    ['City View', 4, 4, 3, 3],
    ['Pool View', 5, 5, 4, 4],
    ['Lagoon View', 6, 6, 5, 5]
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 22 },
    { wch: 24 },
    { wch: 24 },
    { wch: 24 },
    { wch: 24 }
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Hotel Rates');

  const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Uint8Array(out);
}

/**
 * Trigger download of the sample template in browser
 */
export function downloadSampleRatesTemplate() {
  const buffer = generateSampleHotelRatesWorkbook();
  const blob = new Blob([buffer.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Voya_Lanka_Hotel_Rates_With_Valid_Dates.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Storage helpers
 */
export function loadSavedHotelRates(): HotelRateCard[] {
  try {
    const raw = localStorage.getItem(HOTEL_RATES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Sanitize: remove 'Sea View Room' from roomCategoryRates
        return parsed.map((card: HotelRateCard) => {
          if (card.roomCategoryRates && 'Sea View Room' in card.roomCategoryRates) {
            const seaRate = card.roomCategoryRates['Sea View Room'];
            const newCatRates = { ...card.roomCategoryRates };
            delete newCatRates['Sea View Room'];
            const newViewRates = { ...card.roomViewRates };
            if (seaRate > 0 && (!newViewRates['Sea View'] || newViewRates['Sea View'] === 0)) {
              newViewRates['Sea View'] = seaRate;
            }
            return {
              ...card,
              roomCategoryRates: newCatRates,
              roomViewRates: newViewRates
            };
          }
          return card;
        });
      }
    }
  } catch (err) {
    console.warn('Failed to load hotel rates from localStorage:', err);
  }
  return DEFAULT_HOTEL_RATES;
}

export function saveHotelRatesToLocal(rateCards: HotelRateCard[]) {
  try {
    localStorage.setItem(HOTEL_RATES_STORAGE_KEY, JSON.stringify(rateCards));
  } catch (err) {
    console.error('Failed to save hotel rates to localStorage:', err);
  }
}
