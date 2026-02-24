# Takt

AI-powered deep research for automotive procurement, R&D, and strategy teams. Generate board-ready reports with deliverables (PDF, PPTX, XLSX, DOCX) from 100+ proprietary and public data sources - in minutes, not weeks.

Built on the [Valyu DeepResearch API](https://docs.valyu.ai/guides/deepresearch-quickstart).

**[Live demo](https://takt.valyu.ai)**

## What it does

Choose a research type, describe your topic, and get a comprehensive report with downloadable deliverables:

- **Supplier Intelligence** - Financial health, ESG scoring, LkSG compliance, geographic risk, alternative sourcing
- **Patent Landscape** - Technology clustering, prior art, white space analysis, competitive IP benchmarking (8.2M+ USPTO patents)
- **Regulatory Intel** - EU/US/China regulation tracking, compliance timelines, OEM and supplier impact assessments
- **Competitive Analysis** - Market positioning, technology comparison, M&A landscape, SWOT analysis

Each research generates a PDF report, executive summary (DOCX), data tables (CSV), and presentation deck (PPTX).

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
    oauth/               # Valyu OAuth token exchange
  components/            # UI components
  lib/                   # Utilities, research history
  stores/                # Zustand stores (auth, theme)
  report/[id]/           # Shareable public report pages
  page.tsx               # Main application
```

## Shareable reports

Completed reports can be shared via `/report/{taskId}`. Shared links include OG meta tags for rich previews in Slack, LinkedIn, and email.

## License

MIT

## Links

- [Valyu](https://valyu.ai) - AI search API
- [API Documentation](https://docs.valyu.ai/guides/deepresearch-quickstart)
- [Valyu JS SDK](https://www.npmjs.com/package/valyu-js)
