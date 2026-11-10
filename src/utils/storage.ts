import {
  CompanyDetails,
  CustomerDetails,
  CustomerRecord,
  DatabaseBackup,
  DEFAULT_COMPANY,
  DEFAULT_ENTRANCE_TICKETS,
  DEFAULT_TERMS,
  EntranceTicketCatalogItem,
  LogoData,
  PartnerHotel,
  SavedQuotation,
  TermsConfig,
  VOYA_LANKA_PARTNER_HOTELS
} from '../types';

const STORAGE_KEYS = {
  QUOTES: 'ceylon_travel_saved_quotations',
  DRAFT: 'ceylon_travel_saved_quotations_draft',
  LOGO: 'ceylon_travel_saved_quotations_logo',
  COMPANY: 'ceylon_travel_saved_quotations_co',
  TERMS: 'ceylon_travel_saved_quotations_tc',
  CUSTOM_PARTNERS: 'voya_lanka_custom_partner_hotels',
  ACTIVE_PARTNERS: 'voya_lanka_active_partner_hotels',
  CUSTOMERS: 'voya_lanka_customer_database',
  TICKETS: 'voya_lanka_entrance_tickets_catalog'
};

export function loadSavedQuotes(): SavedQuotation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.QUOTES);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load saved quotes:', err);
    return [];
  }
}

export function saveQuotesList(quotes: SavedQuotation[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(quotes));
  } catch (err) {
    console.error('Failed to save quotes list:', err);
  }
}

export function saveSingleQuote(quote: SavedQuotation): SavedQuotation[] {
  const current = loadSavedQuotes();
  const existingIdx = current.findIndex(q => q.id === quote.id);
  let updated: SavedQuotation[];
  if (existingIdx >= 0) {
    updated = [quote, ...current.filter(q => q.id !== quote.id)];
  } else {
    updated = [quote, ...current];
  }
  saveQuotesList(updated);

  // Automatically save/update the customer in the Customer Database
  if (quote.customer && quote.customer.custName?.trim()) {
    upsertCustomerFromQuote(quote.customer, quote.id);
  }

  return updated;
}

export function deleteSavedQuote(id: string): SavedQuotation[] {
  const current = loadSavedQuotes();
  const filtered = current.filter(q => q.id !== id);
  saveQuotesList(filtered);
  return filtered;
}

export function clearAllSavedQuotes(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.QUOTES);
  } catch (err) {
    console.error('Failed to clear saved quotes:', err);
  }
}

export function loadDraftQuote(): any | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DRAFT);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load draft:', err);
    return null;
  }
}

export function saveDraftQuote(draftData: any): void {
  try {
    localStorage.setItem(STORAGE_KEYS.DRAFT, JSON.stringify(draftData));
  } catch (err) {
    console.error('Failed to save draft:', err);
  }
}

export function loadCompanyDetails(): CompanyDetails {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.COMPANY);
    if (!raw) return DEFAULT_COMPANY;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_COMPANY, ...parsed };
  } catch (err) {
    console.error('Failed to load company details:', err);
    return DEFAULT_COMPANY;
  }
}

export function saveCompanyDetails(details: CompanyDetails): void {
  try {
    localStorage.setItem(STORAGE_KEYS.COMPANY, JSON.stringify(details));
  } catch (err) {
    console.error('Failed to save company details:', err);
  }
}

export function loadLogo(): LogoData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.LOGO);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load logo:', err);
    return null;
  }
}

export function saveLogo(logo: LogoData | null): void {
  try {
    if (logo) {
      localStorage.setItem(STORAGE_KEYS.LOGO, JSON.stringify(logo));
    } else {
      localStorage.removeItem(STORAGE_KEYS.LOGO);
    }
  } catch (err) {
    console.error('Failed to save logo:', err);
  }
}

export function loadTermsConfig(): TermsConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TERMS);
    if (!raw) return DEFAULT_TERMS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_TERMS, ...parsed };
  } catch (err) {
    console.error('Failed to load terms config:', err);
    return DEFAULT_TERMS;
  }
}

export function saveTermsConfig(terms: TermsConfig | null): void {
  try {
    if (terms) {
      localStorage.setItem(STORAGE_KEYS.TERMS, JSON.stringify(terms));
    } else {
      localStorage.removeItem(STORAGE_KEYS.TERMS);
    }
  } catch (err) {
    console.error('Failed to save terms config:', err);
  }
}

