"use client";

import React, { useState } from "react";
import dynamic from "next/dynamic";
import {
  CheckCircle,
  XCircle,
  Download,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  BookOpen,
  Eye,
  Maximize2,
  X,
  Share2,
  Database,
} from "lucide-react";
import { FileIcon, defaultStyles } from "react-file-icon";
import ResearchActivityFeed from "./ResearchActivityFeed";
import MarkdownRenderer from "./MarkdownRenderer";
import { useTranslation } from "@/app/i18n";
import { track } from "@/app/providers";

const FileViewer = dynamic(() => import("./FileViewer"), { ssr: false });

interface ViewerState {
  isOpen: boolean;
  url: string;
  fileType: string;
  title: string;
}

interface ResearchResultsProps {
  result: {
    status: string;
    task_id: string;
    output?: string;
    sources?: Array<{ title: string; url: string }>;
    pdf_url?: string;
    deliverables?: Array<{ type: string; title: string; url: string }>;
    progress?: { current_step: number; total_steps: number };
    messages?: Array<{ role: string; content: string | Array<Record<string, unknown>> }>;
    error?: string;
  } | null;
  onCancel: () => void;
  onReset: () => void;
}

const FILE_ICON_STYLES: Record<string, Record<string, unknown>> = {
  pdf: defaultStyles.pdf,
  pptx: defaultStyles.pptx,
  csv: { ...defaultStyles.csv, color: "#1A754C", foldColor: "#16613F", glyphColor: "rgba(255,255,255,0.4)", labelColor: "#1A754C", labelUppercase: true },
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

function getFileLabel(format: string, t: (key: string) => string) {
  switch (format.toLowerCase()) {
    case "pdf": return t("results.pdfLabel");
    case "csv": return t("results.csvLabel");
    case "xlsx": return t("results.xlsxLabel");
    case "docx": return t("results.docxLabel");
    case "pptx": return t("results.pptxLabel");
    default: return format.toUpperCase();
  }
}

export default function ResearchResults({ result, onCancel, onReset }: ResearchResultsProps) {
  const { t } = useTranslation();
  const [showReport, setShowReport] = useState(true);
  const [reportFullscreen, setReportFullscreen] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [viewer, setViewer] = useState<ViewerState>({
    isOpen: false,
    url: "",
    fileType: "",
    title: "",
  });

  const reportContent = showReport && result?.output ? result.output : "";

  if (!result) return null;

  const handleShare = async () => {
    const url = `${window.location.origin}/report/${result.task_id}`;
    await navigator.clipboard.writeText(url);
    track("report_shared", { task_id: result.task_id });
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isComplete = result.status === "completed";
  const isInProgress = result.status === "queued" || result.status === "running";
  const isFailed = result.status === "failed" || result.status === "cancelled";

  const progressPercent = isComplete
    ? 100
    : result.progress
      ? Math.round((result.progress.current_step / result.progress.total_steps) * 100)
      : 0;

  const handleDownload = async (url: string, filename: string) => {
    setIsDownloading(filename);
    track("deliverable_downloaded", { format: filename.split(".").pop() });
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

  const handleView = (url: string, fileType: string, title: string) => {
    setViewer({ isOpen: true, url, fileType, title });
  };

  const closeViewer = () => {
    setViewer({ isOpen: false, url: "", fileType: "", title: "" });
  };

  return (
    <div className="space-y-4 min-w-0">
      <FileViewer
        url={viewer.url}
        fileType={viewer.fileType}
        title={viewer.title}
        isOpen={viewer.isOpen}
        onClose={closeViewer}
      />

      {isInProgress && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
          <span className="text-sm font-medium text-foreground">{t("results.researching")}</span>
          <p className="text-sm text-text-muted">
            {t("results.generating")}
          </p>
        </div>
      )}

      {(isInProgress || isComplete) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              {isInProgress && (
                <>
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                  <span className="text-text-muted">
                    {result.progress
                      ? t("results.stepOf", { current: result.progress.current_step, total: result.progress.total_steps })
                      : t("results.starting")}
                  </span>
                </>
              )}
              {isComplete && (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-green-500 font-medium">{t("results.complete")}</span>
                </>
              )}
            </div>
            <span className="text-xs text-text-muted">{progressPercent}%</span>
          </div>
          <div className="w-full h-1.5 bg-surface rounded-full overflow-hidden border border-border/40">
            <div
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                isComplete ? "bg-green-500" : "bg-primary"
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {result.messages && result.messages.length > 0 && (
        <ResearchActivityFeed
          messages={result.messages}
          isRunning={isInProgress}
        />
      )}

      {isInProgress && (
        <div className="flex gap-3">
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {t("results.startAnother")}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface-hover transition-colors text-text-muted"
          >
            {t("results.cancel")}
          </button>
        </div>
      )}

      {isComplete && (
        <div className="space-y-4">
          {(result.deliverables?.length || result.pdf_url) && (() => {
            const allDeliverables = [
              ...(result.pdf_url
                ? [{ type: "pdf", title: "research-report", url: result.pdf_url }]
                : []),
              ...(result.deliverables ?? []),
            ];
            return (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  {t("results.deliverables")}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {allDeliverables.map((deliverable, index) => {
                    const filename = `${deliverable.title}.${deliverable.type}`;
                    return (
                      <div key={index} className="p-3 sm:p-4 bg-surface rounded-lg border border-border">
                        <div className="flex items-center gap-3 mb-3">
                          {getFileIcon(deliverable.type)}
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm">{getFileLabel(deliverable.type, t)}</div>
                            <div className="text-xs text-text-muted">
                              {t("results.fileType", { format: deliverable.type.toUpperCase() })}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2" style={{ display: "flex" }}>
                          <button
                            onClick={() => handleView(deliverable.url, deliverable.type, getFileLabel(deliverable.type, t))}
                            className="view-btn flex-1 flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg transition-all text-sm font-medium min-h-[44px]"
                            style={{ flex: "1 1 0%", minWidth: 0, backgroundColor: "var(--view-btn-bg)", color: "var(--view-btn-text)" }}
                          >
                            <Eye className="w-4 h-4" />
                            {t("results.view")}
                          </button>
                          <button
                            onClick={() => handleDownload(deliverable.url, filename)}
                            disabled={isDownloading === filename}
                            className="flex-1 flex items-center justify-center gap-2 px-3 py-2.5 bg-surface-hover hover:bg-border rounded-lg transition-all text-sm font-medium min-h-[44px]"
                            style={{ flex: "1 1 0%", minWidth: 0 }}
                          >
                            {isDownloading === filename ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                            {t("results.download")}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Data Sources */}
          <div className="p-4 bg-surface rounded-lg border border-border">
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-primary" />
              {t("results.sourcedFrom")}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                { name: "USPTO Patents", count: "8.2M+" },
                { name: "SEC EDGAR", count: "Filings" },
                { name: "PubMed", count: "36M+" },
                { name: "arXiv", count: "2.4M+" },
                { name: "FRED Economic Data", count: "Economic" },
                { name: "Web Sources", count: "Billions" },
              ].map((source) => (
                <div key={source.name} className="flex items-center gap-2 text-xs text-text-muted">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                  <div>
                    <span className="text-foreground font-medium">{source.name}</span>
                    <span className="ml-1 text-text-muted">({source.count})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {result.output && (
            <div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowReport(!showReport)}
                  className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>{t("results.fullReport")}</span>
                  {showReport ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                {showReport && (
                  <button
                    onClick={() => setReportFullscreen(true)}
                    className="p-1 rounded hover:bg-surface-hover transition-colors text-text-muted hover:text-foreground"
                    title={t("results.fullScreen")}
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              {showReport && reportContent && (
                <div
                  className="mt-3 rounded-lg border border-border bg-surface max-h-[70vh] overflow-y-auto overflow-x-auto"
                  style={{ contain: "layout" }}
                >
                  <div
                    className="p-4 sm:p-6 break-words"
                    style={{ overflowWrap: "anywhere" }}
                  >
                    <MarkdownRenderer content={reportContent} inlineCitations />
                  </div>
                </div>
              )}
            </div>
          )}

          {reportFullscreen && reportContent && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={() => setReportFullscreen(false)}
              />
              <div className="relative bg-background border border-border rounded-xl shadow-2xl w-[95vw] max-w-5xl h-[90vh] flex flex-col">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold">{t("results.fullReport")}</h2>
                  </div>
                  <button
                    onClick={() => setReportFullscreen(false)}
                    className="p-2 hover:bg-surface rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="flex-1 overflow-y-auto overflow-x-auto">
                  <div
                    className="p-4 sm:p-6 md:p-8 break-words"
                    style={{ overflowWrap: "anywhere" }}
                  >
                    <MarkdownRenderer content={reportContent} inlineCitations />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onReset}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              {t("results.newResearch")}
            </button>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-surface-hover transition-colors text-text-muted"
            >
              <Share2 className="w-4 h-4" />
              {copied ? t("results.copied") : t("results.share")}
            </button>
          </div>
        </div>
      )}

      {isFailed && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-red-500" />
            <h3 className="text-sm font-medium text-red-500">{t("results.failed")}</h3>
          </div>
          <p className="text-sm text-text-muted">{result.error || t("results.unknownError")}</p>
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            {t("results.tryAgain")}
          </button>
        </div>
      )}
    </div>
  );
}
