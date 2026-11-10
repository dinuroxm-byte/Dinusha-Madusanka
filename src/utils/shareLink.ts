import LZString from 'lz-string';
import { ShareableQuotationData } from '../types';
import { formatLKR, formatUSD, numberToWords } from './calc';

/**
 * Generate a compact, URL-safe shareable web link containing the quotation data
 */
export function generateShareableLink(quoteData: ShareableQuotationData): string {
  try {
    // Strip heavy base64 logo if too large to keep link compact, or keep if small
    const dataToEncode: ShareableQuotationData = {
      ...quoteData,
      logoUrl: quoteData.logoUrl && quoteData.logoUrl.length > 50000 ? undefined : quoteData.logoUrl
    };

    const jsonString = JSON.stringify(dataToEncode);
    const compressed = LZString.compressToEncodedURIComponent(jsonString);

    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';

    return `${origin}${pathname}#quote=${compressed}`;
  } catch (err) {
    console.error('Failed to generate shareable link:', err);
    return '';
  }
}

/**
 * Parse quotation data from the current URL hash or query params
 */
export function parseShareableLink(): ShareableQuotationData | null {
  if (typeof window === 'undefined') return null;

  try {
    // 1. Check hash: #quote=...
    const hash = window.location.hash;
    if (hash && hash.includes('quote=')) {
      const match = hash.match(/quote=([^&]+)/);
      if (match && match[1]) {
        const decompressed = LZString.decompressFromEncodedURIComponent(match[1]);
        if (decompressed) {
          return JSON.parse(decompressed);
        }
      }
    }

    // 2. Check search params: ?quote=...
    const params = new URLSearchParams(window.location.search);
    const quoteParam = params.get('quote');
    if (quoteParam) {
      const decompressed = LZString.decompressFromEncodedURIComponent(quoteParam);
      if (decompressed) {
        return JSON.parse(decompressed);
      }
    }
  } catch (err) {
    console.error('Failed to parse shareable quotation from URL:', err);
  }

  return null;
}

/**
 * Clean phone number for WhatsApp wa.me links
 * Strips whitespace, dashes, brackets, and leading zero if international prefix needed
 */
export function cleanWhatsAppPhone(phone: string): string {
  let cleaned = (phone || '').replace(/[^0-9]/g, '');
  if (!cleaned) return '';

  // If starts with 0 and 10 digits (common in Sri Lanka or UK local numbers), replace leading 0 with 94 or default
  if (cleaned.startsWith('0') && cleaned.length === 10) {
    // Default to Sri Lanka +94 if local 10-digit number
    cleaned = '94' + cleaned.slice(1);
  }

  return cleaned;
}

/**
 * Generate a beautifully structured WhatsApp proposal summary message
 */
