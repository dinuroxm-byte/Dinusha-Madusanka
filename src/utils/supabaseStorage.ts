import { isSupabaseConfigured, supabase } from '../lib/supabase';
import {
  CompanyDetails,
  CustomerDetails,
  CustomerRecord,
  DEFAULT_COMPANY,
  DEFAULT_ENTRANCE_TICKETS,
  DEFAULT_TERMS,
  EntranceTicketCatalogItem,
  LogoData,
  PartnerHotel,
  SavedQuotation,
  TermsConfig,
  UserProfile,
  UserRole,
  VOYA_LANKA_PARTNER_HOTELS
} from '../types';

// ==========================================
// 1. User Profiles & Role-Based Access
// ==========================================

export async function fetchUserProfile(userId: string): Promise<UserProfile | null> {
  if (!isSupabaseConfigured()) {
    // Local / unconfigured fallback: default admin profile for preview
    return {
      id: userId,
      email: 'admin@voyalankatours.com',
      fullName: 'Voya Lanka Administrator',
      role: 'ADMIN'
    };
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching user profile:', error.message);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name,
      role: (data.role as UserRole) || 'STAFF',
      createdAt: data.created_at
    };
  } catch (err) {
    console.error('Failed to fetch user profile:', err);
    return null;
  }
}

export async function fetchAllStaffProfiles(): Promise<UserProfile[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, role, created_at')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching staff list:', error.message);
      throw error;
    }

    return (data || []).map(p => ({
      id: p.id,
      email: p.email,
      fullName: p.full_name,
      role: p.role as UserRole,
      createdAt: p.created_at
    }));
  } catch (err) {
    console.error('Failed to fetch staff list:', err);
    return [];
  }
}

export async function adminCreateStaffAccount(params: {
  email: string;
  password: string;
  fullName: string;
  role: UserRole;
}): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      message: 'Supabase is not configured yet. Please configure VITE_SUPABASE_URL in .env.'
    };
  }

  try {
    // Call the security definer database function created in the SQL setup
    const { data, error } = await supabase.rpc('admin_create_staff_user', {
      new_email: params.email.trim(),
      new_password: params.password,
      new_full_name: params.fullName.trim(),
      new_role: params.role
    });

    if (error) {
      console.error('admin_create_staff_user RPC error:', error);
      return { success: false, message: error.message };
    }

    return {
      success: true,
      message: `Staff account created successfully for ${params.fullName} (${params.email}).`
    };
  } catch (err: any) {
    console.error('Failed to create staff account:', err);
    return { success: false, message: err.message || 'Could not create staff account.' };
  }
}

// ==========================================
// 2. Company Settings & Legal Terms
// ==========================================

export interface SharedCompanySettings {
  company: CompanyDetails;
  terms: TermsConfig;
  logo: LogoData | null;
}

export async function fetchCompanySettings(): Promise<SharedCompanySettings> {
  if (!isSupabaseConfigured()) {
    return {
      company: DEFAULT_COMPANY,
      terms: DEFAULT_TERMS,
      logo: null
    };
  }

  try {
    const { data, error } = await supabase
      .from('company_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle();

    if (error) {
      console.warn('Error fetching company settings:', error.message);
      return { company: DEFAULT_COMPANY, terms: DEFAULT_TERMS, logo: null };
    }

    if (!data) {
      // First-time initialization of singleton row
      return { company: DEFAULT_COMPANY, terms: DEFAULT_TERMS, logo: null };
    }

    const company: CompanyDetails = {
      name: data.name || DEFAULT_COMPANY.name,
      address: data.address || DEFAULT_COMPANY.address,
      phone: data.phone || DEFAULT_COMPANY.phone,
      email: data.email || DEFAULT_COMPANY.email,
      website: data.website || DEFAULT_COMPANY.website,
      reg: data.reg || DEFAULT_COMPANY.reg
    };

    let logo: LogoData | null = null;
    if (data.logo_data) {
      try {
        logo = typeof data.logo_data === 'string' && data.logo_data.startsWith('{')
          ? JSON.parse(data.logo_data)
          : { data: data.logo_data, w: 200, h: 80 };
      } catch (_) {
        logo = { data: data.logo_data, w: 200, h: 80 };
      }
    }

    const terms: TermsConfig = data.terms_config && Object.keys(data.terms_config).length > 0
      ? { ...DEFAULT_TERMS, ...data.terms_config }
      : DEFAULT_TERMS;

    return { company, terms, logo };
  } catch (err) {
    console.error('Failed to load company settings from Supabase:', err);
    return { company: DEFAULT_COMPANY, terms: DEFAULT_TERMS, logo: null };
  }
}

export async function updateCompanySettings(
  company: CompanyDetails,
  logo: LogoData | null,
  terms?: TermsConfig
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true, message: 'Settings saved locally.' };
  }

  try {
    const payload: any = {
      id: 1,
      name: company.name || DEFAULT_COMPANY.name,
      address: company.address || DEFAULT_COMPANY.address,
      phone: company.phone || DEFAULT_COMPANY.phone,
      email: company.email || DEFAULT_COMPANY.email,
      website: company.website || DEFAULT_COMPANY.website,
      reg: company.reg || DEFAULT_COMPANY.reg,
      logo_data: logo ? JSON.stringify(logo) : null,
      updated_at: new Date().toISOString()
    };

    if (terms) {
      payload.terms_config = terms;
    }

    const { error } = await supabase
      .from('company_settings')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Error updating company settings:', error);
      if (error.code === '42501' || error.message.includes('row-level security')) {
        return { success: false, message: 'Permission denied: Only administrators can modify company settings.' };
      }
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Company settings saved to cloud database.' };
  } catch (err: any) {
    console.error('Failed to update company settings:', err);
    return { success: false, message: err.message || 'Could not update company settings.' };
  }
}