export function loadCustomPartnerHotels(): PartnerHotel[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOM_PARTNERS);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load custom partner hotels:', err);
    return [];
  }
}

export function saveCustomPartnerHotels(hotels: PartnerHotel[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_PARTNERS, JSON.stringify(hotels));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('voya_partner_hotels_updated'));
    }
  } catch (err) {
    console.error('Failed to save custom partner hotels:', err);
  }
}

const ACTIVE_PARTNERS_KEY = 'voya_lanka_active_partner_hotels';

export function getAllPartnerHotels(): PartnerHotel[] {
  try {
    const raw = localStorage.getItem(ACTIVE_PARTNERS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load active partner hotels:', err);
  }

  // First time initialization: combine any previously saved custom hotels with default predefined hotels
  const custom = loadCustomPartnerHotels();
  const seen = new Set<string>();
  const combined: PartnerHotel[] = [];

  for (const h of custom) {
    const key = `${(h.name || '').toLowerCase().trim()}|${(h.destination || '').toLowerCase().trim()}`;
    if (key !== '|' && !seen.has(key)) {
      seen.add(key);
      combined.push(h);
    }
  }

  for (const h of VOYA_LANKA_PARTNER_HOTELS) {
    const key = `${(h.name || '').toLowerCase().trim()}|${(h.destination || '').toLowerCase().trim()}`;
    if (key !== '|' && !seen.has(key)) {
      seen.add(key);
      combined.push(h);
    }
  }

  saveAllPartnerHotels(combined);
  return combined;
}

export function saveAllPartnerHotels(hotels: PartnerHotel[]): void {
  try {
    localStorage.setItem(ACTIVE_PARTNERS_KEY, JSON.stringify(hotels));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('voya_partner_hotels_updated'));
    }
  } catch (err) {
    console.error('Failed to save active partner hotels:', err);
  }
}

export function addPartnerHotel(hotel: PartnerHotel): { success: boolean; message: string; hotels: PartnerHotel[] } {
  const trimmedName = (hotel.name || '').trim();
  const trimmedDest = (hotel.destination || '').trim();
  const category = (hotel.category || '4-Star Premium').trim();

  if (!trimmedName) {
    return { success: false, message: 'Hotel name is required.', hotels: getAllPartnerHotels() };
  }
  if (!trimmedDest) {
    return { success: false, message: 'Destination / City is required.', hotels: getAllPartnerHotels() };
  }

  const all = getAllPartnerHotels();
  const exists = all.some(
    h => h.name.toLowerCase() === trimmedName.toLowerCase() &&
         h.destination.toLowerCase() === trimmedDest.toLowerCase()
  );

  if (exists) {
    return {
      success: false,
      message: `"${trimmedName} - ${trimmedDest}" already exists in the partner directory.`,
      hotels: all
    };
  }

  const newHotel: PartnerHotel = {
    name: trimmedName,
    destination: trimmedDest,
    category
  };
  const updated = [newHotel, ...all];
  saveAllPartnerHotels(updated);
  return {
    success: true,
    message: `Partner hotel "${trimmedName} - ${trimmedDest}" added successfully!`,
    hotels: updated
  };
}

export function updatePartnerHotel(
  original: PartnerHotel,
  updated: PartnerHotel
): { success: boolean; message: string; hotels: PartnerHotel[] } {
  const trimmedName = (updated.name || '').trim();
  const trimmedDest = (updated.destination || '').trim();
  const category = (updated.category || '4-Star Premium').trim();

  if (!trimmedName) {
    return { success: false, message: 'Hotel name is required.', hotels: getAllPartnerHotels() };
  }
  if (!trimmedDest) {
    return { success: false, message: 'Destination / City is required.', hotels: getAllPartnerHotels() };
  }

  const all = getAllPartnerHotels();
  const collision = all.some(
    h =>
      !(h.name.toLowerCase() === original.name.toLowerCase().trim() &&
        h.destination.toLowerCase() === original.destination.toLowerCase().trim()) &&
      h.name.toLowerCase() === trimmedName.toLowerCase() &&
      h.destination.toLowerCase() === trimmedDest.toLowerCase()
  );

  if (collision) {
    return {
      success: false,
      message: `Another partner hotel named "${trimmedName} - ${trimmedDest}" already exists.`,
      hotels: all
    };
  }

  const newHotelList = all.map(h => {
    if (
      h.name.toLowerCase() === original.name.toLowerCase().trim() &&
      h.destination.toLowerCase() === original.destination.toLowerCase().trim()
    ) {
      return { name: trimmedName, destination: trimmedDest, category };
    }
    return h;
  });

  saveAllPartnerHotels(newHotelList);
  return {
    success: true,
    message: `Partner hotel updated to "${trimmedName} - ${trimmedDest}"!`,
    hotels: newHotelList
  };
}