export function generateWhatsAppMessage(
  quoteData: ShareableQuotationData,
  shareableUrl: string
): string {
  const c = quoteData.customer;
  const p = quoteData.pax;
  const b = quoteData.breakdown;
  const comp = quoteData.company;

  const totalNights = Math.max(0, p.days - 1);
  const totalPax = p.adults + p.child12 + p.child5;

  // Stays & hotels summary
  const hotelSummaries: string[] = [];
  if (quoteData.nights && quoteData.nights.length > 0) {
    quoteData.nights.forEach(n => {
      n.rooms.forEach(r => {
        if (r.hotel && !hotelSummaries.includes(r.hotel)) {
          hotelSummaries.push(r.hotel);
        }
      });
    });
  }

  const hotelText =
    hotelSummaries.length > 0
      ? hotelSummaries.slice(0, 4).join(' • ') +
        (hotelSummaries.length > 4 ? ` (+${hotelSummaries.length - 4} more)` : '')
      : 'Selected Premium Partner Hotels';

  const travelDateText = c.travelDate
    ? new Date(c.travelDate + 'T00:00:00').toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      })
    : 'Upcoming Travel Dates';

  const clientGreeting = c.custName ? `Dear *${c.custName}*,` : 'Dear Valued Traveler,';

  const shownTickets = (quoteData.others || []).filter(o => o.showInQuotation !== false);

  const showUsd = quoteData.pricing.showUsd !== false;
  const showLkr = quoteData.pricing.showLkr !== false;

  const totalNumStr = showUsd && showLkr
    ? `*${formatUSD(b.usd)}* (approx. ${formatLKR(b.fin)})`
    : showUsd
    ? `*${formatUSD(b.usd)}*`
    : `*${formatLKR(b.fin)}*`;

  const ppNumStr = showUsd && showLkr
    ? `*${formatUSD(b.ppUSD)}* / person (${formatLKR(b.ppLKR)} / person)`
    : showUsd
    ? `*${formatUSD(b.ppUSD)}* / person`
    : `*${formatLKR(b.ppLKR)}* / person`;

  const wordsList: string[] = [];
  if (showUsd) wordsList.push(`${numberToWords(b.usd, 'USD')}`);
  if (showLkr) wordsList.push(`${numberToWords(b.fin, 'LKR')}`);

  const groupWordsList: string[] = [];
  if (showUsd) groupWordsList.push(`${numberToWords(b.ppUSD, 'USD')} per person`);
  if (showLkr) groupWordsList.push(`${numberToWords(b.ppLKR, 'LKR')} per person`);

  const pricingLines: string[] = p.isGroup
    ? [
        `💰 *INVESTMENT & PRICING:*`,
        `• *Group Tour Rate (Per Person):* ${ppNumStr}`,
        `• *Rate in Words:* ${groupWordsList.join('  |  ')}`,
        `• *Group Size:* ${totalPax} Travelers (${p.adults} Adults${p.child12 > 0 ? `, ${p.child12} Children` : ''})`
      ]
    : [
        `💰 *INVESTMENT & PRICING:*`,
        `• *Total Package:* ${totalNumStr}`,
        `• *Amount in Words:* ${wordsList.join('  |  ')}`,
        `• *Per Person Rate:* ${ppNumStr}`
      ];

  const lines = [
    `🌴 *VOYA LANKA TOURS (PVT) LTD.* 🇱🇰`,
    `*Personalized Sri Lanka Tour Proposal & Itinerary*`,
    ``,
    `${clientGreeting}`,
    ``,
    `Thank you for reaching out to Voya Lanka Tours (Pvt) Ltd.! We are delighted to share your tailored travel proposal.`,
    ``,
    `📋 *TOUR SUMMARY:*`,
    `• *Quotation Ref:* ${c.qno || quoteData.id}`,
    `• *Duration:* ${p.days} Days / ${totalNights} Nights`,
    `• *Travel Date:* ${travelDateText}`,
    `• *Travelers:* ${p.adults} Adults${p.child12 > 0 ? `, ${p.child12} Children` : ''}${p.child5 > 0 ? `, ${p.child5} Infants` : ''} (${totalPax} Pax)`,
    `• *Vehicle:* ${quoteData.transport.vehicleType || 'Private Air-Conditioned Vehicle'} with Chauffeur Guide`,
    ``,
    `🏨 *KEY STAYS & DESTINATIONS:*`,
    `• ${hotelText}`,
    ``,
    ...(shownTickets.length > 0
      ? [
          `🎟️ *INCLUDED ENTRANCE TICKETS & ACTIVITIES:*`,
          `• ${shownTickets
            .map(t => {
              const rate = quoteData.pricing.usdRate || 305;
              const unitUsd =
                t.unitPriceUsd !== undefined
                  ? t.unitPriceUsd
                  : t.unitPrice
                  ? Math.round((t.unitPrice / rate) * 100) / 100
                  : Math.round((t.cost / rate) * 100) / 100;
              const totalUsd = Math.round(unitUsd * (t.qty ?? 1));
              const qtyStr = t.qty && t.qty > 1 ? ` (${t.qty}x)` : '';
              const priceStr = t.showPriceInQuotation !== false ? ` [$${totalUsd} USD]` : '';
              return `${t.name}${qtyStr}${priceStr}`;
            })
            .join(', ')}`,
          ``
        ]
      : []),
    ...pricingLines,
    ``,
    `🌐 *VIEW YOUR INTERACTIVE PROPOSAL & DAY-BY-DAY ITINERARY ONLINE:*`,
    `${shareableUrl}`,
    ``,
    `✨ *Includes:* Private transport, dedicated English-speaking chauffeur-guide, fuel & highway tolls, selected accommodations, and 24/7 on-ground assistance.`,
    ``,
    `Please click the link above to review your detailed day-by-day itinerary and photos. Feel free to reply here if you'd like to adjust any dates or hotels!`,
    ``,
    `Warm regards,`,
    `*Voya Lanka Tours (Pvt) Ltd.*`,
    `📞 ${comp.phone || '+94 77 021 6300'}`,
    `✉️ ${comp.email || 'info@voyalankatours.com'}`,
    `🌐 ${comp.website || 'www.voyalankatours.com'}`
  ];

  return lines.join('\n');
}

/**
 * Open WhatsApp with prefilled message
 */
export function openWhatsAppDirect(phone: string, message: string): void {
  const cleanPhone = cleanWhatsAppPhone(phone);
  const encodedText = encodeURIComponent(message);

  let url: string;
  if (cleanPhone) {
    url = `https://wa.me/${cleanPhone}?text=${encodedText}`;
  } else {
    // If no phone number, open WhatsApp Web / app with just the message
    url = `https://api.whatsapp.com/send?text=${encodedText}`;
  }

  if (typeof window !== 'undefined') {
    window.open(url, '_blank');
  }
}
