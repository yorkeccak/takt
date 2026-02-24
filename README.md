# [Takt](https://takt.valyu.ai)

AI-powered deep research that generates board-ready reports with professional deliverables (PDF, PPTX, XLSX, DOCX) from 100+ proprietary and public data sources - in minutes, not weeks.

Built on the [Valyu DeepResearch API](https://docs.valyu.ai/guides/deepresearch-quickstart).

**[Try the live demo](https://takt.valyu.ai)**

## Features

### Research modes

| Mode | What you get |
|---|---|
| **Supplier Due Diligence** | Financial health, ESG scoring, LkSG compliance, geographic risk, alternative sourcing recommendations |
| **Patent Landscape** | Technology clustering, prior art, white space analysis, competitive IP benchmarking across USPTO, EPO, WIPO, CNIPA, JPO |
| **Regulatory Intelligence** | EU/US/China regulation tracking, compliance timelines, OEM and supplier impact assessments |
| **Competitive Analysis** | Market positioning, SWOT analysis, technology comparison, M&A landscape |
| **Custom Research** | Open-ended research on any topic - bring your own prompt |

### Deliverables

Every research automatically generates four professional outputs:

- **PDF** - Full research report with citations and data visualizations
- **DOCX** - One-page executive summary for leadership
- **PPTX** - Presentation deck with findings and recommendations
- **CSV** - Raw data tables, risk matrices, and supporting analytics

### UI

- Dark and light themes
- English and German language support
- Research history with status tracking (stored locally, up to 50 items)
- Collapsible sidebar with keyboard shortcuts (`←` / `→`)
- Real-time progress tracking with step-by-step activity feed
- Pre-built example reports to explore before running your own
- Mobile responsive

### Shareable reports

Completed reports get a public URL at `/report/{id}` with OpenGraph meta tags for rich previews on Slack, LinkedIn, and email.

## Data sources

Takt queries 100+ sources through Valyu's API, including:

| Source | Coverage |
|---|---|
| USPTO Patents | 8.2M+ patents |
| SEC EDGAR | Financial filings |
| PubMed | 36M+ papers |
| arXiv | 2.4M+ preprints |
| ClinicalTrials.gov | 500K+ trials |
| FRED / BLS / World Bank | Economic data |
| ChEMBL / DrugBank | Chemical & pharma |
| Web | Billions of pages |

## Quick start

```bash
git clone https://github.com/yorkeccak/takt.git
cd takt
pnpm install
```

Copy the environment file and add your Valyu API key:

```bash
cp .env.example .env.local
```

```env
VALYU_API_KEY=your_valyu_api_key_here
```

Get your API key at [valyu.ai](https://valyu.ai).

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Stack

- [Next.js 15](https://nextjs.org) (App Router, Turbopack)
- [React 19](https://react.dev)
- [Tailwind CSS 4](https://tailwindcss.com)
- [Valyu DeepResearch API](https://docs.valyu.ai)
- [Zustand](https://zustand.docs.pmnd.rs) for state
- TypeScript strict mode

## Project structure

```
app/
  api/
    auto-research/       # Research creation, status polling, cancellation
  components/            # UI components (form, results, deliverables, sidebar)
  lib/                   # Utilities, research history, email templates
  stores/                # Zustand stores (auth, theme, locale)
  report/[id]/           # Shareable public report pages
  page.tsx               # Main application
```

## License

MIT

## Links

- [Valyu](https://valyu.ai) - AI search API
- [API documentation](https://docs.valyu.ai/guides/deepresearch-quickstart)
- [Valyu JS SDK](https://www.npmjs.com/package/valyu-js)
