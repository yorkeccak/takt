import type { Metadata } from "next";
import { Valyu } from "valyu-js";
import { notFound } from "next/navigation";
import Link from "next/link";
import ReportClient from "./ReportClient";

interface ReportData {
  status: string;
  public: boolean;
  output: string;
  sources?: Array<{ title: string; url: string }>;
  pdf_url?: string;
  deliverables?: Array<{ type: string; title: string; url: string }>;
  messages?: Array<{ role: string; content: string | Array<Record<string, unknown>> }>;
  error?: string;
  deepresearch_id: string;
}

function extractTitleFromMarkdown(output: string): string {
  const lines = output.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#")) {
      return trimmed.replace(/^#+\s*/, "");
    }
  }
  return "Research Report";
}

function extractDescriptionFromMarkdown(output: string): string {
  const lines = output.split("\n");
  let pastTitle = false;
  const bodyLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();
    if (!pastTitle) {
      if (trimmed.startsWith("#")) {
        pastTitle = true;
        continue;
      }
      if (trimmed === "") continue;
      // No heading found yet - treat as body
      pastTitle = true;
    }
    if (trimmed === "") {
      if (bodyLines.length > 0) continue;
      continue;
    }
    // Skip subsequent headings for the description
    if (trimmed.startsWith("#")) continue;
    bodyLines.push(trimmed);
    if (bodyLines.join(" ").length >= 200) break;
  }

  const raw = bodyLines.join(" ").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/[*_`~]/g, "");
  return raw.slice(0, 160);
}

async function fetchReport(id: string): Promise<ReportData | null> {
  try {
    const valyu = new Valyu(process.env.VALYU_API_KEY!);
    const data = await valyu.deepresearch.status(id) as unknown as ReportData;
    return data;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const data = await fetchReport(id);

  if (!data || !data.public || !data.output) {
    return {
      title: "Report Not Found | Takt",
      description: "This report is not available.",
    };
  }

  const title = extractTitleFromMarkdown(data.output);
  const description = extractDescriptionFromMarkdown(data.output);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://takt.valyu.ai";
  const reportUrl = `${appUrl}/report/${id}`;

  return {
    title: `${title} | Takt`,
    description,
    openGraph: {
      title: `${title} | Takt`,
      description,
      type: "article",
      url: reportUrl,
      siteName: "Takt",
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} | Takt`,
      description,
    },
  };
}

export default async function ReportPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    notFound();
  }

  const data = await fetchReport(id);

  if (!data || !data.public) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-surface border border-border flex items-center justify-center">
            <svg className="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Report not found</h1>
          <p className="text-text-muted mb-8">
            This report doesn&apos;t exist or isn&apos;t publicly shared.
          </p>
          <Link
            href="/"
            className="btn-primary inline-flex items-center gap-2"
          >
            Go to Takt
          </Link>
        </div>
      </div>
    );
  }

  const title = extractTitleFromMarkdown(data.output || "");

  const serializedReport = {
    id: data.deepresearch_id || id,
    status: data.status,
    output: data.output || "",
    sources: data.sources || [],
    pdf_url: data.pdf_url || null,
    deliverables: data.deliverables || [],
  };

  return (
    <ReportClient
      report={serializedReport}
      title={title}
    />
  );
}
