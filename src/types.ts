export interface RoomConfig {
  id: string;
  hotel: string;
  category: string;
  meal: string;
  bedType: string;
  roomCategory: string;
  roomView: string;
  cost: number;
  costUsd?: number;
}

export interface NightConfig {
  nightNumber: number;
  rooms: RoomConfig[];
}

export interface OtherCharge {
  id: string;
  name: string;
  cost: number;
  unitPrice?: number;
  unitPriceUsd?: number;
  qty?: number;
  showInQuotation?: boolean;
  showPriceInQuotation?: boolean;
  isTicket?: boolean;
}

export interface EntranceTicketCatalogItem {
  id: string;
  name: string;
  priceUsd: number;
  priceLkr?: number;
  category?: string;
}

export const DEFAULT_ENTRANCE_TICKETS: EntranceTicketCatalogItem[] = [
  { id: 'sigiriya', name: 'Sigiriya Rock Fortress Entrance Ticket', priceUsd: 36, priceLkr: 11000, category: 'Cultural & Heritage' },
  { id: 'dambulla', name: 'Dambulla Cave Temple Entrance Ticket', priceUsd: 10, priceLkr: 3000, category: 'Cultural & Heritage' },
  { id: 'tooth_temple', name: 'Temple of the Sacred Tooth Relic (Kandy)', priceUsd: 7, priceLkr: 2000, category: 'Cultural & Heritage' },
  { id: 'yala_safari', name: 'Yala National Park Safari Jeep & Entrance Ticket', priceUsd: 80, priceLkr: 25000, category: 'Wildlife Safari' },
  { id: 'polonnaruwa', name: 'Polonnaruwa Ancient City Ticket', priceUsd: 30, priceLkr: 9000, category: 'Cultural & Heritage' },
  { id: 'pinnawala', name: 'Pinnawala Elephant Orphanage Ticket', priceUsd: 15, priceLkr: 4500, category: 'Wildlife & Nature' },
  { id: 'horton_plains', name: 'Horton Plains National Park Ticket', priceUsd: 33, priceLkr: 10000, category: 'Nature & Trekking' },
  { id: 'botanical_gardens', name: 'Royal Botanical Gardens Peradeniya Ticket', priceUsd: 12, priceLkr: 3500, category: 'Nature & Gardens' },
  { id: 'minneriya', name: 'Minneriya Elephant Gathering Safari Ticket', priceUsd: 60, priceLkr: 18000, category: 'Wildlife Safari' },
  { id: 'whale_watching', name: 'Mirissa Whale Watching Excursion Ticket', priceUsd: 55, priceLkr: 16000, category: 'Marine Adventure' },
  { id: 'anuradhapura', name: 'Anuradhapura Sacred City Ticket', priceUsd: 30, priceLkr: 9000, category: 'Cultural & Heritage' },
  { id: 'tea_factory', name: 'Tea Factory & Tasting Tour Ticket', priceUsd: 7, priceLkr: 2000, category: 'Experience' }
];

export interface CustomerDetails {
  qno: string;
  custName: string;
  custEmail: string;
  custPhone: string;
  custCountry: string;
  travelDate: string;
  custNotes: string;
}

export interface PaxDetails {
  adults: number;
  child12: number;
  child5: number;
  days: number;
  isGroup?: boolean;
}

export interface TransportDetails {
  vehicleType: string;
  vRate: number;
  fuelKm: number;
  fuelAvg: number;
  fuelPrice: number;
  drvDay: number;
}

export interface GuideDetails {
  guideType: string;
  guideFee: number;
  crewRoom: number;
}

export interface PricingConfig {
  usdRate: number;
  toll: number;
  waterQty: number;
  markup: number;
  discType: 'pct' | 'lkr' | 'usd';
  discVal: number;
  showUsd?: boolean;
  showLkr?: boolean;
}

export interface TermsConfig {
  dep: number;
  valid: number;
  incl: string;
  excl: string;
  terms: string;
  thanks: string;
}

export interface CompanyDetails {
  name?: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  reg: string;
}

export interface ItineraryDay {
  title: string;
  acts: string;
  stay: string;
  auto?: boolean;
}

export interface ItineraryData {
  greeting: string;
  closing: string;
  days: ItineraryDay[];
}

export interface LogoData {
  data: string; // base64 data url
  w: number;
  h: number;
}

export interface PricingBreakdown {
  accom: number;
  veh: number;
  fuelLit: number;
  fuel: number;
  drv: number;
  guide: number;
  crew: number;
  toll: number;
  oth: number;
  sub: number;
  mk: number;
  pre: number;
  dAmt: number;
  fin: number;
  usd: number;
  pax: number;
  ppLKR: number;
  ppUSD: number;
}

