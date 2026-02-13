# Invoice Extractor

AI-powered invoice data extraction using OpenAI vision models with automatic validation, cascading model strategy, and human-in-the-loop review.

## Features

- **LLM Vision Extraction** — Extracts structured data (vendor, items, totals, tax) from invoice images and PDFs using GPT-4o vision capabilities
- **Cascading Models** — Starts with GPT-4o mini (fast/cheap) and automatically escalates to GPT-4o if validation fails, with error hints
- **Automatic Validation** — Verifies math (items sum, tax rates, subtotal + tax = total) and flags Japanese tax rate anomalies (8%/10%)
- **Human-in-the-Loop** — Side-by-side view of original invoice + extracted data; edit, correct, and approve
- **Auto-Approval** — Clean extractions under ¥100,000 are auto-approved; high-value or error cases require review
- **Multi-language** — Handles Japanese (請求書) and English invoices
- **Demo Invoices** — 6 pre-generated test invoices covering various scenarios

## Architecture

```
Upload/Demo → PDF? → convert to image
                ↓
         GPT-4o mini (vision) → extract structured output (Zod schema)
                ↓
         Validate (math + tax rate)
                ↓
         Pass?
           Yes + <¥100K → auto-approved
           Yes + >¥100K → needs-review (high value)
           No  → GPT-4o retry with error hints
                   ↓
                 Pass?
                   Yes → auto-approved / needs-review by threshold
                   No  → needs-review (both models failed)
```

## Tech Stack

- **Next.js 16** + App Router + TypeScript
- **Tailwind v4** + shadcn/ui
- **AI SDK v6** (`ai` + `@ai-sdk/openai`) with structured output (Zod)
- **pdf2pic** + **sharp** for PDF → image conversion
- In-memory store (no database — portfolio demo)

## Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Add your OpenAI API key to .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Regenerate Demo Images

The demo invoice PNGs are pre-generated in `public/demo-invoices/`. To regenerate from the HTML sources:

```bash
npx playwright install chromium
npm run generate-demos
```

## Project Structure

```
src/
├── app/
│   ├── page.tsx                    # Upload + demo picker
│   ├── dashboard/page.tsx          # Invoice list with stats
│   ├── results/[id]/page.tsx       # Side-by-side review
│   └── api/
│       ├── extract/route.ts        # POST: upload + extract
│       ├── demo/route.ts           # POST: process demo invoice
│       ├── invoices/route.ts       # GET: list all
│       └── invoices/[id]/route.ts  # GET/PATCH: view/approve/correct
├── components/
│   ├── upload-dropzone.tsx         # Drag-and-drop file upload
│   ├── demo-invoice-picker.tsx     # Clickable demo thumbnails
│   ├── invoice-viewer.tsx          # Original image with zoom
│   ├── extracted-data-card.tsx     # Editable extracted data
│   ├── validation-warnings.tsx     # Error display
│   ├── invoice-table.tsx           # Dashboard table
│   └── status-badge.tsx            # Status indicator
└── lib/
    ├── schema.ts                   # Zod schema + TypeScript types
    ├── extract.ts                  # Cascading GPT-4o mini→GPT-4o extraction
    ├── validate.ts                 # Math + tax validation
    ├── store.ts                    # In-memory CRUD store
    ├── models.ts                   # Model IDs + constants
    └── pdf-to-image.ts            # PDF conversion wrapper
```

## Demo Invoices

| Name | Description | Expected Result |
|------|-------------|-----------------|
| JP Clean | Japanese, 3 items, 10% tax, ¥88,000 | auto-approved |
| JP Alt Layout | Different layout, mixed 8%/10% tax | needs-review (mixed rates) |
| EN Standard | English, 4 items, USD $4,750 | auto-approved |
| Complex Table | 8 items with discounts, ¥731,000 | needs-review (high value) |
| Scanned (Noisy) | Same as JP Clean with noise/rotation | auto-approved |
| Error Invoice | Wrong tax rate (12%), ¥56,000 | needs-review (validation error) |
