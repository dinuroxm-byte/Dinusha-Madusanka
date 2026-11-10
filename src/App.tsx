import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccommodationSection } from './components/AccommodationSection';
import { ChargesSection } from './components/ChargesSection';
import { CompanyModal } from './components/CompanyModal';
import { CustomerDatabaseModal } from './components/CustomerDatabaseModal';
import { CustomerSection } from './components/CustomerSection';
import { DatabaseBackupModal } from './components/DatabaseBackupModal';
import { GuideSection } from './components/GuideSection';
import { Header } from './components/Header';
import { ItineraryModal } from './components/ItineraryModal';
import { OnlineProposalView } from './components/OnlineProposalView';
import { PaxSection } from './components/PaxSection';
import { PricingSidebar } from './components/PricingSidebar';
import { PrintModal } from './components/PrintModal';
import { SavedModal } from './components/SavedModal';
import { TermsSection } from './components/TermsSection';
import { TransportationSection } from './components/TransportationSection';
import { VoucherModal } from './components/VoucherModal';
import { WhatsAppShareModal } from './components/WhatsAppShareModal';
import {
  CompanyDetails,
  CustomerDetails,
  CustomerRecord,
  DEFAULT_COMPANY,
  DEFAULT_TERMS,
  GuideDetails,
  HOTELS,
  IT_CLOSE,
  IT_GREET,
  ItineraryData,
  LogoData,
  NightConfig,
  OtherCharge,
  PaxDetails,
  PricingConfig,
  SavedQuotation,
  ShareableQuotationData,
  TermsConfig,
  TransportDetails
} from './types';
import {
  computePricing,
  formatLKR,
  formatUSD,
  generateQuoteId,
  getTemplateVariables
} from './utils/calc';
import { buildExcelWorkbookBlob } from './utils/excelExport';
import {
  downloadBlob,
  generateItineraryPDF,
  generateQuotationPDF,
  generateVoucherPDF,
  QuoteExportData,
  VoucherNightData
} from './utils/pdfExport';
import { parseShareableLink } from './utils/shareLink';
import {
  clearAllSavedQuotes,
  deleteSavedQuote,
  getFullDatabaseBackup,
  loadCompanyDetails,
  loadCustomers,
  loadDraftQuote,
  loadLogo,
  loadSavedQuotes,
  loadTermsConfig,
  saveCompanyDetails,
  saveDraftQuote,
  saveLogo,
  saveSingleQuote,
  saveTermsConfig,
  upsertCustomerFromQuote
} from './utils/storage';

export function createDefaultNights(count: number, existing?: NightConfig[]): NightConfig[] {
  const result: NightConfig[] = [];
  for (let i = 0; i < count; i++) {
    if (existing && existing[i]) {
      result.push({
        ...existing[i],
        nightNumber: i + 1
      });
    } else {
      result.push({
        nightNumber: i + 1,
        rooms: [
          {
            id: 'r_' + (i + 1) + '_' + Math.random().toString(36).substr(2, 4),
            hotel: HOTELS[i % HOTELS.length],
            category: '4-Star Premium',
            meal: 'Half-Board',
            bedType: 'Double (DBL)',
            roomCategory: 'Standard Room',
            roomView: 'Garden View',
            cost: 28000
          }
        ]
      });
    }
  }
  return result;
}

export function createDefaultItinerary(daysCount: number, nights: NightConfig[]): ItineraryData {
  const days = [];
  for (let i = 0; i < daysCount; i++) {
    const isLast = i === daysCount - 1;
    const nightRoom = nights[i]?.rooms?.[0];
    const hotelStay = nightRoom ? nightRoom.hotel.replace(/\s+-\s+/, ', ') : '';
    days.push({
      title: isLast ? 'Airport Departure' : `Scenic Exploration Day ${i + 1}`,
      acts: isLast
        ? 'Breakfast at hotel. Leisure morning, shopping in Negombo/Colombo, followed by transfer to Bandaranaike International Airport (CMB) for departure.'
        : `Morning excursion, cultural sightseeing, temple visit, scenic photography stops, and transfer to overnight stay.`,
      stay: isLast ? 'Departure' : hotelStay || 'Partner Hotel'
    });
  }
  return {
    greeting: IT_GREET,
    closing: IT_CLOSE,
    days
  };
}