export interface SavedQuotation {
  id: string;
  savedAt: string;
  customer: CustomerDetails;
  pax: PaxDetails;
  transport: TransportDetails;
  guide: GuideDetails;
  pricing: PricingConfig;
  others: OtherCharge[];
  nights: NightConfig[];
  terms: TermsConfig;
  itinerary: ItineraryData | null;
  vconf: Record<number, string>;
  finLKR: string;
  finUSD: string;
  finLKRn: number;
  finUSDn: number;
}

export interface PartnerHotel {
  name: string;
  destination: string;
  category: string;
}

export const VOYA_LANKA_PARTNER_HOTELS: PartnerHotel[] = [
  { name: "Heritance Kandalama", destination: "Dambulla", category: "5-Star Luxury" },
  { name: "Jetwing Vil Uyana", destination: "Sigiriya", category: "Boutique Villa" },
  { name: "Aliya Resort & Spa", destination: "Sigiriya", category: "4-Star Premium" },
  { name: "Cinnamon Lodge", destination: "Habarana", category: "5-Star Luxury" },
  { name: "Amaya Lake", destination: "Dambulla", category: "4-Star Premium" },
  { name: "Cinnamon Citadel", destination: "Kandy", category: "4-Star Premium" },
  { name: "Earl's Regency", destination: "Kandy", category: "5-Star Luxury" },
  { name: "Santani Wellness Resort", destination: "Kandy", category: "Boutique Villa" },
  { name: "The Golden Crown Hotel", destination: "Kandy", category: "5-Star Luxury" },
  { name: "Grand Hotel", destination: "Nuwara Eliya", category: "4-Star Premium" },
  { name: "Heritance Tea Factory", destination: "Nuwara Eliya", category: "5-Star Luxury" },
  { name: "Araliya Green Hills", destination: "Nuwara Eliya", category: "4-Star Premium" },
  { name: "Jetwing St. Andrew's", destination: "Nuwara Eliya", category: "4-Star Premium" },
  { name: "98 Acres Resort & Spa", destination: "Ella", category: "5-Star Luxury" },
  { name: "EKHO Ella", destination: "Ella", category: "3-Star Comfort" },
  { name: "Hide Ella Hotel", destination: "Ella", category: "4-Star Premium" },
  { name: "Wild Coast Tented Lodge", destination: "Yala", category: "5-Star Luxury" },
  { name: "Cinnamon Wild", destination: "Yala", category: "4-Star Premium" },
  { name: "Jetwing Yala", destination: "Yala", category: "5-Star Luxury" },
  { name: "Chena Huts by Uga Escapes", destination: "Yala", category: "Boutique Villa" },
  { name: "Jetwing Lighthouse", destination: "Galle", category: "5-Star Luxury" },
  { name: "Amangalla", destination: "Galle Fort", category: "5-Star Luxury" },
  { name: "Cape Weligama", destination: "Weligama", category: "5-Star Luxury" },
  { name: "Anantara Peace Haven", destination: "Tangalle", category: "5-Star Luxury" },
  { name: "Riff Hikkaduwa", destination: "Hikkaduwa", category: "Boutique Villa" },
  { name: "The Fortress Resort & Spa", destination: "Koggala", category: "5-Star Luxury" },
  { name: "Cinnamon Grand", destination: "Colombo", category: "5-Star Luxury" },
  { name: "Taj Samudra", destination: "Colombo", category: "5-Star Luxury" },
  { name: "The Kingsbury", destination: "Colombo", category: "5-Star Luxury" },
  { name: "Galle Face Hotel", destination: "Colombo", category: "5-Star Luxury" },
  { name: "Heritance Negombo", destination: "Negombo", category: "5-Star Luxury" },
  { name: "Jetwing Blue", destination: "Negombo", category: "5-Star Luxury" },
  { name: "Uga Ulagalla", destination: "Anuradhapura", category: "Boutique Villa" },
  { name: "Shangri-La", destination: "Hambantota", category: "5-Star Luxury" },
  { name: "Trinco Blu by Cinnamon", destination: "Trincomalee", category: "4-Star Premium" }
];

export const HOTELS: string[] = VOYA_LANKA_PARTNER_HOTELS.map(
  h => `${h.name} - ${h.destination}`
);

export const HOTEL_CATEGORIES = [
  "5-Star Luxury",
  "4-Star Premium",
  "3-Star Comfort",
  "Boutique Villa"
];

export const MEAL_PLANS = [
  "Bed & Breakfast",
  "Half-Board",
  "Full Board"
];