// ==========================================
// 3. Quotations Management (Cloud)
// ==========================================

export async function fetchQuotations(): Promise<SavedQuotation[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('quotations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching quotations:', error.message);
      return [];
    }

    return (data || []).map(row => {
      const qd = row.quotation_data || {};
      return {
        id: row.id,
        savedAt: row.created_at,
        customer: qd.customer || {
          qno: row.id,
          custName: row.customer_name || '',
          custEmail: row.customer_email || '',
          custPhone: row.customer_phone || '',
          custCountry: row.customer_country || '',
          travelDate: row.travel_date || '',
          custNotes: ''
        },
        pax: qd.pax || { adults: row.adults || 2, child12: 0, child5: 0, days: row.days || 1 },
        transport: qd.transport || { vehicleType: '', vRate: 0, fuelKm: 0, fuelAvg: 0, fuelPrice: 0, drvDay: 0 },
        guide: qd.guide || { guideType: '', guideFee: 0, crewRoom: 0 },
        pricing: qd.pricing || { usdRate: 305, toll: 0, waterQty: 0, markup: 0, discType: 'pct', discVal: 0 },
        others: qd.others || [],
        nights: qd.nights || [],
        terms: qd.terms || DEFAULT_TERMS,
        itinerary: qd.itinerary || null,
        vconf: qd.vconf || {},
        finLKR: qd.finLKR || String(row.fin_lkr || 0),
        finUSD: qd.finUSD || String(row.fin_usd || 0),
        finLKRn: Number(row.fin_lkr) || qd.finLKRn || 0,
        finUSDn: Number(row.fin_usd) || qd.finUSDn || 0
      };
    });
  } catch (err) {
    console.error('Failed to load quotations from Supabase:', err);
    return [];
  }
}

export async function saveQuotationToCloud(
  quote: SavedQuotation,
  userProfile?: UserProfile | null
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true, message: 'Saved locally.' };
  }

  try {
    const quotePayload = {
      id: quote.id,
      customer_name: (quote.customer?.custName || 'Guest').trim(),
      customer_email: (quote.customer?.custEmail || '').trim(),
      customer_phone: (quote.customer?.custPhone || '').trim(),
      customer_country: (quote.customer?.custCountry || '').trim(),
      travel_date: quote.customer?.travelDate || '',
      days: Number(quote.pax?.days) || 1,
      adults: Number(quote.pax?.adults) || 2,
      fin_lkr: Number(quote.finLKRn) || 0,
      fin_usd: Number(quote.finUSDn) || 0,
      quotation_data: quote,
      created_by_name: userProfile?.fullName || 'Staff User',
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('quotations')
      .upsert(quotePayload, { onConflict: 'id' });

    if (error) {
      console.error('Error saving quotation to Supabase:', error);
      return { success: false, message: error.message };
    }

    // Automatically upsert customer in CRM database
    if (quote.customer && quote.customer.custName?.trim()) {
      await upsertCustomerFromQuoteCloud(quote.customer, quote.id);
    }

    return { success: true, message: `Quotation ${quote.id} saved to cloud database!` };
  } catch (err: any) {
    console.error('Failed to save quotation:', err);
    return { success: false, message: err.message || 'Could not save quotation.' };
  }
}