export function deletePartnerHotel(hotel: { name: string; destination: string }): {
  success: boolean;
  message: string;
  hotels: PartnerHotel[];
} {
  const all = getAllPartnerHotels();
  const updated = all.filter(
    h =>
      !(
        h.name.toLowerCase() === hotel.name.toLowerCase().trim() &&
        h.destination.toLowerCase() === hotel.destination.toLowerCase().trim()
      )
  );
  saveAllPartnerHotels(updated);
  return {
    success: true,
    message: `Removed "${hotel.name}" from partner directory.`,
    hotels: updated
  };
}

export function restoreDefaultPartnerHotels(): {
  success: boolean;
  message: string;
  hotels: PartnerHotel[];
} {
  saveAllPartnerHotels(VOYA_LANKA_PARTNER_HOTELS);
  return {
    success: true,
    message: `Restored ${VOYA_LANKA_PARTNER_HOTELS.length} default Voya Lanka partner hotels.`,
    hotels: VOYA_LANKA_PARTNER_HOTELS
  };
}

// Backward-compatibility wrappers
export function addCustomPartnerHotel(hotel: PartnerHotel) {
  return addPartnerHotel(hotel);
}

export function deleteCustomPartnerHotel(name: string, destination: string): PartnerHotel[] {
  return deletePartnerHotel({ name, destination }).hotels;
}

// ==========================================
// Entrance Tickets & Activities Catalog
// ==========================================

export function loadTicketCatalog(): EntranceTicketCatalogItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TICKETS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure all items have priceUsd
        return parsed.map(item => {
          const priceUsd =
            item.priceUsd !== undefined
              ? item.priceUsd
              : Math.round((item.priceLkr || 0) / 305) || 10;
          return {
            ...item,
            priceUsd,
            priceLkr: item.priceLkr || Math.round(priceUsd * 305)
          };
        });
      }
    }
  } catch (err) {
    console.error('Failed to load tickets catalog:', err);
  }

  // Initialize with DEFAULT_ENTRANCE_TICKETS
  saveTicketCatalog(DEFAULT_ENTRANCE_TICKETS);
  return DEFAULT_ENTRANCE_TICKETS;
}

export function saveTicketCatalog(items: EntranceTicketCatalogItem[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TICKETS, JSON.stringify(items));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('voya_tickets_updated'));
    }
  } catch (err) {
    console.error('Failed to save tickets catalog:', err);
  }
}

export function addTicketCatalogItem(
  name: string,
  priceUsd: number,
  category: string = 'Attraction / Activity',
  priceLkr?: number
): { success: boolean; message: string; items: EntranceTicketCatalogItem[] } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { success: false, message: 'Ticket or activity name is required.', items: loadTicketCatalog() };
  }
  const current = loadTicketCatalog();
  const exists = current.some(t => t.name.toLowerCase() === trimmed.toLowerCase());
  if (exists) {
    return { success: false, message: `"${trimmed}" is already in the ticket list.`, items: current };
  }

  const pUsd = Math.max(0, Math.round(priceUsd));
  const pLkr = priceLkr !== undefined ? priceLkr : Math.round(pUsd * 305);

  const newItem: EntranceTicketCatalogItem = {
    id: 'tkt_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
    name: trimmed,
    priceUsd: pUsd,
    priceLkr: pLkr,
    category
  };

  const updated = [newItem, ...current];
  saveTicketCatalog(updated);
  return { success: true, message: `Added "${trimmed}" ($${pUsd} USD) to ticket dropdown!`, items: updated };
}

