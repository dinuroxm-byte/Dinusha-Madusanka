import {
  CustomerDetails,
  GuideDetails,
  NightConfig,
  OtherCharge,
  PaxDetails,
  PricingBreakdown,
  PricingConfig,
  TermsConfig,
  TransportDetails
} from '../types';

export const formatLKR = (val: number): string => {
  return 'LKR ' + Math.round(val).toLocaleString();
};

export const formatUSD = (val: number): string => {
  return '$ ' + val.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

export const formatNumber = (val: number): string => {
  return Math.round(val).toLocaleString();
};

const ONES_WORDS = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const TENS_WORDS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertThreeDigitGroup(num: number): string {
  let s = '';
  if (num >= 100) {
    s += ONES_WORDS[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }
  if (num >= 20) {
    s += TENS_WORDS[Math.floor(num / 10)];
    if (num % 10 > 0) {
      s += '-' + ONES_WORDS[num % 10];
    }
    s += ' ';
  } else if (num > 0) {
    s += ONES_WORDS[num] + ' ';
  }
  return s.trim();
}

/**
 * Converts a numeric monetary amount into standard English wording
 * e.g. 1450.00 USD -> "One Thousand Four Hundred Fifty US Dollars Only"
 * e.g. 56000 LKR -> "Fifty-Six Thousand Sri Lankan Rupees Only"
 */
export function numberToWords(amount: number, currency: 'USD' | 'LKR'): string {
  if (isNaN(amount) || amount <= 0) return 'Zero';

  const isLkr = currency === 'LKR';
  const total = isLkr ? Math.round(amount) : Math.round(amount * 100) / 100;
  const integerPart = Math.floor(total);
  const decimalPart = Math.round((total - integerPart) * 100);

  if (integerPart === 0 && decimalPart === 0) return 'Zero';

  let n = integerPart;
  const scales = [
    { value: 1000000000, name: 'Billion' },
    { value: 1000000, name: 'Million' },
    { value: 1000, name: 'Thousand' },
    { value: 1, name: '' }
  ];

  let words = '';
  for (const scale of scales) {
    const chunk = Math.floor(n / scale.value);
    if (chunk > 0) {
      const chunkWords = convertThreeDigitGroup(chunk);
      words += chunkWords + (scale.name ? ' ' + scale.name + ' ' : ' ');
      n %= scale.value;
    }
  }

  words = words.trim();

  if (isLkr) {
    return `${words} Sri Lankan Rupees Only`;
  } else {
    let result = `${words} US Dollars`;
    if (decimalPart > 0) {
      const centWords = convertThreeDigitGroup(decimalPart);
      result += ` and ${centWords} Cents`;
    }
    return `${result} Only`;
  }
}

export function generateQuoteId(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `QT-${y}${m}${day}-${rand}`;
}

export function computePricing(
  pax: PaxDetails,
  nights: NightConfig[],
  transport: TransportDetails,
  guide: GuideDetails,
  pricing: PricingConfig,
  others: OtherCharge[]
): PricingBreakdown {
  const totalPax = (pax.adults || 0) + (pax.child12 || 0) + (pax.child5 || 0);
  const days = Math.max(0, pax.days || 0);
  const nightCount = Math.max(0, days > 0 ? days - 1 : 0);
  const rate = pricing.usdRate > 0 ? pricing.usdRate : 305;

  // Accommodation total
  let accom = 0;
  for (let i = 0; i < nightCount; i++) {
    const night = nights[i];
    if (night && night.rooms) {
      for (const r of night.rooms) {
        accom += Number(r.cost) || 0;
      }
    }
  }

  // Vehicle cost
  const veh = days * (Number(transport.vRate) || 0);

  // Fuel calculation
  const fuelKm = Number(transport.fuelKm) || 0;
  const fuelAvg = Number(transport.fuelAvg) || 10;
  const fuelPrice = Number(transport.fuelPrice) || 370;
  const fuelLit = fuelAvg > 0 ? fuelKm / fuelAvg : 0;
  const fuel = fuelLit * fuelPrice;

  // Driver total
  const drv = days * (Number(transport.drvDay) || 0);

  // Guide total
  const guideFeeTotal = days * (Number(guide.guideFee) || 0);

  // Crew room total (NIGHT COUNT, not days!)
  const crew = nightCount * (Number(guide.crewRoom) || 0);

  // Tolls & parking
  const toll = Number(pricing.toll) || 0;

  // Other charges: Dynamically recalculate using current usdRate when item is priced in USD
  let oth = 0;
  for (const o of others) {
    if (o.unitPriceUsd !== undefined && o.unitPriceUsd > 0) {
      const q = o.qty || 1;
      oth += Math.round(o.unitPriceUsd * rate * q);
    } else {
      oth += Number(o.cost) || 0;
    }
  }

  // Subtotal before markup
  const sub = accom + veh + fuel + drv + guideFeeTotal + crew + toll + oth;

  // Markup
  const mk = sub * ((Number(pricing.markup) || 0) / 100);
  const pre = sub + mk;

  // Discount
  const dv = Number(pricing.discVal) || 0;
  let dAmt = 0;
  if (pricing.discType === 'pct') {
    dAmt = (pre * Math.min(100, Math.max(0, dv))) / 100;
  } else if (pricing.discType === 'usd') {
    dAmt = dv * rate;
  } else {
    dAmt = dv;
  }
  dAmt = Math.min(pre, Math.max(0, dAmt));

  const fin = pre - dAmt;
  const usd = rate > 0 ? fin / rate : 0;

  const ppLKR = totalPax > 0 ? fin / totalPax : 0;
  const ppUSD = totalPax > 0 ? usd / totalPax : 0;

  return {
    accom,
    veh,
    fuelLit,
    fuel,
    drv,
    guide: guideFeeTotal,
    crew,
    toll,
    oth,
    sub,
    mk,
    pre,
    dAmt,
    fin,
    usd,
    pax: totalPax,
    ppLKR,
    ppUSD
  };
}

export interface TemplateVariables {
  days: number;
  nights: number;
  vehicle: string;
  hotels: string;
  meals: string;
  guide: string;
  water: number;
  validUntil: string;
  validDays: number;
  dep: number;
  bal: number;
  depAmt: string;
  balAmt: string;
}

export function getTemplateVariables(
  customer: CustomerDetails,
  pax: PaxDetails,
  nights: NightConfig[],
  transport: TransportDetails,
  guide: GuideDetails,
  pricing: PricingConfig,
  terms: TermsConfig,
  pricingBreakdown: PricingBreakdown
): TemplateVariables {
  const days = Math.max(1, pax.days || 1);
  const nightCount = Math.max(0, days - 1);

  const vt = transport.vehicleType || '';
  const vehicle = /bus/i.test(vt)
    ? 'air-conditioned bus'
    : /van/i.test(vt)
    ? 'air-conditioned van'
    : /jeep|suv/i.test(vt)
    ? '7-seater jeep / SUV'
    : 'car (sedan)';

  const catMap: Record<string, string> = {
    '5-Star Luxury': '5-star hotels',
    '4-Star Premium': '4-star hotels',
    '3-Star Comfort': '3-star hotels',
    'Boutique Villa': 'boutique villas'
  };

  const allCats = new Set<string>();
  const allMeals = new Set<string>();

  nights.slice(0, nightCount).forEach(n => {
    n.rooms.forEach(r => {
      if (r.category) allCats.add(catMap[r.category] || r.category);
      if (r.meal) allMeals.add(r.meal);
    });
  });

  const hotelsStr = Array.from(allCats).join(' / ') || 'hotels';
  const mealsStr = Array.from(allMeals).join(' / ') || 'meals';

  const guideStr = guide.guideType
    .replace('-Speaking', '-speaking')
    .replace('Chauffeur Guide', 'chauffeur guide');

  const dep = terms.dep;
  const bal = Math.round((100 - dep) * 100) / 100;
  const totalUsd = pricingBreakdown.usd;
  const depAmtVal = Math.round(totalUsd * dep) / 100;
  const balAmtVal = Math.round((totalUsd - depAmtVal) * 100) / 100;

  const validUntilDate = new Date(Date.now() + (terms.valid || 14) * 864e5).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return {
    days,
    nights: nightCount,
    vehicle,
    hotels: hotelsStr,
    meals: mealsStr,
    guide: guideStr,
    water: pricing.waterQty || 100,
    validUntil: validUntilDate,
    validDays: terms.valid || 14,
    dep,
    bal,
    depAmt: depAmtVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    balAmt: balAmtVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  };
}

export function replaceTemplateVars(text: string, vars: TemplateVariables): string {
  return text.replace(/\{(\w+)\}/g, (match, key: keyof TemplateVariables) => {
    if (key in vars) {
      return String(vars[key]);
    }
    return match;
  });
}

export const PAYMENT_SCHEDULE_TEMPLATE =
  'Payment Schedule: {dep}% deposit — USD {depAmt} upon confirmation  |  {bal}% balance — USD {balAmt} before arrival in Sri Lanka';
