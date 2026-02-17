"use client";

import React, { useState } from "react";
import {
  Share2,
  Download,
  Check,
  Loader2,
  ArrowRight,
  Eye,
} from "lucide-react";
import { FileIcon, defaultStyles } from "react-file-icon";
import Link from "next/link";
import MarkdownRenderer from "@/app/components/MarkdownRenderer";

interface Deliverable {
  type: string;
  title: string;
  url: string;
}

interface SerializedReport {
  id: string;
  status: string;
  output: string;
  sources: Array<{ title: string; url: string }>;
  pdf_url: string | null;
  deliverables: Deliverable[];
}

interface ReportClientProps {
  report: SerializedReport;
  title: string;
}

const FILE_ICON_STYLES: Record<string, Record<string, unknown>> = {
  pdf: defaultStyles.pdf,
  pptx: defaultStyles.pptx,
  csv: {
    ...defaultStyles.csv,
    color: "#1A754C",
    foldColor: "#16613F",
    glyphColor: "rgba(255,255,255,0.4)",
    labelColor: "#1A754C",
    labelUppercase: true,
  },
  xlsx: defaultStyles.xlsx,
  docx: defaultStyles.docx,
};

function getFileIcon(format: string) {
  const ext = format.toLowerCase();
  const styles = FILE_ICON_STYLES[ext] || {};
  return (
    <div className="w-5">
      <FileIcon extension={ext} {...styles} />
    </div>
  );
}

function getFileLabel(format: string) {
  switch (format.toLowerCase()) {
    case "pdf": return "Full Research Report";
    case "csv": return "Data & Comparisons";
    case "xlsx": return "Data Spreadsheet";
    case "docx": return "Executive Summary";
    case "pptx": return "Presentation";
    default: return format.toUpperCase();
  }
}

export default function ReportClient({ report, title }: ReportClientProps) {
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = window.location.href;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = async (url: string, filename: string) => {
    setIsDownloading(filename);
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);
    } catch {
      window.open(url, "_blank");
    } finally {
      setIsDownloading(null);
    }
  };

  const allDeliverables: Deliverable[] = [
    ...(report.pdf_url
      ? [{ type: "pdf", title: "research-report", url: report.pdf_url }]
      : []),
    ...report.deliverables,
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Sign-in CTA banner */}
      <div className="border-b border-border bg-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-lg font-bold tracking-tight">
              <span className="gradient-text">Takt</span>
            </Link>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            Run your own research
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Report content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-4">
            {title}
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="btn-secondary inline-flex items-center gap-2 text-sm !py-2 !px-3"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-green-500" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-4 h-4" />
                  <span>Share Report</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Deliverables */}
        {allDeliverables.length > 0 && (
          <div className="mb-8 space-y-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Download className="w-4 h-4" />
              Deliverables
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allDeliverables.map((deliverable, index) => {
                const filename = `${deliverable.title}.${deliverable.type}`;
                return (
                  <div
                    key={index}
                    className="p-3 sm:p-4 bg-surface rounded-lg border border-border"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      {getFileIcon(deliverable.type)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">
                          {getFileLabel(deliverable.type)}
                        </div>
                        <div className="text-xs text-text-muted">
                          {deliverable.type.toUpperCase()} File
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <a
                        href={deliverable.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="view-btn flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-all text-sm font-medium min-h-[44px]"
                        style={{
                          backgroundColor: "var(--view-btn-bg)",
                          color: "var(--view-btn-text)",
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </a>
                      <button
                        onClick={() => handleDownload(deliverable.url, filename)}
                        disabled={isDownloading === filename}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-surface-hover hover:bg-border rounded-lg transition-all text-sm font-medium min-h-[44px]"
                      >
                        {isDownloading === filename ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4" />
                        )}
                        Download
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Report markdown */}
        {report.output && (
          <div
            className="rounded-lg border border-border bg-surface"
            style={{ contain: "layout" }}
          >
            <div
              className="p-4 sm:p-6 md:p-8 break-words"
              style={{ overflowWrap: "anywhere" }}
            >
              <MarkdownRenderer content={report.output} inlineCitations />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-text-muted">
            Powered by{" "}
            <a
              href="https://valyu.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-medium"
            >
              Valyu DeepResearch API
            </a>
          </span>
          <Link
            href="/"
            className="btn-primary inline-flex items-center gap-2 text-sm"
          >
            Run your own research
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