export default function App() {
  // 1. Core State - Default App Mode: Empty Details when launched
  const [customer, setCustomer] = useState<CustomerDetails>({
    qno: generateQuoteId(),
    custName: '',
    custEmail: '',
    custPhone: '',
    custCountry: '',
    travelDate: '',
    custNotes: ''
  });

  const [pax, setPax] = useState<PaxDetails>({
    adults: 0,
    child12: 0,
    child5: 0,
    days: 0,
    isGroup: false
  });

  const [nights, setNights] = useState<NightConfig[]>([]);

  const [transport, setTransport] = useState<TransportDetails>({
    vehicleType: '',
    vRate: 0,
    fuelKm: 0,
    fuelAvg: 0,
    fuelPrice: 0,
    drvDay: 0
  });

  const [guide, setGuide] = useState<GuideDetails>({
    guideType: '',
    guideFee: 0,
    crewRoom: 0
  });

  const [pricing, setPricing] = useState<PricingConfig>({
    usdRate: 305,
    toll: 0,
    waterQty: 0,
    markup: 0,
    discType: 'pct',
    discVal: 0,
    showUsd: true,
    showLkr: true
  });

  const [others, setOthers] = useState<OtherCharge[]>([]);

  const [terms, setTerms] = useState<TermsConfig>(DEFAULT_TERMS);
  const [itinerary, setItinerary] = useState<ItineraryData>({ greeting: '', closing: '', days: [] });
  const [company, setCompany] = useState<CompanyDetails>(DEFAULT_COMPANY);
  const [logo, setLogo] = useState<LogoData | null>(null);
  const [savedQuotes, setSavedQuotes] = useState<SavedQuotation[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [vconf, setVconf] = useState<Record<number, string>>({});

  // Real-time automatic recalculation when manual USD rate changes
  const handleUsdRateChange = useCallback((newRate: number) => {
    const validRate = newRate > 0 ? newRate : 305;
    setPricing(prev => ({ ...prev, usdRate: validRate }));
    setNights(prevNights =>
      prevNights.map(night => ({
        ...night,
        rooms: night.rooms.map(r => {
          if (r.costUsd !== undefined && r.costUsd > 0) {
            return {
              ...r,
              cost: Math.round(r.costUsd * validRate)
            };
          }
          return r;
        })
      }))
    );
    setOthers(prevOthers =>
      prevOthers.map(o => {
        if (o.unitPriceUsd !== undefined && o.unitPriceUsd > 0) {
          const upLkr = Math.round(o.unitPriceUsd * validRate);
          const q = o.qty || 1;
          return {
            ...o,
            unitPrice: upLkr,
            cost: Math.round(upLkr * q)
          };
        } else if (o.unitPrice !== undefined && o.unitPrice > 0) {
          return {
            ...o,
            unitPriceUsd: Math.round((o.unitPrice / validRate) * 100) / 100
          };
        }
        return o;
      })
    );
  }, []);

  // 2. UI Modals & Online View State
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isItineraryModalOpen, setIsItineraryModalOpen] = useState(false);
  const [isVoucherModalOpen, setIsVoucherModalOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);
  const [isCustomerDbModalOpen, setIsCustomerDbModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isPreviewProposalOpen, setIsPreviewProposalOpen] = useState(false);
  const [sharedProposalData, setSharedProposalData] = useState<ShareableQuotationData | null>(null);

  const [activeVoucherNight, setActiveVoucherNight] = useState<number | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const isInitialized = useRef(false);
  const draftTimer = useRef<any>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);



  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  useEffect(() => {
    const handleToastEvent = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        showToast(customEvent.detail);
      }
    };
    window.addEventListener('voya_show_toast', handleToastEvent);
    return () => window.removeEventListener('voya_show_toast', handleToastEvent);
  }, [showToast]);

  // Check URL on mount for shareable proposal link
  useEffect(() => {
    const shared = parseShareableLink();
    if (shared) {
      setSharedProposalData(shared);
    }
  }, []);

  // Reload data on database restore or customer updates
  const reloadAllDataFromStorage = useCallback(() => {
    setSavedQuotes(loadSavedQuotes());
    setCustomers(loadCustomers());
    setCompany(loadCompanyDetails());
    const l = loadLogo();
    if (l) setLogo(l);
    setTerms(loadTermsConfig());
  }, []);

  useEffect(() => {
    window.addEventListener('voya_customers_updated', reloadAllDataFromStorage);
    window.addEventListener('voya_database_restored', reloadAllDataFromStorage);
    return () => {
      window.removeEventListener('voya_customers_updated', reloadAllDataFromStorage);
      window.removeEventListener('voya_database_restored', reloadAllDataFromStorage);
    };
  }, [reloadAllDataFromStorage]);

  // Load storage once on mount
  useEffect(() => {
    try {
      const storedQuotes = loadSavedQuotes();
      setSavedQuotes(storedQuotes);

      const storedCusts = loadCustomers();
      setCustomers(storedCusts);

      const storedCompany = loadCompanyDetails();
      setCompany(storedCompany);

      const storedLogo = loadLogo();
      if (storedLogo) setLogo(storedLogo);

      const storedTerms = loadTermsConfig();
      setTerms(storedTerms);

      // Per requirement: default app mode on launch is empty fillable details.
      // Saved quotations can be loaded anytime from the Saved Quotes repository.
    } catch (err) {
      console.error('Initialization error:', err);
    } finally {
      isInitialized.current = true;
    }
  }, []);

  // Auto-save draft debounce
  useEffect(() => {
    if (!isInitialized.current) return;
    if (draftTimer.current) clearTimeout(draftTimer.current);

    draftTimer.current = setTimeout(() => {
      const draftData = {
        customer,
        pax,
        transport,
        guide,
        pricing,
        others,
        nights,
        terms,
        itinerary,
        vconf
      };
      saveDraftQuote(draftData);
    }, 700);

    return () => {
      if (draftTimer.current) clearTimeout(draftTimer.current);
    };
  }, [customer, pax, transport, guide, pricing, others, nights, terms, itinerary, vconf]);

  // Compute pricing breakdown
  const breakdown = useMemo(() => {
    return computePricing(pax, nights, transport, guide, pricing, others);
  }, [pax, nights, transport, guide, pricing, others]);

  // Bundle active quotation for sharing
  const currentShareableData: ShareableQuotationData = useMemo(() => {
    return {
      id: customer.qno,
      createdAt: new Date().toISOString(),
      customer,
      pax,
      transport,
      guide,
      pricing,
      others,
      nights,
      terms,
      itinerary,
      breakdown,
      company,
      logoUrl: logo?.data
    };
  }, [customer, pax, transport, guide, pricing, others, nights, terms, itinerary, breakdown, company, logo]);

  // Template variables for terms
  const templateVars = useMemo(() => {
    return getTemplateVariables(
      customer,
      pax,
      nights,
      transport,
      guide,
      pricing,
      terms,
      breakdown
    );
  }, [customer, pax, nights, transport, guide, pricing, terms, breakdown]);

  // Handler: Days changed in Pax
  const handleDaysChange = (newDays: number) => {
    const validDays = Math.max(0, newDays);
    const targetNights = Math.max(0, validDays > 0 ? validDays - 1 : 0);
    setPax(prev => ({ ...prev, days: validDays }));

    setNights(prevNights => {
      if (validDays === 0 || targetNights === 0) {
        setItinerary(prevItin => ({
          greeting: prevItin?.greeting || '',
          closing: prevItin?.closing || '',
          days: []
        }));
        return [];
      }

      const updated = createDefaultNights(targetNights, prevNights);
      setItinerary(prevItin => {
        const days = [];
        for (let i = 0; i < validDays; i++) {
          const isLast = i === validDays - 1;
          const nightRoom = updated[i]?.rooms?.[0];
          const hotelStay = nightRoom ? nightRoom.hotel.replace(/\s+-\s+/, ', ') : '';
          const existingDay = prevItin?.days?.[i];

          if (existingDay && !existingDay.auto) {
            days.push({
              ...existingDay,
              stay: isLast ? 'Departure' : existingDay.stay || hotelStay || 'Partner Hotel'
            });
          } else {
            days.push({
              title: isLast ? 'Airport Departure' : `Scenic Exploration Day ${i + 1}`,
              acts: isLast
                ? 'Breakfast at hotel. Leisure morning, shopping in Negombo/Colombo, followed by transfer to Bandaranaike International Airport (CMB) for departure.'
                : `Morning excursion, cultural sightseeing, temple visit, scenic photography stops, and transfer to overnight stay.`,
              stay: isLast ? 'Departure' : hotelStay || 'Partner Hotel',
              auto: true
            });
          }
        }
        return {
          greeting: prevItin?.greeting || IT_GREET,
          closing: prevItin?.closing || IT_CLOSE,
          days
        };
      });
      return updated;
    });
  };

  // Handler: Nights changed directly
  const handleNightsChange = (newNights: NightConfig[], newDays?: number) => {
    setNights(newNights);
    if (newDays !== undefined) {
      setPax(prev => ({ ...prev, days: newDays }));
    }
    setItinerary(prevItin => {
      const updatedDays = (prevItin?.days || []).map((day, idx) => {
        const isLast = idx === (prevItin?.days || []).length - 1;
        if (isLast) return day;
        const nightRoom = newNights[idx]?.rooms?.[0];
        const hotelStay = nightRoom ? nightRoom.hotel.replace(/\s+-\s+/, ', ') : '';
        if (day.auto || !day.stay) {
          return { ...day, stay: hotelStay || day.stay };
        }
        return day;
      });
      return {
        greeting: prevItin?.greeting || IT_GREET,
        closing: prevItin?.closing || IT_CLOSE,
        days: updatedDays
      };
    });
  };

  // Handler: Set all rooms to Half-Board
  const handleSetAllHalfBoard = () => {
    const updated = nights.map(n => ({
      ...n,
      rooms: n.rooms.map(r => ({ ...r, meal: 'Half-Board' }))
    }));
    setNights(updated);
    showToast('All hotel rooms set to Half-Board');
  };

  // Handler: Regenerate Quote ID
  const handleRegenerateId = () => {
    const newId = generateQuoteId();
    setCustomer(prev => ({ ...prev, qno: newId }));
    showToast(`Generated new Quotation ID: ${newId}`);
  };

  // Handler: Load Demo Tour
  const handleLoadDemo = () => {
    const demoDays = 6;
    const demoNightsCount = 5;
    const newNights: NightConfig[] = [
      {
        nightNumber: 1,
        rooms: [
          {
            id: 'r_d1',
            hotel: 'Aliya Resort & Spa - Sigiriya',
            category: '4-Star Premium',
            meal: 'Half-Board',
            bedType: 'Double (DBL)',
            roomCategory: 'Deluxe Room',
            roomView: 'Garden View',
            cost: 32000
          }
        ]
      },
      {
        nightNumber: 2,
        rooms: [
          {
            id: 'r_d2',
            hotel: 'Heritance Kandalama - Dambulla',
            category: '5-Star Luxury',
            meal: 'Half-Board',
            bedType: 'Double (DBL)',
            roomCategory: 'Superior Room',
            roomView: 'Lake View',
            cost: 45000
          }
        ]
      },
      {
        nightNumber: 3,
        rooms: [
          {
            id: 'r_d3',
            hotel: 'Cinnamon Citadel - Kandy',
            category: '4-Star Premium',
            meal: 'Half-Board',
            bedType: 'Double (DBL)',
            roomCategory: 'Superior Room',
            roomView: 'River View',
            cost: 29000
          }
        ]
      },
      {
        nightNumber: 4,
        rooms: [
          {
            id: 'r_d4',
            hotel: 'Grand Hotel - Nuwara Eliya',
            category: '4-Star Premium',
            meal: 'Half-Board',
            bedType: 'Double (DBL)',
            roomCategory: 'Deluxe Room',
            roomView: 'Garden View',
            cost: 38000
          }
        ]
      },
      {
        nightNumber: 5,
        rooms: [
          {
            id: 'r_d5',
            hotel: 'Cinnamon Bentota Beach - Bentota',
            category: '5-Star Luxury',
            meal: 'Half-Board',
            bedType: 'Double (DBL)',
            roomCategory: 'Premium Ocean Room',
            roomView: 'Sea View',
            cost: 52000
          }
        ]
      }
    ];

    setCustomer({
      qno: generateQuoteId(),
      custName: 'Alexander & Sarah Wright',
      custEmail: 'alex.wright@voyagetravel.co.uk',
      custPhone: '+44 7911 123456',
      custCountry: 'United Kingdom',
      travelDate: '2026-11-15',
      custNotes: 'Honeymooners. Prefer quiet upper floor rooms, lake/ocean views, vegetarian breakfast.'
    });

    setPax({
      adults: 2,
      child12: 0,
      child5: 0,
      days: demoDays
    });

    setNights(newNights);

    setTransport({
      vehicleType: 'Luxury air-conditioned tourist van',
      vRate: 24000,
      fuelKm: 980,
      fuelAvg: 10,
      fuelPrice: 370,
      drvDay: 3500
    });

    setGuide({
      guideType: 'Private English-Speaking Chauffeur Guide',
      guideFee: 4500,
      crewRoom: 3000
    });

    setPricing({
      usdRate: 305,
      toll: 7500,
      waterQty: 120,
      markup: 15,
      discType: 'usd',
      discVal: 50,
      showUsd: true,
      showLkr: true
    });

    setOthers([
      { id: 'o_d1', name: 'Sigiriya Rock Fortress VIP Passes', cost: 16000, unitPrice: 16000, unitPriceUsd: 52, qty: 1, showInQuotation: true, showPriceInQuotation: true, isTicket: true },
      { id: 'o_d2', name: 'Kandy Cultural Dance Tickets', cost: 6000, unitPrice: 6000, unitPriceUsd: 20, qty: 1, showInQuotation: true, showPriceInQuotation: true, isTicket: true },
      { id: 'o_d3', name: 'Scenic Tea Train Tickets (Kandy - Nanu Oya)', cost: 12000, unitPrice: 12000, unitPriceUsd: 39, qty: 1, showInQuotation: true, showPriceInQuotation: true, isTicket: true }
    ]);

    setItinerary({
      greeting: IT_GREET,
      closing: IT_CLOSE,
      days: [
        {
          title: 'Arrival CMB Airport & Transfer to Sigiriya Cultural Triangle',
          acts: 'Warm welcome by Voya Lanka Tours representative with fresh orchid garlands. Scenic drive to Sigiriya through Kurunegala coconut plantations. Evening visit to Dambulla Golden Cave Temple UNESCO complex.',
          stay: 'Aliya Resort & Spa, Sigiriya'
        },
        {
          title: 'Sigiriya Lion Rock Fortress & Village Culinary Experience',
          acts: 'Early morning climb of the iconic 5th-century Sigiriya Rock Fortress. Traditional bullock cart and catamaran lake ride in Hiriwadunna village with authentic Sri Lankan clay-pot lunch. Afternoon relax by the pool overlooking rock views.',
          stay: 'Heritance Kandalama, Dambulla'
        },
        {
          title: 'Dambulla to Sacred City of Kandy via Spice Sanctuary',
          acts: 'Drive south to Kandy via Matale spice gardens. Visit the Temple of the Sacred Tooth Relic (Sri Dalada Maligawa) and stroll around the scenic Kandy Lake. Witness an evening Kandyan traditional drumming and fire-walking cultural show.',
          stay: 'Cinnamon Citadel, Kandy'
        },
        {
          title: 'Scenic Highlands Journey: Kandy to Nuwara Eliya "Little England"',
          acts: 'Breathtaking drive or scenic train journey winding through emerald tea valleys and Ramboda Falls. Guided tour of a functioning colonial tea factory with pure Ceylon tea tasting. Stroll through Gregory Lake and Victoria Park.',
          stay: 'Grand Hotel, Nuwara Eliya'
        },
        {
          title: 'Highlands to Tropical Golden Beaches of Bentota',
          acts: 'Descend through Kitulgala white-water river valleys to the Indian Ocean coast. Check-in at luxury beach resort. Afternoon river safari along the Madu River mangrove tunnels and visit to Kosgoda Sea Turtle Conservation project.',
          stay: 'Cinnamon Bentota Beach, Bentota'
        },
        {
          title: 'Colombo City Tour & Bandaranaike International Airport Departure',
          acts: 'Leisurely beachfront breakfast. Scenic drive to Colombo via Southern Expressway. Brief city orientation tour: Independence Square, Gangaramaya Temple, and shopping at Barefoot/ODEL. Transfer to CMB airport for return flight.',
          stay: 'Departure'
        }
      ]
    });

    showToast('Demo tour itinerary loaded!');
  };

  // Handler: Reset to Empty Details
  const handleReset = () => {
    setCustomer({
      qno: generateQuoteId(),
      custName: '',
      custEmail: '',
      custPhone: '',
      custCountry: '',
      travelDate: '',
      custNotes: ''
    });
    setPax({ adults: 0, child12: 0, child5: 0, days: 0, isGroup: false });
    setNights([]);
    setTransport({
      vehicleType: '',
      vRate: 0,
      fuelKm: 0,
      fuelAvg: 0,
      fuelPrice: 0,
      drvDay: 0
    });
    setGuide({
      guideType: '',
      guideFee: 0,
      crewRoom: 0
    });
    setPricing(prev => ({
      ...prev,
      toll: 0,
      waterQty: 0,
      markup: 0,
      discType: 'pct',
      discVal: 0,
      showUsd: true,
      showLkr: true
    }));
    setOthers([]);
    setTerms(DEFAULT_TERMS);
    setItinerary({ greeting: '', closing: '', days: [] });
    setVconf({});
    try {
      localStorage.removeItem('voya_lanka_draft_v2');
    } catch (_) {}
    showToast('Quotation details cleared to empty state.');
  };

  // Handler: Save Quotation Record
  const handleSaveQuote = () => {
    const record: SavedQuotation = {
      id: customer.qno,
      savedAt: new Date().toISOString(),
      customer: { ...customer },
      pax: { ...pax },
      transport: { ...transport },
      guide: { ...guide },
      pricing: { ...pricing },
      others: JSON.parse(JSON.stringify(others)),
      nights: JSON.parse(JSON.stringify(nights)),
      terms: { ...terms },
      itinerary: JSON.parse(JSON.stringify(itinerary)),
      vconf: { ...vconf },
      finLKR: formatLKR(breakdown.fin),
      finUSD: formatUSD(breakdown.usd),
      finLKRn: Math.round(breakdown.fin),
      finUSDn: Math.round(breakdown.usd * 100) / 100
    };

    const updated = saveSingleQuote(record);
    setSavedQuotes(updated);

    // Refresh customers list state
    setCustomers(loadCustomers());

    showToast(`Quotation ${record.id} saved to repository & customer updated!`);
  };

  // Handler: Save Customer Directly to CRM Database
  const handleSaveCustomerToCRM = () => {
    if (!customer.custName?.trim()) {
      showToast('Please enter a Customer Full Name before saving to CRM.');
      return;
    }
    upsertCustomerFromQuote(customer, customer.qno);
    setCustomers(loadCustomers());
    showToast(`Customer "${customer.custName.trim()}" saved to CRM Database!`);
  };

  // Handler: Load Saved Quote
  const handleLoadSavedQuote = (saved: SavedQuotation) => {
    setCustomer(saved.customer);
    setPax(saved.pax);
    setTransport(saved.transport);
    setGuide(saved.guide);
    setPricing(saved.pricing);
    setOthers(saved.others || []);
    setNights(saved.nights || []);
    if (saved.terms) setTerms(saved.terms);
    if (saved.itinerary) setItinerary(saved.itinerary);
    if (saved.vconf) setVconf(saved.vconf);
    setIsSavedModalOpen(false);
    showToast(`Loaded quotation ${saved.id}`);
  };

  // Handler: Delete Saved Quote
  const handleDeleteSavedQuote = (id: string) => {
    const updated = deleteSavedQuote(id);
    setSavedQuotes(updated);
    showToast('Quotation deleted.');
  };

  // Handler: Clear All Saved Quotes
  const handleClearAllQuotes = () => {
    clearAllSavedQuotes();
    setSavedQuotes([]);
    showToast('Saved history cleared.');
  };

  // Handler: Refresh Overnight Stays in Itinerary
  const handleRefreshOvernightStays = () => {
    setItinerary(prev => {
      const updatedDays = prev.days.map((day, idx) => {
        const isLast = idx === prev.days.length - 1;
        if (isLast) return { ...day, stay: 'Departure' };
        const targetRoom = nights[idx]?.rooms?.[0];
        const hotelName = targetRoom ? targetRoom.hotel.replace(/\s+-\s+/, ', ') : '';
        return {
          ...day,
          stay: hotelName || day.stay || 'Partner Hotel'
        };
      });
      return {
        ...prev,
        days: updatedDays
      };
    });
    showToast('Overnight stays refreshed from Accommodation cards!');
  };

  // Handler: Export Quotation PDF
  const handleDownloadPDF = () => {
    try {
      showToast('Generating quotation PDF...');
      const exportData: QuoteExportData = {
        customer,
        pax,
        nights,
        transport,
        guide,
        pricing,
        others,
        terms,
        pricingBreakdown: breakdown,
        company,
        logo
      };
      const blob = generateQuotationPDF(exportData);
      const filename = `Voya_Lanka_Quotation_${customer.qno || 'Draft'}.pdf`;
      downloadBlob(blob, filename);
      showToast(`Quotation PDF saved: ${filename}`);
    } catch (err) {
      console.error('PDF generation error:', err);
      showToast('Could not generate PDF. Please try again.');
    }
  };

  // Handler: Export Excel Workbook
  const handleExportExcel = async () => {
    try {
      showToast('Generating Excel workbook (.xlsx)...');
      const exportData: QuoteExportData = {
        customer,
        pax,
        nights,
        transport,
        guide,
        pricing,
        others,
        terms,
        pricingBreakdown: breakdown,
        company,
        logo
      };
      const blob = await buildExcelWorkbookBlob(
        exportData,
        itinerary,
        vconf,
        savedQuotes
      );
      const filename = `Voya_Lanka_Quotation_${customer.qno || 'Draft'}.xlsx`;
      downloadBlob(blob, filename);
      showToast(`Excel workbook saved: ${filename}`);
    } catch (err) {
      console.error('Excel export error:', err);
      showToast('Could not generate Excel file.');
    }
  };

  // Handler: Export Room Voucher PDF
  const handleExportVoucher = (nightNumbers: number[], confirmedBy: string) => {
    if (!activeVoucherNight) return;
    try {
      const activeIdx = activeVoucherNight - 1;
      const targetNight = nights[activeIdx];
      const activeRoom = targetNight?.rooms?.[0];
      const hotelRaw = activeRoom ? activeRoom.hotel : 'Hotel Partner';

      const voucherNightsData: VoucherNightData[] = nightNumbers.map(num => ({
        nightNumber: num,
        rooms: nights[num - 1]?.rooms || []
      }));

      const totalNightsCount = Math.max(0, pax.days - 1);

      const blob = generateVoucherPDF(
        hotelRaw,
        voucherNightsData,
        totalNightsCount,
        customer,
        pax,
        company,
        confirmedBy,
        logo,
        pricing.usdRate || 305
      );

      const filename = `Voya_Lanka_Room_Voucher_Nights_${nightNumbers.join('_')}_${customer.qno || 'Draft'}.pdf`;
      downloadBlob(blob, filename);

      setVconf(prev => {
        const updated = { ...prev };
        nightNumbers.forEach(n => {
          updated[n] = confirmedBy;
        });
        return updated;
      });

      setIsVoucherModalOpen(false);

      const toastMsg =
        nightNumbers.length > 1
          ? `Consolidated Voucher (${nightNumbers.length} Nights) downloaded: ${filename}`
          : `Room Voucher downloaded: ${filename}`;

      showToast(toastMsg);
    } catch (err) {
      console.error('Voucher export error:', err);
      showToast('Could not generate voucher PDF.');
    }
  };

  // Handler: Export Itinerary PDF
  const handleExportItineraryPDF = () => {
    try {
      showToast('Generating Itinerary PDF...');
      const exportData: QuoteExportData = {
        customer,
        pax,
        nights,
        transport,
        guide,
        pricing,
        others,
        terms,
        pricingBreakdown: breakdown,
        company,
        logo
      };
      const blob = generateItineraryPDF(itinerary, exportData);
      const filename = `Voya_Lanka_Itinerary_${customer.qno || 'Draft'}.pdf`;
      downloadBlob(blob, filename);
      showToast('Tour Itinerary PDF saved!');
    } catch (err) {
      console.error('Itinerary PDF error:', err);
      showToast('Could not generate Itinerary PDF.');
    }
  };

  const handleSaveTermsAsDefault = () => {
    saveTermsConfig(terms);
    showToast('Terms & Payment conditions saved as default for future quotations.');
  };

  const handleResetTermsToStandard = () => {
    setTerms(DEFAULT_TERMS);
    saveTermsConfig(DEFAULT_TERMS);
    showToast('Standard terms restored.');
  };

  // Compute active night data for Room Voucher modal
  const activeNightData = useMemo(() => {
    if (!activeVoucherNight) return { hotelName: '', sameHotelNights: [] as number[] };
    const activeIdx = activeVoucherNight - 1;
    const targetNight = nights[activeIdx];
    const activeRoom = targetNight?.rooms?.[0];
    const hotelName = activeRoom ? activeRoom.hotel : '';

    const sameHotelNights: number[] = [];
    nights.forEach(n => {
      const r = n.rooms[0];
      if (r && r.hotel.trim().toLowerCase() === hotelName.trim().toLowerCase()) {
        sameHotelNights.push(n.nightNumber);
      }
    });

    return { hotelName, sameHotelNights };
  }, [activeVoucherNight, nights]);

  // If viewing online client proposal via shared link
  if (sharedProposalData) {
    return (
      <OnlineProposalView
        data={sharedProposalData}
        onBackToEditor={() => {
          setSharedProposalData(null);
          if (window.location.hash.includes('quote=')) {
            window.history.replaceState(null, '', window.location.pathname);
          }
        }}
        showToast={showToast}
      />
    );
  }

  // If previewing online proposal view from generator
  if (isPreviewProposalOpen) {
    return (
      <OnlineProposalView
        data={currentShareableData}
        onBackToEditor={() => setIsPreviewProposalOpen(false)}
        showToast={showToast}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-sky-500 selection:text-white pb-24">
      {/* Top Navigation & Controls */}
      <Header
        logo={logo}
        savedCount={savedQuotes.length}
        customerCount={customers.length}
        onOpenItinerary={() => setIsItineraryModalOpen(true)}
        onOpenSaved={() => setIsSavedModalOpen(true)}
        onOpenCustomers={() => setIsCustomerDbModalOpen(true)}
        onOpenBackup={() => setIsBackupModalOpen(true)}
        onOpenWhatsAppShare={() => setIsWhatsAppModalOpen(true)}
        onPreviewOnlineProposal={() => setIsPreviewProposalOpen(true)}
        onLoadDemo={handleLoadDemo}
        onReset={handleReset}
        onOpenCompany={() => setIsCompanyModalOpen(true)}
        onDownloadPDF={handleDownloadPDF}
        onExportExcel={handleExportExcel}
        onPrint={() => setIsPrintModalOpen(true)}
        onLogoUpload={newLogo => {
          setLogo(newLogo);
          saveLogo(newLogo);
          showToast('Company logo updated and saved!');
        }}
        onLogoRemove={() => {
          setLogo(null);
          saveLogo(null);
          showToast('Logo removed.');
        }}
      />

      {/* Main Workspace Layout */}
      <main className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Sections (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Customer & Traveler Details */}
          <CustomerSection
            customer={customer}
            usdRate={pricing.usdRate}
            customerCount={customers.length}
            onCustomerChange={fields => setCustomer(prev => ({ ...prev, ...fields }))}
            onUsdRateChange={handleUsdRateChange}
            onRegenerateId={handleRegenerateId}
            onOpenCustomerDb={() => setIsCustomerDbModalOpen(true)}
            onSaveToDatabase={handleSaveCustomerToCRM}
            onShareWhatsApp={() => setIsWhatsAppModalOpen(true)}
          />

          {/* Section 2: Pax, Group Size & Tour Duration */}
          <PaxSection
            pax={pax}
            onPaxChange={fields => setPax(prev => ({ ...prev, ...fields }))}
            onDaysChange={handleDaysChange}
          />

          {/* Section 3: Accommodation Breakdown & Room Vouchers */}
          <AccommodationSection
            nights={nights}
            days={pax.days}
            travelDate={customer.travelDate}
            usdRate={pricing.usdRate || 305}
            onNightsChange={handleNightsChange}
            onOpenVoucher={nightNum => {
              setActiveVoucherNight(nightNum);
              setIsVoucherModalOpen(true);
            }}
            onSetAllHalfBoard={handleSetAllHalfBoard}
            showToast={showToast}
          />

          {/* Section 4: Vehicle, Mileage & Transport Costing */}
          <TransportationSection
            transport={transport}
            days={pax.days}
            onTransportChange={fields => setTransport(prev => ({ ...prev, ...fields }))}
          />

          {/* Section 5: Guide Services */}
          <GuideSection
            guide={guide}
            days={pax.days}
            onGuideChange={fields => setGuide(prev => ({ ...prev, ...fields }))}
          />

          {/* Section 6: Toll & Other Charges */}
          <ChargesSection
            pricing={pricing}
            others={others}
            onPricingChange={fields => {
              if (fields.usdRate !== undefined) {
                handleUsdRateChange(fields.usdRate);
              } else {
                setPricing(prev => ({ ...prev, ...fields }));
              }
            }}
            onOthersChange={updatedOthers => setOthers(updatedOthers)}
            showToast={showToast}
          />

          {/* Section 7: Terms, Inclusions & Payment */}
          <TermsSection
            terms={terms}
            templateVars={templateVars}
            onTermsChange={fields => setTerms(prev => ({ ...prev, ...fields }))}
            onResetStandard={handleResetTermsToStandard}
            onSaveAsDefault={handleSaveTermsAsDefault}
          />
        </div>

        {/* Right Column: Sticky Pricing Engine (4 Cols) */}
        <div className="lg:col-span-4">
          <PricingSidebar
            pricing={pricing}
            breakdown={breakdown}
            isGroup={pax.isGroup}
            onPricingChange={fields => {
              if (fields.usdRate !== undefined) {
                handleUsdRateChange(fields.usdRate);
              } else {
                setPricing(prev => ({ ...prev, ...fields }));
              }
            }}
            onSaveQuote={handleSaveQuote}
            onDownloadPDF={handleDownloadPDF}
            onPrintQuote={() => setIsPrintModalOpen(true)}
            onExportExcel={handleExportExcel}
            onShareWhatsApp={() => setIsWhatsAppModalOpen(true)}
            onPreviewOnlineProposal={() => setIsPreviewProposalOpen(true)}
          />
        </div>
      </main>

      {/* Modals */}
      <SavedModal
        isOpen={isSavedModalOpen}
        savedQuotes={savedQuotes}
        onClose={() => setIsSavedModalOpen(false)}
        onLoadQuote={handleLoadSavedQuote}
        onDeleteQuote={handleDeleteSavedQuote}
        onClearAll={handleClearAllQuotes}
      />

      <CustomerDatabaseModal
        isOpen={isCustomerDbModalOpen}
        onClose={() => setIsCustomerDbModalOpen(false)}
        onSelectCustomer={selectedFields => {
          setCustomer(prev => ({ ...prev, ...selectedFields }));
        }}
        showToast={showToast}
      />

      <DatabaseBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        showToast={showToast}
      />

      <WhatsAppShareModal
        isOpen={isWhatsAppModalOpen}
        quoteData={currentShareableData}
        onClose={() => setIsWhatsAppModalOpen(false)}
        showToast={showToast}
      />

      <CompanyModal
        isOpen={isCompanyModalOpen}
        company={company}
        onClose={() => setIsCompanyModalOpen(false)}
        onSave={updatedCo => {
          setCompany(updatedCo);
          saveCompanyDetails(updatedCo);
          showToast('Company details saved!');
        }}
      />

      <ItineraryModal
        isOpen={isItineraryModalOpen}
        itinerary={itinerary}
        customer={customer}
        pax={pax}
        nights={nights}
        onClose={() => setIsItineraryModalOpen(false)}
        onItineraryChange={updatedItin => setItinerary(updatedItin)}
        onRefreshOvernightStays={handleRefreshOvernightStays}
        onSaveWithQuotation={handleSaveQuote}
        onExportItineraryPDF={handleExportItineraryPDF}
      />

      <VoucherModal
        isOpen={isVoucherModalOpen}
        nightNumber={activeVoucherNight}
        hotelName={activeNightData.hotelName}
        nightsWithSameHotel={activeNightData.sameHotelNights}
        initialConfirmedBy={activeVoucherNight ? vconf[activeVoucherNight] || '' : ''}
        travelDate={customer.travelDate}
        onClose={() => setIsVoucherModalOpen(false)}
        onExport={handleExportVoucher}
      />

      <PrintModal
        isOpen={isPrintModalOpen}
        customer={customer}
        pax={pax}
        nights={nights}
        transport={transport}
        guide={guide}
        pricing={pricing}
        others={others}
        breakdown={breakdown}
        company={company}
        logo={logo}
        onClose={() => setIsPrintModalOpen(false)}
        onTriggerPrint={() => {
          window.print();
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl z-50 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 duration-200">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