export async function deleteQuotationFromCloud(
  id: string
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true, message: 'Deleted locally.' };
  }

  try {
    const { error } = await supabase
      .from('quotations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting quotation from Supabase:', error);
      if (error.code === '42501' || error.message.includes('row-level security')) {
        return { success: false, message: 'Permission denied: Only administrators can delete quotation records.' };
      }
      return { success: false, message: error.message };
    }

    return { success: true, message: `Quotation ${id} deleted from cloud database.` };
  } catch (err: any) {
    console.error('Failed to delete quotation:', err);
    return { success: false, message: err.message || 'Could not delete quotation.' };
  }
}

export async function clearAllQuotationsFromCloud(): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured()) return { success: true, message: 'Cleared.' };

  try {
    const { error } = await supabase
      .from('quotations')
      .delete()
      .neq('id', '');

    if (error) {
      if (error.code === '42501' || error.message.includes('row-level security')) {
        return { success: false, message: 'Permission denied: Only administrators can clear quotations repository.' };
      }
      return { success: false, message: error.message };
    }

    return { success: true, message: 'All quotations cleared from cloud.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Failed to clear quotations.' };
  }
}

// ==========================================
// 4. Customer Database (CRM)
// ==========================================

export async function fetchCustomers(): Promise<CustomerRecord[]> {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .order('last_quoted_date', { ascending: false });

    if (error) {
      console.error('Error fetching customers:', error.message);
      return [];
    }

    return (data || []).map(row => ({
      id: row.id,
      name: row.name,
      email: row.email || '',
      phone: row.phone || '',
      country: row.country || '',
      notes: row.notes || '',
      createdDate: row.created_date,
      lastQuotedDate: row.last_quoted_date,
      totalQuotes: Number(row.total_quotes) || 0,
      quoteIds: Array.isArray(row.quote_ids) ? row.quote_ids : []
    }));
  } catch (err) {
    console.error('Failed to load customers from Supabase:', err);
    return [];
  }
}

export async function saveCustomerToCloud(
  customer: CustomerRecord
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true, message: 'Customer saved locally.' };
  }

  try {
    const payload = {
      id: customer.id,
      name: customer.name.trim(),
      email: (customer.email || '').trim(),
      phone: (customer.phone || '').trim(),
      country: (customer.country || '').trim(),
      notes: (customer.notes || '').trim(),
      total_quotes: customer.totalQuotes || 0,
      quote_ids: customer.quoteIds || [],
      last_quoted_date: customer.lastQuotedDate || new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('customers')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.error('Error saving customer:', error);
      return { success: false, message: error.message };
    }

    return { success: true, message: `Customer "${customer.name}" saved to CRM database.` };
  } catch (err: any) {
    console.error('Failed to save customer:', err);
    return { success: false, message: err.message || 'Could not save customer.' };
  }
}

