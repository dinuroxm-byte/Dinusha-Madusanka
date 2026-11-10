# Voya Lanka Tours (Pvt) Ltd. - Quotation & Tour Management System

Professional Tour Quotation, Vehicle Costing Engine, Itinerary Generator, Room Voucher Exporter, and Client Database for **Voya Lanka Tours (Pvt) Ltd.**

100% Client-Side React SPA — runs locally on your machine with zero cloud server dependencies, zero database setup, and zero monthly subscriptions.

---

## 🚀 Quick Start (Run on Localhost)

### 1. Prerequisites
- **Node.js** (v18.0.0 or higher recommended, e.g. Node 20 or 22)
  Download from [nodejs.org](https://nodejs.org/)
- **npm** (comes automatically with Node.js)

### 2. Installation
Open your terminal or command prompt inside this project folder:

```bash
npm install
```

### 3. Start Local Development Server
```bash
npm run dev
```

Your terminal will display:
```
  VITE v8.3.0  ready in 150 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

Open **`http://localhost:3000`** in your web browser!

---

## 🛠️ Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts the local development server at `http://localhost:3000` with hot reloading. |
| `npm run build` | Compiles a production-ready static build inside the `dist/` folder. |
| `npm run preview` | Starts a local web server to preview the built `dist/` directory. |
| `npm run lint` | Runs TypeScript type checking (`tsc --noEmit`). |

---

## 📁 Project Structure

```
├── index.html                  # HTML entry point with meta tags & fonts
├── package.json                # Project dependencies and npm scripts
├── tsconfig.json               # TypeScript compiler options
├── vite.config.ts              # Vite & Tailwind CSS build configuration
├── README.md                   # Setup guide and instructions
├── public/                     # Static assets and media files
│   └── assets/aistudio/        # Vehicle photos, banners, and logos
└── src/
    ├── main.tsx                # React application DOM entry point
    ├── App.tsx                 # Core application controller and state manager
    ├── index.css               # Tailwind CSS v4 directives and typography
    ├── types.ts                # TypeScript interfaces (Quotations, Pax, Hotels, etc.)
    ├── components/             # Reusable UI component modules
    │   ├── Header.tsx                  # Top navigation, status indicator, action buttons
    │   ├── CustomerSection.tsx         # Customer details, contact info, nationality
    │   ├── PaxSection.tsx              # Adults, children, infants, bed configs
    │   ├── TransportationSection.tsx   # Fleet selection, mileage rate, drivers
    │   ├── AccommodationSection.tsx    # Night-by-night hotel selection & meal plans
    │   ├── HotelAutocomplete.tsx       # Smart hotel search with instant matching
    │   ├── PartnerHotelsModal.tsx      # Partner hotel rate manager & room types
    │   ├── ChargesSection.tsx          # Entrance fees, activities, extra charges
    │   ├── GuideSection.tsx            # Guide selection and daily allowance
    │   ├── TermsSection.tsx            # Inclusions, exclusions, and payment terms
    │   ├── PricingSidebar.tsx          # Real-time profit margins and price breakdown
    │   ├── PrintModal.tsx              # High-fidelity printable / PDF quotation
    │   ├── ItineraryModal.tsx          # Day-by-day travel itinerary schedule
    │   ├── VoucherModal.tsx            # Formal hotel check-in booking vouchers
    │   ├── OnlineProposalView.tsx      # Interactive online customer proposal view
    │   ├── SavedModal.tsx              # Quotation archive, search, and recall
    │   ├── CustomerDatabaseModal.tsx   # Customer directory, history, CRM
    │   ├── WhatsAppShareModal.tsx      # One-click WhatsApp quotation summary
    │   ├── CompanyModal.tsx            # Company profile, VAT/BRN, bank details
    │   └── DatabaseBackupModal.tsx     # 1-Click JSON export, restore & source download
    └── utils/                  # Core business logic and helper functions
        ├── calc.ts                     # Real-time quotation & vehicle costing calculations
        ├── storage.ts                  # Local storage engine for quotations & CRM
        ├── pdfExport.ts                # jsPDF quotation & voucher generation
        ├── excelExport.ts              # ExcelJS spreadsheet workbook export
        └── shareLink.ts                # Compressed proposal sharing link encoder
```

---

## 💾 Data Storage & Privacy

- **100% Private & Local**: All customer profiles, saved quotations, vehicle fleets, and hotel rates are securely saved inside your browser's `localStorage`.
- **Backup & Restore**: Use the **"Backup & Restore"** button in the header at any time to download a complete `.json` file of your entire database. You can restore this file on any computer or browser in seconds.

---

## 🚢 Deploying Online (Free Hosting Options)

If you wish to host this online for free without any monthly fees:
1. Run `npm run build`.
2. Upload the generated `dist/` folder to:
   - **Netlify**: Drag & drop the `dist/` folder to [app.netlify.com/drop](https://app.netlify.com/drop)
   - **Vercel**: Run `npx vercel` or link your GitHub repo
   - **GitHub Pages**: Push the repository and set GitHub Pages source to GitHub Actions or `dist/` branch.
   - **Cloudflare Pages**: Link your repository and set build command to `npm run build` and output folder to `dist`.

---

© 2026 Voya Lanka Tours (Pvt) Ltd. All rights reserved.