export const BED_TYPES = [
  "Single",
  "Double (DBL)",
  "DBL + ExtraBed",
  "Twin",
  "Triple",
  "Family Suite"
];

export const ROOM_CATEGORIES = [
  "Standard Room",
  "Sea View Room",
  "Deluxe Room",
  "Superior Room",
  "Executive Suite"
];

export const ROOM_VIEWS = [
  "Garden View",
  "Sea View",
  "Mountain View",
  "Pool View",
  "Lagoon View"
];

export interface VehicleOption {
  label: string;
  rate: number;
}

export const VEHICLE_OPTIONS: VehicleOption[] = [
  { label: "Car - Sedan", rate: 12000 },
  { label: "7 Seater Jeep / SUV", rate: 18000 },
  { label: "Flat roof full air conditioned van", rate: 22000 },
  { label: "High roof full air conditioned van", rate: 26000 },
  { label: "Full air conditioned Bus", rate: 45000 }
];

export interface GuideOption {
  label: string;
  rate: number;
}

export const GUIDE_OPTIONS: GuideOption[] = [
  { label: "Private English-Speaking Chauffeur Guide", rate: 4500 },
  { label: "Private German-Speaking Chauffeur Guide", rate: 7500 },
  { label: "Private Spanish-Speaking Chauffeur Guide", rate: 7500 },
  { label: "Private Chinese-Speaking Chauffeur Guide", rate: 8000 },
  { label: "Private Japanese-Speaking Chauffeur Guide", rate: 8000 }
];

export const DEFAULT_COMPANY: CompanyDetails = {
  name: "Voya Lanka Tours (Pvt) Ltd.",
  address: "No. 93/2, Dabare Mawatha, Narahenpita, Colombo 05, Sri Lanka",
  phone: "+94 77 021 6300",
  email: "info@voyalankatours.com",
  website: "www.voyalankatours.com",
  reg: "SLTDA/SQA/PRO/01294"
};

export const DEFAULT_TERMS: TermsConfig = {
  dep: 50,
  valid: 14,
  incl: [
    "Private {vehicle} for {days} days, as per agreed itinerary",
    "Fuel, highway tolls and parking charges",
    "{nights} nights at selected {hotels} with {meals}",
    "{guide}",
    "Passenger insurance cover"
  ].join("\n"),
  excl: [
    "International airfare and Sri Lankan visa fees, where applicable",
    "Attraction entrance tickets, activities and excursion fees",
    "Personal expenses, laundry and shopping",
    "Personal travel insurance",
    "Tips and gratuities"
  ].join("\n"),
  terms: [
    "A {dep}% deposit is required to confirm the booking; the balance must be paid before arrival in Sri Lanka.",
    "This quotation is valid until {validUntil}.",
    "Rates are subject to hotel availability and applicable accommodation prices at the time of booking.",
    "Changes to the itinerary or requested services may affect the final price."
  ].join("\n"),
  thanks: "Thank you for choosing Voya Lanka Tours (Pvt) Ltd. — we look forward to welcoming you to beautiful Sri Lanka!"
};

export const IT_GREET =
  "We are pleased to present your final Sri Lanka tour itinerary, carefully prepared according to your travel schedule. We trust this journey will provide you with unforgettable experiences, cultural discoveries, scenic landscapes, and warm Sri Lankan hospitality.";

export const IT_CLOSE =
  "We thank you for choosing Voya Lanka Tours (Pvt) Ltd. and look forward to welcoming you to the Pearl of the Indian Ocean.";

export const LEGAL_NAME = "VOYA LANKA TOURS (PVT) LTD.";

export interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone: string;
  country: string;
  notes: string;
  createdDate: string;
  lastQuotedDate: string;
  totalQuotes: number;
  quoteIds: string[];
}

export interface ShareableQuotationData {
  id: string;
  createdAt: string;
  customer: CustomerDetails;
  pax: PaxDetails;
  transport: TransportDetails;
  guide: GuideDetails;
  pricing: PricingConfig;
  others: OtherCharge[];
  nights: NightConfig[];
  terms: TermsConfig;
  itinerary: ItineraryData | null;
  breakdown: PricingBreakdown;
  company: CompanyDetails;
  logoUrl?: string;
  shareTitle?: string;
}

export interface DatabaseBackup {
  version: string;
  exportedAt: string;
  appName: string;
  customers: CustomerRecord[];
  savedQuotes: SavedQuotation[];
  partnerHotels: PartnerHotel[];
  companyDetails: CompanyDetails;
  termsConfig: TermsConfig;
  logo: LogoData | null;
}