export async function upsertCustomerFromQuoteCloud(
  customerDetails: CustomerDetails,
  quoteId: string
): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const trimmedName = (customerDetails.custName || '').trim();
  if (!trimmedName) return;

  try {
    const trimmedEmail = (customerDetails.custEmail || '').trim().toLowerCase();
    const trimmedPhone = (customerDetails.custPhone || '').trim();

    // Look for matching customer by email, phone, or exact name
    let query = supabase.from('customers').select('*');
    if (trimmedEmail) {
      query = query.eq('email', trimmedEmail);
    } else if (trimmedPhone) {
      query = query.eq('phone', trimmedPhone);
    } else {
      query = query.ilike('name', trimmedName);
    }

    const { data: matches } = await query.limit(1);
    const existing = matches?.[0];
    const now = new Date().toISOString();

    if (existing) {
      const existingQuoteIds = Array.isArray(existing.quote_ids) ? existing.quote_ids : [];
      const updatedQuoteIds = existingQuoteIds.includes(quoteId)
        ? existingQuoteIds
        : [quoteId, ...existingQuoteIds];

      await supabase
        .from('customers')
        .update({
          name: trimmedName,
          email: customerDetails.custEmail?.trim() || existing.email,
          phone: customerDetails.custPhone?.trim() || existing.phone,
          country: customerDetails.custCountry?.trim() || existing.country,
          notes: customerDetails.custNotes?.trim() || existing.notes,
          last_quoted_date: now,
          total_quotes: updatedQuoteIds.length,
          quote_ids: updatedQuoteIds,
          updated_at: now
        })
        .eq('id', existing.id);
    } else {
      const newId = `cust_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      await supabase
        .from('customers')
        .insert({
          id: newId,
          name: trimmedName,
          email: customerDetails.custEmail?.trim() || '',
          phone: customerDetails.custPhone?.trim() || '',
          country: customerDetails.custCountry?.trim() || '',
          notes: customerDetails.custNotes?.trim() || '',
          created_date: now,
          last_quoted_date: now,
          total_quotes: 1,
          quote_ids: [quoteId],
          updated_at: now
        });
    }
  } catch (err) {
    console.error('Error auto-upserting customer from quote:', err);
  }
}

export async function deleteCustomerFromCloud(
  id: string
): Promise<{ success: boolean; message: string }> {
  if (!isSupabaseConfigured()) {
    return { success: true, message: 'Deleted locally.' };
  }

  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);

    if (error) {
      if (error.code === '42501' || error.message.includes('row-level security')) {
        return { success: false, message: 'Permission denied: Only administrators can delete customer records.' };
      }
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Customer removed from CRM database.' };
  } catch (err: any) {
    return { success: false, message: err.message || 'Could not delete customer.' };
  }
}

// ==========================================
// 5. Partner Hotels (Cloud)
// ==========================================

export async function fetchPartnerHotels(): Promise<PartnerHotel[]> {
  if (!isSupabaseConfigured()) return VOYA_LANKA_PARTNER_HOTELS;

  try {
    const { data, error } = await supabase
      .from('partner_hotels')
      .select('name, destination, category')
      .order('destination', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching partner hotels:', error.message);
      return VOYA_LANKA_PARTNER_HOTELS;
    }

    if (!data || data.length === 0) {
      // Auto-seed default partner hotels if table is fresh
      await seedDefaultPartnerHotels();
      return VOYA_LANKA_PARTNER_HOTELS;
    }

    return data;
  } catch (err) {
    console.error('Failed to load partner hotels from Supabase:', err);
    return VOYA_LANKA_PARTNER_HOTELS;
  }
}

export async function seedDefaultPartnerHotels(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const rows = VOYA_LANKA_PARTNER_HOTELS.map(h => ({
      name: h.name,
      destination: h.destination,
      category: h.category
    }));
    await supabase.from('partner_hotels').upsert(rows, { onConflict: 'name,destination' });
  } catch (err) {
    console.warn('Could not seed partner hotels:', err);
  }
}

export async function addPartnerHotelToCloud(
  hotel: PartnerHotel
): Promise<{ success: boolean; message: string; hotels: PartnerHotel[] }> {
  const trimmedName = (hotel.name || '').trim();
  const trimmedDest = (hotel.destination || '').trim();
  const category = (hotel.category || '4-Star Premium').trim();

  if (!trimmedName || !trimmedDest) {
    return { success: false, message: 'Hotel name and destination are required.', hotels: await fetchPartnerHotels() };
  }

  if (!isSupabaseConfigured()) {
    return { success: true, message: 'Added locally.', hotels: VOYA_LANKA_PARTNER_HOTELS };
  }

  try {
    const { error } = await supabase
      .from('partner_hotels')
      .insert({
        name: trimmedName,
        destination: trimmedDest,
        category
      });

    if (error) {
      if (error.code === '23505') {
        return {
          success: false,
          message: `"${trimmedName} - ${trimmedDest}" already exists in partner directory.`,
          hotels: await fetchPartnerHotels()
        };
      }
      return { success: false, message: error.message, hotels: await fetchPartnerHotels() };
    }

    const updated = await fetchPartnerHotels();
    return { success: true, message: `Added "${trimmedName} - ${trimmedDest}" to partner directory!`, hotels: updated };
  } catch (err: any) {
    return { success: false, message: err.message, hotels: await fetchPartnerHotels() };
  }
}

export async function updatePartnerHotelInCloud(
  original: PartnerHotel,
  updated: PartnerHotel
): Promise<{ success: boolean; message: string; hotels: PartnerHotel[] }> {
  if (!isSupabaseConfigured()) {
    return { success: true, message: 'Updated locally.', hotels: VOYA_LANKA_PARTNER_HOTELS };
  }

  try {
    const { error } = await supabase
      .from('partner_hotels')
      .update({
        name: updated.name.trim(),
        destination: updated.destination.trim(),
        category: updated.category.trim()
      })
      .ilike('name', original.name.trim())
      .ilike('destination', original.destination.trim());

    if (error) {
      return { success: false, message: error.message, hotels: await fetchPartnerHotels() };
    }

    const refreshed = await fetchPartnerHotels();
    return { success: true, message: `Updated "${updated.name}"!`, hotels: refreshed };
  } catch (err: any) {
    return { success: false, message: err.message, hotels: await fetchPartnerHotels() };
  }
}

export async function deletePartnerHotelFromCloud(
  hotel: { name: string; destination: string }
): Promise<{ success: boolean; message: string; hotels: PartnerHotel[] }> {
  if (!isSupabaseConfigured()) {
    return { success: true, message: 'Deleted locally.', hotels: VOYA_LANKA_PARTNER_HOTELS };
  }

  try {
    const { error } = await supabase
      .from('partner_hotels')
      .delete()
      .ilike('name', hotel.name.trim())
      .ilike('destination', hotel.destination.trim());

    if (error) {
      if (error.code === '42501' || error.message.includes('row-level security')) {
        return {
          success: false,
          message: 'Permission denied: Only administrators can delete partner hotels.',
          hotels: await fetchPartnerHotels()
        };
      }
      return { success: false, message: error.message, hotels: await fetchPartnerHotels() };
    }

    const refreshed = await fetchPartnerHotels();
    return { success: true, message: `Removed "${hotel.name}" from partner directory.`, hotels: refreshed };
  } catch (err: any) {
    return { success: false, message: err.message, hotels: await fetchPartnerHotels() };
  }
}

export async function restoreDefaultPartnerHotelsCloud(): Promise<{
  success: boolean;
  message: string;
  hotels: PartnerHotel[];
}> {
  if (!isSupabaseConfigured()) {
    return { success: true, message: 'Restored default partner hotels.', hotels: VOYA_LANKA_PARTNER_HOTELS };
  }

  try {
    await seedDefaultPartnerHotels();
    const refreshed = await fetchPartnerHotels();
    return {
      success: true,
      message: `Restored default Voya Lanka partner hotels.`,
      hotels: refreshed
    };
  } catch (err: any) {
    return { success: false, message: err.message, hotels: await fetchPartnerHotels() };
  }
}

// ==========================================
// 6. Entrance Tickets & Activities
// ==========================================

export async function fetchEntranceTickets(): Promise<EntranceTicketCatalogItem[]> {
  if (!isSupabaseConfigured()) return DEFAULT_ENTRANCE_TICKETS;

  try {
    const { data, error } = await supabase
      .from('entrance_tickets')
      .select('id, name, price_usd, price_lkr, category')
      .order('sort_order', { ascending: true });

    if (error || !data || data.length === 0) {
      await seedDefaultTickets();
      return DEFAULT_ENTRANCE_TICKETS;
    }

    return data.map(d => ({
      id: d.id,
      name: d.name,
      priceUsd: Number(d.price_usd),
      priceLkr: Number(d.price_lkr),
      category: d.category
    }));
  } catch (err) {
    return DEFAULT_ENTRANCE_TICKETS;
  }
}

export async function seedDefaultTickets(): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    const rows = DEFAULT_ENTRANCE_TICKETS.map((t, idx) => ({
      id: t.id,
      name: t.name,
      price_usd: t.priceUsd,
      price_lkr: t.priceLkr || Math.round(t.priceUsd * 305),
      category: t.category || 'Attraction',
      sort_order: idx
    }));
    await supabase.from('entrance_tickets').upsert(rows, { onConflict: 'id' });
  } catch (_) {}
}

// ==========================================
// 7. User Draft Storage (Per-User Isolation)
// ==========================================

export async function fetchUserDraftFromCloud(userId: string): Promise<any | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('user_drafts')
      .select('draft_data')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return null;
    return data.draft_data;
  } catch (_) {
    return null;
  }
}

export async function saveUserDraftToCloud(userId: string, draftData: any): Promise<void> {
  if (!isSupabaseConfigured()) return;

  try {
    await supabase
      .from('user_drafts')
      .upsert({
        user_id: userId,
        draft_data: draftData,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id' });
  } catch (_) {}
}

export async function clearUserDraftInCloud(userId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  try {
    await supabase.from('user_drafts').delete().eq('user_id', userId);
  } catch (_) {}
}

// ==========================================
// 8. Real-time Multi-User Sync Listener
// ==========================================

export function subscribeToCloudChanges(callbacks: {
  onQuotationsChange?: () => void;
  onCustomersChange?: () => void;
  onHotelsChange?: () => void;
  onCompanySettingsChange?: () => void;
}) {
  if (!isSupabaseConfigured()) return () => {};

  const channel = supabase
    .channel('voya-lanka-live-updates')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'quotations' },
      () => {
        callbacks.onQuotationsChange?.();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'customers' },
      () => {
        callbacks.onCustomersChange?.();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'partner_hotels' },
      () => {
        callbacks.onHotelsChange?.();
      }
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'company_settings' },
      () => {
        callbacks.onCompanySettingsChange?.();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