export function updateTicketCatalogItem(
  id: string,
  fields: { name?: string; priceUsd?: number; category?: string; priceLkr?: number }
): { success: boolean; message: string; items: EntranceTicketCatalogItem[] } {
  const current = loadTicketCatalog();
  const index = current.findIndex(t => t.id === id);
  if (index === -1) {
    return { success: false, message: 'Ticket item not found.', items: current };
  }

  const existing = current[index];
  const trimmedName = fields.name !== undefined ? fields.name.trim() : existing.name;
  if (!trimmedName) {
    return { success: false, message: 'Ticket name cannot be empty.', items: current };
  }

  const collision = current.some(
    t => t.id !== id && t.name.toLowerCase() === trimmedName.toLowerCase()
  );
  if (collision) {
    return { success: false, message: `Another ticket named "${trimmedName}" already exists.`, items: current };
  }

  const pUsd = fields.priceUsd !== undefined ? Math.max(0, Math.round(fields.priceUsd)) : existing.priceUsd;
  const pLkr = fields.priceLkr !== undefined ? fields.priceLkr : Math.round(pUsd * 305);

  const updatedItem: EntranceTicketCatalogItem = {
    ...existing,
    name: trimmedName,
    priceUsd: pUsd,
    priceLkr: pLkr,
    category: fields.category !== undefined ? fields.category : existing.category
  };

  const updatedList = [...current];
  updatedList[index] = updatedItem;
  saveTicketCatalog(updatedList);
  return { success: true, message: `Updated "${trimmedName}" ($${pUsd} USD)!`, items: updatedList };
}

export function deleteTicketCatalogItem(id: string): {
  success: boolean;
  message: string;
  items: EntranceTicketCatalogItem[];
} {
  const current = loadTicketCatalog();
  const target = current.find(t => t.id === id);
  const updated = current.filter(t => t.id !== id);
  saveTicketCatalog(updated);
  return {
    success: true,
    message: `Removed "${target?.name || 'Item'}" from ticket directory.`,
    items: updated
  };
}

export function restoreDefaultTicketCatalog(): {
  success: boolean;
  message: string;
  items: EntranceTicketCatalogItem[];
} {
  saveTicketCatalog(DEFAULT_ENTRANCE_TICKETS);
  return {
    success: true,
    message: `Restored ${DEFAULT_ENTRANCE_TICKETS.length} default attraction tickets.`,
    items: DEFAULT_ENTRANCE_TICKETS
  };
}

// ==========================================
// Customer Database Management
// ==========================================

