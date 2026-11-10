# Free Publishing & Preview Server Restoration

Implementation plan to resolve the billing requirement when publishing the Voya Lanka Tours application in Google AI Studio and restore the working preview link.

## User Review & Critical Decisions

> [!IMPORTANT]
> The user confirmed the following two key decisions during Phase 1:
> - **Publishing Resolution**: Remove the `MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API` capability flag from `metadata.json` so AI Studio classifies the application as a 100% free, static client-side web application without requiring Google Cloud billing.
> - **Preview Link Resolution**: Execute a fresh production build (`npm run build`) and restart the preview development server on port 3000 to re-establish the live preview and shared app URL.

- **Confirmed Decision 1**: Remove the AI capability flag from `metadata.json` (`"majorCapabilities": []`).
- **Confirmed Decision 2**: Rebuild the static bundle and restart the dev server to restore the preview link.

---

## 1. Overview & Core Concept

- **What It Does**: Transitions the project configuration into a pure client-side Single Page Application (SPA). This eliminates AI Studio's billing prompts during publishing and ensures the live preview endpoint is healthy and accessible.
- **Target Audience**: Voya Lanka Tours administrators and clients accessing live tour proposals and quotations.
- **Key Value**: Free, zero-cost publishing and reliable preview link availability without external cloud billing hurdles.

---

## 2. User Experience & Architecture Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    Voya Lanka Tours Applet                      │
│                                                                 │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │                 Static Client-Side SPA                  │   │
│   │  • Quotation Costing Engine   • Room Voucher PDF        │   │
│   │  • Itinerary Generator        • Excel Workbooks         │   │
│   │  • Customer Directory CRM     • Local JSON Backup       │   │
│   └────────────────────────────┬────────────────────────────┘   │
│                                │                                │
│                                ▼                                │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │               metadata.json (Capability)                │   │
│   │    majorCapabilities: []  <-- No Paid Server/AI Flags    │   │
│   └────────────────────────────┬────────────────────────────┘   │
│                                │                                │
│                                ▼                                │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │               Free Publishing in AI Studio              │   │
│   │  • No Google Cloud billing prompt required              │   │
│   │  • Shared preview URL accessible without subscription   │   │
│   └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

- **Publishing Flow**: When clicking "Publish" in AI Studio, the platform checks `metadata.json`. Because no server-side Gemini API or backend infrastructure is flagged, it proceeds with free public hosting.
- **Preview Link Health**: A fresh compile (`vite build`) generates the production distribution files, and restarting the dev server binds cleanly to port 3000.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Removal of AI Capability Flag in `metadata.json`**
  - *Chosen Approach*: Set `"majorCapabilities": []` in `metadata.json`.
  - *Why*: The application is 100% client-side (uses jsPDF, exceljs, and localStorage). It does not contain any Gemini API model calls or backend servers. Removing the flag stops AI Studio from demanding a Google Cloud billing account for AI model quotas.
  - *Alternatives Considered*: Keeping the flag would permanently lock the "Publish" button behind a paid billing account requirement.

- **Decision 2: Rebuild & Restart Strategy**
  - *Chosen Approach*: Co-execute `compile_applet` (`npm run build`) and `restart_dev_server` to verify zero runtime or bundling faults on port 3000.
  - *Why*: Ensures the preview proxy container has a fresh build artifact and active HTTP server responding on port 3000.

---

## 4. Technical Implementation Steps

1. **Update `metadata.json`**:
   - Change `"majorCapabilities": ["MAJOR_CAPABILITY_SERVER_SIDE_GEMINI_API"]` to `"majorCapabilities": []`.
   - Preserve application `name` and `description`.

2. **Verify Codebase & Linting**:
   - Run `lint_applet` (`tsc --noEmit`) to verify zero type errors.

3. **Production Compilation**:
   - Run `compile_applet` (`npm run build`) to ensure the static assets compile cleanly.

4. **Restart Preview Server**:
   - Call `restart_dev_server` to refresh the Node/Vite process on port 3000.
   - Verify HTTP 200 response on port 3000.
