import { NextRequest, NextResponse } from "next/server";
import { Valyu } from "valyu-js";
import { isSelfHostedMode } from "@/app/lib/app-mode";

const VALYU_APP_URL = process.env.VALYU_APP_URL || "https://platform.valyu.ai";

const getValyuApiKey = () => {
  const apiKey = process.env.VALYU_API_KEY;
  if (!apiKey) {
    throw new Error("VALYU_API_KEY environment variable is required");
  }
  return apiKey;
};

type DeliverableType = "csv" | "xlsx" | "pptx" | "docx" | "pdf";

interface Deliverable {
  type: DeliverableType;
  description: string;
}

async function createResearchWithOAuth(
  accessToken: string,
  query: string,
  deliverables: Deliverable[]
) {
  const proxyUrl = `${VALYU_APP_URL}/api/oauth/proxy`;

  const requestBody = {
    path: "/v1/deepresearch/tasks",
    method: "POST",
    body: {
      query,
      deliverables,
      mode: "fast",
      output_formats: ["markdown", "pdf"],
    },
  };

  const response = await fetch(proxyUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText };
    }

    if (response.status === 402) {
      throw new Error("Insufficient credits. Please top up your Valyu account.");
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error(`Session expired. Please sign in again. (${response.status}: ${errorData.message || errorData.error || 'Unknown error'})`);
    }

    throw new Error(errorData.message || errorData.error || "Failed to create research");
  }

  return response.json();
}