export function loadCustomers(): CustomerRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.CUSTOMERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load customers from storage:', err);
  }

  // If customer DB is empty, auto-populate from existing saved quotes
  const quotes = loadSavedQuotes();
  if (quotes.length === 0) return [];

  const customerMap = new Map<string, CustomerRecord>();
  for (const q of quotes) {
    const c = q.customer;
    if (!c || !c.custName?.trim()) continue;

    const key = (c.custEmail?.trim() || c.custPhone?.trim() || c.custName.trim()).toLowerCase();
    const existing = customerMap.get(key);

    if (existing) {
      if (!existing.quoteIds.includes(q.id)) {
        existing.quoteIds.push(q.id);
        existing.totalQuotes += 1;
      }
      if (q.savedAt && (!existing.lastQuotedDate || q.savedAt > existing.lastQuotedDate)) {
        existing.lastQuotedDate = q.savedAt;
      }
      if (!existing.phone && c.custPhone) existing.phone = c.custPhone.trim();
      if (!existing.email && c.custEmail) existing.email = c.custEmail.trim();
      if (!existing.country && c.custCountry) existing.country = c.custCountry.trim();
      if (!existing.notes && c.custNotes) existing.notes = c.custNotes.trim();
    } else {
      customerMap.set(key, {
        id: `cust_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        name: c.custName.trim(),
        email: (c.custEmail || '').trim(),
        phone: (c.custPhone || '').trim(),
        country: (c.custCountry || '').trim(),
        notes: (c.custNotes || '').trim(),
        createdDate: q.savedAt || new Date().toISOString(),
        lastQuotedDate: q.savedAt || new Date().toISOString(),
        totalQuotes: 1,
        quoteIds: [q.id]
      });
    }
  }

  const initialCustomers = Array.from(customerMap.values());
  if (initialCustomers.length > 0) {
    saveCustomers(initialCustomers);
  }
  return initialCustomers;
}

export function saveCustomers(customers: CustomerRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.CUSTOMERS, JSON.stringify(customers));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('voya_customers_updated'));
    }
  } catch (err) {
    console.error('Failed to save customers to storage:', err);
  }
}

export function upsertCustomerFromQuote(
  customer: CustomerDetails,
  quoteId?: string
): CustomerRecord[] {
  const trimmedName = (customer.custName || '').trim();
  if (!trimmedName) return loadCustomers();

  const current = loadCustomers();
  const trimmedEmail = (customer.custEmail || '').trim().toLowerCase();
  const trimmedPhone = (customer.custPhone || '').trim().replace(/\D/g, '');

  const existingIdx = current.findIndex(c => {
    if (trimmedEmail && c.email && c.email.trim().toLowerCase() === trimmedEmail) return true;
    if (trimmedPhone && c.phone && c.phone.trim().replace(/\D/g, '') === trimmedPhone) return true;
    return c.name.trim().toLowerCase() === trimmedName.toLowerCase();
  });

  const now = new Date().toISOString();

  if (existingIdx >= 0) {
    const existing = { ...current[existingIdx] };
    existing.name = trimmedName;
    if (customer.custEmail?.trim()) existing.email = customer.custEmail.trim();
    if (customer.custPhone?.trim()) existing.phone = customer.custPhone.trim();
    if (customer.custCountry?.trim()) existing.country = customer.custCountry.trim();
    if (customer.custNotes?.trim()) existing.notes = customer.custNotes.trim();
    existing.lastQuotedDate = now;

    if (quoteId && !existing.quoteIds.includes(quoteId)) {
      existing.quoteIds = [quoteId, ...existing.quoteIds];
      existing.totalQuotes = existing.quoteIds.length;
    }

    const updated = [...current];
    updated[existingIdx] = existing;
    saveCustomers(updated);
    return updated;
  } else {
    const newRecord: CustomerRecord = {
      id: `cust_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: trimmedName,
      email: (customer.custEmail || '').trim(),
      phone: (customer.custPhone || '').trim(),
      country: (customer.custCountry || '').trim(),
      notes: (customer.custNotes || '').trim(),
      createdDate: now,
      lastQuotedDate: now,
      totalQuotes: quoteId ? 1 : 0,
      quoteIds: quoteId ? [quoteId] : []
    };
    const updated = [newRecord, ...current];
    saveCustomers(updated);
    return updated;
  }
}

export function saveSingleCustomer(record: CustomerRecord): CustomerRecord[] {
  const current = loadCustomers();
  const existingIdx = current.findIndex(c => c.id === record.id);
  let updated: CustomerRecord[];
  if (existingIdx >= 0) {
    updated = current.map(c => (c.id === record.id ? record : c));
  } else {
    updated = [record, ...current];
  }
  saveCustomers(updated);
  return updated;
}

export function deleteCustomer(id: string): CustomerRecord[] {
  const current = loadCustomers();
  const updated = current.filter(c => c.id !== id);
  saveCustomers(updated);
  return updated;
}

// ==========================================
// Comprehensive Database Backup & Restore
// ==========================================

export function getFullDatabaseBackup(): DatabaseBackup {
  return {
    version: '1.0',
    appName: 'Voya Lanka Tours',
    exportedAt: new Date().toISOString(),
    customers: loadCustomers(),
    savedQuotes: loadSavedQuotes(),
    partnerHotels: getAllPartnerHotels(),
    companyDetails: loadCompanyDetails(),
    termsConfig: loadTermsConfig(),
    logo: loadLogo()
  };
}

export function restoreFullDatabase(backup: DatabaseBackup): boolean {
  try {
    if (!backup || typeof backup !== 'object') {
      throw new Error('Invalid backup data format.');
    }

    if (Array.isArray(backup.customers)) {
      saveCustomers(backup.customers);
    }
    if (Array.isArray(backup.savedQuotes)) {
      saveQuotesList(backup.savedQuotes);
    }
    if (Array.isArray(backup.partnerHotels)) {
      saveAllPartnerHotels(backup.partnerHotels);
    }
    if (backup.companyDetails) {
      saveCompanyDetails(backup.companyDetails);
    }
    if (backup.termsConfig) {
      saveTermsConfig(backup.termsConfig);
    }
    if (backup.logo !== undefined) {
      saveLogo(backup.logo);
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('voya_customers_updated'));
      window.dispatchEvent(new CustomEvent('voya_partner_hotels_updated'));
      window.dispatchEvent(new CustomEvent('voya_quotes_updated'));
      window.dispatchEvent(new CustomEvent('voya_database_restored'));
    }

    return true;
  } catch (err) {
    console.error('Failed to restore database from backup:', err);
    return false;
  }
}