async function createResearchWithApiKey(
  query: string,
  deliverables: Deliverable[]
) {
  const valyu = new Valyu(getValyuApiKey());
  return valyu.deepresearch.create({
    query,
    deliverables,
    mode: "fast",
  });
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    const accessToken = authHeader?.startsWith("Bearer ")
      ? authHeader.substring(7)
      : null;

    const {
      researchType,
      researchSubject,
      researchFocus,
      industryContext,
      specificQuestions,
    } = await request.json();

    if (!researchSubject) {
      return NextResponse.json(
        { error: "Research subject is required" },
        { status: 400 }
      );
    }

    const query = buildResearchQuery(
      researchType,
      researchSubject,
      researchFocus,
      industryContext,
      specificQuestions
    );

    const deliverables = buildDeliverables(researchType, researchSubject);

    const selfHosted = isSelfHostedMode();

    if (!selfHosted && !accessToken) {
      return NextResponse.json(
        { error: "Sign in for free to start deepresearch", requiresReauth: true },
        { status: 401 }
      );
    }

    let response;

    if (!selfHosted && accessToken) {
      response = await createResearchWithOAuth(accessToken, query, deliverables);
    } else {
      response = await createResearchWithApiKey(query, deliverables);
    }

    return NextResponse.json({
      deepresearch_id: response.deepresearch_id,
      status: "queued",
    });
  } catch (error) {
    console.error("Error creating research task:", error);

    let message = "Failed to start research";
    let statusCode = 500;

    if (error instanceof Error) {
      message = error.message;
      if ("status" in error && typeof (error as { status: number }).status === "number") {
        statusCode = (error as { status: number }).status;
      }
      if (message.includes("Insufficient credits")) {
        statusCode = 402;
      } else if (message.includes("Session expired") || message.includes("sign in")) {
        statusCode = 401;
      }
    }

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

function buildResearchQuery(
  researchType: string,
  researchSubject: string,
  researchFocus?: string,
  industryContext?: string,
  specificQuestions?: string
): string {
  let baseQuery = "";

  switch (researchType) {
    case "supplier":
      baseQuery = `
Conduct a comprehensive supplier intelligence and due diligence report on ${researchSubject}.

Provide detailed analysis covering:

1. **Supplier Overview**
   - Company history, founding, and key milestones
   - Headquarters location, manufacturing facilities, and global presence
   - Company size (employees, revenue, production capacity)
   - Ownership structure and parent company relationships

2. **Financial Health Assessment**
   - Revenue trends and growth rates
   - Profitability metrics and margins
   - Debt levels and credit ratings
   - Recent financial performance and outlook
   - SEC filing disclosures (if publicly traded)
   - Funding history (if private)

3. **Product & Technology Portfolio**
   - Core products and materials supplied
   - Manufacturing processes and capabilities
   - Quality certifications (IATF 16949, ISO 9001, etc.)
   - Patent portfolio relevant to automotive applications
   - R&D investment and innovation pipeline

4. **Supply Chain Risk Assessment**
   - Geographic concentration of operations
   - Raw material sourcing dependencies
   - Tier 2/3 supplier risks
   - Single-source risks and alternatives
   - Natural disaster and geopolitical exposure
   - Historical supply disruptions

5. **ESG & Sustainability Profile**
   - Environmental compliance record
   - Carbon footprint and emissions data
   - Conflict minerals and responsible sourcing policies
   - Labor practices and human rights record
   - LkSG (German Supply Chain Due Diligence Act) compliance indicators
   - EU Battery Regulation readiness

6. **Regulatory & Compliance**
   - Regulatory violations or investigations
   - Product recalls or safety issues
   - Sanctions screening results
   - Export control considerations
   - Environmental permits and compliance status

7. **Competitive Position**
   - Market share in relevant segments
   - Key competitors and alternatives
   - Pricing competitiveness
   - Technology differentiation
   - Customer concentration risk

8. **Risk Matrix & Recommendations**
   - Overall risk rating (financial, operational, ESG, regulatory)
   - Key risk factors and mitigation strategies
   - Recommended monitoring indicators
   - Alternative supplier recommendations
`;
      break;

    case "patent":
      baseQuery = `
Conduct a comprehensive patent landscape analysis for ${researchSubject} in the automotive sector.

Provide detailed analysis covering:

1. **Technology Overview**
   - Definition and scope of the technology area
   - Current state of the art
   - Key technical challenges and breakthroughs
   - Relationship to automotive applications

2. **Patent Landscape Summary**
   - Total patent filings in this space (by year, showing trends)
   - Geographic distribution of filings (USPTO, EPO, WIPO, CNIPA, JPO)
   - Patent type breakdown (utility, design, PCT applications)
   - Filing velocity trends and acceleration/deceleration

3. **Key Patent Holders**
   - Top 10-20 assignees by patent count
   - Market share of patent portfolio by assignee
   - Filing trends per major assignee
   - Portfolio strength assessment (citation analysis, family size)
   - OEM vs. supplier vs. university/research institution breakdown

4. **Technology Clustering**
   - Major technology sub-areas and clusters
   - IPC/CPC classification analysis
   - Emerging technology threads
   - Cross-technology convergence patterns

5. **Prior Art Analysis**
   - Foundational patents in this space
   - Most-cited patents and their significance
   - Patent citation networks
   - Academic literature crossover

6. **White Space Analysis**
   - Under-patented technology areas
   - Gaps between academic research and patent filings
   - Emerging areas with low patent density
   - Strategic patenting opportunities

7. **Competitive Patent Positioning**
   - Head-to-head patent portfolio comparisons
   - Freedom-to-operate considerations
   - Potential licensing opportunities
   - Litigation risk assessment

8. **Future Technology Trajectory**
   - Patent filing trend predictions
   - Emerging innovators to watch
   - Technology convergence opportunities
   - Strategic recommendations for R&D investment
`;
      break;

    case "regulatory":
      baseQuery = `
Conduct a comprehensive regulatory intelligence analysis on ${researchSubject} for the automotive industry.

Provide detailed analysis covering:

1. **Regulatory Overview**
   - Scope and applicability of the regulation/regulatory area
   - Governing bodies and enforcement authorities
   - Legislative history and evolution
   - Current status and effective dates

2. **Key Requirements**
   - Detailed breakdown of compliance obligations
   - Technical standards and specifications
   - Reporting and documentation requirements
   - Testing and certification procedures
   - Deadlines and phase-in schedules

3. **Geographic Scope**
   - EU regulatory framework and requirements
   - US federal and state regulations
   - China regulatory landscape
   - Japan and South Korea requirements
   - Cross-jurisdictional comparison matrix

4. **Impact on Automotive OEMs**
   - Direct compliance obligations
   - Supply chain requirements and flow-down
   - Product design implications
   - Manufacturing process changes needed
   - Cost impact assessment
   - Timeline pressure points

5. **Impact on Suppliers**
   - Tier 1 supplier obligations
   - Tier 2/3 supplier implications
   - Documentation and traceability requirements
   - Audit and verification procedures

6. **Compliance Strategy**
   - Recommended compliance approach
   - Required organizational capabilities
   - Technology solutions for compliance
   - Data management requirements
   - Audit preparation checklist

7. **Enforcement & Penalties**
   - Enforcement mechanisms and history
   - Penalty structures and precedents
   - Recent enforcement actions
   - Litigation trends and case law

8. **Regulatory Outlook**
   - Upcoming changes and amendments
   - Proposed legislation in pipeline
   - Industry lobbying positions
   - Expert predictions and commentary
   - Strategic recommendations for proactive compliance
`;
      break;

    case "competitive":
      baseQuery = `
Conduct a comprehensive competitive intelligence analysis for ${researchSubject} in the automotive industry.

Provide detailed analysis covering:

1. **Market Overview**
   - Market definition, scope, and size
   - Historical growth and current trajectory
   - Key market segments and their dynamics
   - Value chain structure

2. **Competitor Identification & Mapping**
   - Major competitors (OEMs, suppliers, new entrants)
   - Market share estimates by competitor
   - Competitor tier classification (leaders, challengers, niche)
   - New entrant threat assessment (particularly Chinese/Asian OEMs)

3. **Competitor Deep Dives**
   For each major competitor, provide:
   - Company overview and strategy
   - Product/technology portfolio
   - Manufacturing footprint and capacity
   - Financial performance (revenue, margins, R&D spend)
   - Patent portfolio strength
   - Recent strategic moves (M&A, partnerships, investments)
   - Strengths and vulnerabilities

4. **Technology Comparison**
   - Technology capability matrix across competitors
   - R&D investment comparison
   - Patent portfolio comparison
   - Academic research partnerships
   - Technology readiness levels

5. **Strategic Positioning Analysis**
   - Competitive positioning map (price vs. technology)
   - Value proposition comparison
   - Go-to-market strategy differences
   - Geographic presence and expansion plans
   - Customer/OEM relationship analysis

6. **M&A & Partnership Landscape**
   - Recent acquisitions and their strategic rationale
   - Joint ventures and strategic partnerships
   - Investment activity and funding rounds
   - Consolidation trends

7. **SWOT Analysis**
   - Comparative SWOT for top 3-5 competitors
   - Cross-competitor strength/weakness patterns
   - Industry-level opportunities and threats

8. **Strategic Implications**
   - Competitive threats to monitor
   - Market gaps and white space opportunities
   - Potential disruption scenarios
   - Recommended competitive strategies
   - Key metrics and indicators to track
`;
      break;

    case "market":
      baseQuery = `
Conduct a comprehensive market sizing and TAM/SAM analysis for ${researchSubject} in the automotive industry.

Provide detailed analysis covering:

1. **Market Definition & Scope**
   - Clear definition of the addressable market
   - Market boundaries and segmentation methodology
   - Total Addressable Market (TAM) with bottom-up and top-down estimates
   - Serviceable Addressable Market (SAM) with realistic penetration assumptions
   - Serviceable Obtainable Market (SOM) with competitive positioning factors

2. **Market Size & Growth Projections**
   - Current market size (USD) with multiple analyst estimates
   - Historical growth trajectory (5-year lookback)
   - Forward projections through 2030 with CAGR
   - Compare estimates from McKinsey, BCG, Roland Berger, and industry analysts
   - Scenario analysis (conservative, base, aggressive)

3. **Segment Breakdown**
   - Market size by technology segment (ADAS, connected car, infotainment, central compute, OTA, V2X, BMS, fleet management)
   - Market size by vehicle type (passenger, commercial, two-wheeler)
   - Market size by region (North America, Europe, China, Japan/Korea, India, Southeast Asia)
   - Market size by customer type (OEM, Tier 1, aftermarket)
   - Embedded software vs. cloud/connected services split

4. **Revenue Pool Analysis**
   - Per-vehicle software content value and growth trajectory
   - Revenue distribution across the value chain (OEM vs. Tier 1 vs. tech companies)
   - EBIT margin comparison by segment and player type
   - Subscription vs. one-time revenue models
   - Software-defined vehicle (SDV) revenue pool shift

5. **Key Market Drivers & Inhibitors**
   - Technology drivers (central compute, zonal architectures, AI/ML)
   - Regulatory drivers (ADAS mandates, cybersecurity, data privacy)
   - Consumer demand drivers
   - Cost and complexity barriers
   - Competitive dynamics and consolidation trends

6. **Competitive Landscape**
   - Market share by key player
   - Strategic positioning (OEMs building in-house vs. outsourcing)
   - Tech company market entry (Qualcomm, NVIDIA, Google, Amazon, Apple)
   - Chinese ecosystem players and competitive dynamics
   - M&A activity and investment flows

7. **Business Case Framework**
   - Investment requirements for market entry
   - Typical ramp-up timelines (design win to production revenue)
   - Break-even analysis and payback periods
   - Risk factors and sensitivity analysis

8. **Strategic Recommendations**
   - Market entry or expansion strategies
   - Partnership and M&A opportunities
   - Technology investment priorities
   - Go-to-market approach by segment
`;
      break;

    case "production":
      baseQuery = `
Conduct a comprehensive production forecast and vehicle sales analysis for ${researchSubject}.

Provide detailed analysis covering:

1. **Production Overview**
   - Start of Production (SOP) dates and manufacturing locations
   - Factory details (capacity, workforce, investment, flexibility)
   - Production ramp-up curve from SOP through peak volume
   - Annual production volumes by year (historical and projected)
   - Planned vs. actual production volumes with variance analysis

2. **Ramp-Up Curve Analysis**
   - Phase 1: Pre-production and pilot builds
   - Phase 2: Limited production / market launch (Year 1)
   - Phase 3: Volume ramp-up (Years 2-3)
   - Phase 4: Peak production (Years 4-5)
   - Phase 5: Lifecycle management and model year updates
   - Impact of supply chain disruptions on ramp-up timelines
   - Multi-factory ramp-up sequencing and regional rollout strategy

3. **Sales Performance**
   - New vehicle sales by market (US, Europe, China, rest of world)
   - Monthly and annual sales trends with seasonality
   - Market share within segment
   - Sales mix by powertrain (BEV, PHEV, HEV, ICE)
   - Comparison with direct competitors' sales volumes
   - OEM sales guidance vs. actual delivery performance

4. **Used Vehicle Market Dynamics**
   - Average ownership duration and vehicle lifecycle
   - Resale value curves and depreciation rates (1-year, 3-year, 5-year)
   - Used vehicle transaction volumes by market
   - Geographic flow of used vehicles (first-world to developing markets)
   - Certified pre-owned (CPO) program performance
   - Impact of EV transition on used vehicle values
   - Cox Automotive / Manheim used vehicle value index data

5. **Business Case Implications**
   - Per-vehicle revenue and cost assumptions for Tier 1 suppliers
   - Production volume impact on supplier business cases
   - Warranty and service revenue tied to production volumes
   - Digital services revenue opportunity across vehicle lifecycle
   - Fleet vs. retail mix impact on business case modeling

6. **Supply Chain & Manufacturing Intelligence**
   - Key Tier 1 suppliers and component sourcing
   - Platform sharing and modular production strategies
   - Semiconductor and battery supply constraints
   - Capacity utilization rates and shift patterns
   - Investment in new production lines and technology upgrades

7. **Market Forecast (5-10 Year Outlook)**
   - Production forecast through end-of-lifecycle
   - Mid-cycle refresh and successor model planning
   - Regional production allocation changes
   - S&P Global Mobility / IHS forecast data where available
   - Impact of regulatory changes on production plans

8. **Strategic Insights & Recommendations**
   - Key risks to production and sales forecasts
   - Opportunities for suppliers aligned to production ramp-up
   - Business case sensitivity to volume changes
   - Monitoring indicators and data sources for ongoing tracking
`;
      break;

    default: // custom
      baseQuery = `
Conduct comprehensive automotive industry research on: ${researchSubject}

Provide detailed, well-structured analysis with:
- Executive summary with key findings
- Detailed analysis with data and statistics
- Industry context and implications for automotive OEMs, suppliers, and the broader mobility ecosystem
- Academic research and patent data where relevant
- SEC filings and financial data where applicable
- Regulatory considerations
- Competitive landscape implications
- Strategic recommendations and conclusions

Ensure all information is:
- Accurate and well-sourced with citations
- Current and relevant to the automotive industry
- Actionable for automotive R&D, procurement, strategy, and regulatory teams
`;
  }

  if (researchFocus) {
    baseQuery += `

**SPECIFIC FOCUS AREAS:**
${researchFocus}

Please ensure these specific areas receive detailed attention in the analysis.
`;
  }

  if (industryContext) {
    baseQuery += `

**INDUSTRY CONTEXT:**
${industryContext}

Please tailor the analysis and recommendations with this context in mind.
`;
  }

  if (specificQuestions) {
    baseQuery += `

**SPECIFIC QUESTIONS TO ADDRESS:**
${specificQuestions}

Please ensure these specific questions are directly answered in the research.
`;
  }

  baseQuery += `

**FORMATTING REQUIREMENTS:**
- Use clear headings and subheadings
- Include bullet points for easy scanning
- Provide data tables where appropriate
- Cite sources for all statistics and facts
- Include relevant charts/visualizations descriptions
- Maintain professional automotive industry report quality
- Structure for consumption by R&D leaders, procurement teams, and strategy executives
`;

  return baseQuery;
}

function buildDeliverables(
  researchType: string,
  researchSubject: string
): Deliverable[] {
  const subjectClean = researchSubject.replace(/[^a-zA-Z0-9\s]/g, "").trim();

  switch (researchType) {
    case "supplier":
      return [
        {
          type: "csv",
          description: `${subjectClean} - Supplier Risk Matrix with financial health, ESG scores, regulatory compliance, and geographic risk indicators`,
        },
        {
          type: "docx",
          description: `${subjectClean} - Executive Summary one-page supplier due diligence overview for procurement leadership`,
        },
        {
          type: "pptx",
          description: `${subjectClean} - Supplier Intelligence Presentation with risk assessment, competitive alternatives, and recommendations`,
        },
      ];

    case "patent":
      return [
        {
          type: "csv",
          description: `${subjectClean} - Patent Landscape Data including top assignees, filing trends, technology clusters, and citation analysis`,
        },
        {
          type: "docx",
          description: `${subjectClean} - Executive Summary one-page patent landscape overview for R&D leadership`,
        },
        {
          type: "pptx",
          description: `${subjectClean} - Patent Landscape Presentation with technology mapping, white space analysis, and strategic recommendations`,
        },
      ];

    case "regulatory":
      return [
        {
          type: "csv",
          description: `${subjectClean} - Regulatory Requirements Checklist with compliance obligations, deadlines, and responsible parties`,
        },
        {
          type: "docx",
          description: `${subjectClean} - Executive Summary one-page regulatory compliance brief for leadership`,
        },
        {
          type: "pptx",
          description: `${subjectClean} - Regulatory Intelligence Presentation with compliance roadmap, impact assessment, and action items`,
        },
      ];

    case "competitive":
      return [
        {
          type: "csv",
          description: `${subjectClean} - Competitive Comparison Matrix with technology capabilities, market share, financials, and patent portfolio data`,
        },
        {
          type: "docx",
          description: `${subjectClean} - Executive Summary one-page competitive landscape overview`,
        },
        {
          type: "pptx",
          description: `${subjectClean} - Competitive Intelligence Presentation with positioning analysis, SWOT, and strategic recommendations`,
        },
      ];

    case "market":
      return [
        {
          type: "csv",
          description: `${subjectClean} - TAM SAM SOM sizing data with segment breakdown, growth rates, and per-vehicle revenue estimates`,
        },
        {
          type: "docx",
          description: `${subjectClean} - Executive Summary one-page market sizing overview for strategy leadership`,
        },
        {
          type: "pptx",
          description: `${subjectClean} - Market Sizing Presentation with TAM waterfall, segment analysis, competitive landscape, and investment thesis`,
        },
      ];

    case "production":
      return [
        {
          type: "csv",
          description: `${subjectClean} - Production volumes, sales data, ramp-up curve figures, depreciation rates, and used vehicle market data by year and region`,
        },
        {
          type: "docx",
          description: `${subjectClean} - Executive Summary one-page production and sales forecast for business case planning`,
        },
        {
          type: "pptx",
          description: `${subjectClean} - Production and Sales Intelligence Presentation with ramp-up curves, market forecasts, and business case framework`,
        },
      ];

    default:
      return [
        {
          type: "csv",
          description: `${subjectClean} - Supporting data and analysis tables`,
        },
        {
          type: "docx",
          description: `${subjectClean} - Executive Summary one-page overview`,
        },
        {
          type: "pptx",
          description: `${subjectClean} - Executive Presentation with key findings and recommendations`,
        },
      ];
  }
}
