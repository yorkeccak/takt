"use client";

import { Suspense, useState, useRef, useCallback, useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "@/app/i18n";
import { track } from "@/app/providers";
import AutoResearchForm from "./components/AutoResearchForm";
import ResearchResults from "./components/ResearchResults";
import Sidebar from "./components/Sidebar";
import ExampleReports from "./components/ExampleReports";
import GitHubCorner from "./components/GitHubCorner";
import { SignInModal } from "./components/auth";
import {
  Cpu,
  Factory,
  ScrollText,
  Shield,
  BarChart3,
  ArrowRight,
  FileText,
  Presentation,
  Table2,
  FileSpreadsheet,
  Lock,
  Globe,
  Zap,
  Database,
  TrendingUp,
  Swords,
} from "lucide-react";
import { ResearchHistoryItem, saveToHistory, updateHistoryStatus } from "./lib/researchHistory";
import { useAuthStore } from "./stores/auth-store";

interface ResearchResult {
  status: string;
  task_id: string;
  output?: string;
  sources?: Array<{ title: string; url: string }>;
  pdf_url?: string;
  deliverables?: Array<{ type: string; title: string; url: string }>;
  progress?: { current_step: number; total_steps: number };
  messages?: Array<{ role: string; content: string | Array<Record<string, unknown>> }>;
  error?: string;
}

function setResearchParam(taskId: string | null) {
  const url = new URL(window.location.href);
  if (taskId) {
    url.searchParams.set("research", taskId);
  } else {
    url.searchParams.delete("research");
  }
  window.history.pushState(null, "", url.toString());
}

function HomeContent() {
  const searchParams = useSearchParams();
  const initialResearchId = searchParams.get("research");
  const { t } = useTranslation();

  const [researchResult, setResearchResult] = useState<ResearchResult | null>(null);
  const [isResearching, setIsResearching] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const [currentResearchTitle, setCurrentResearchTitle] = useState<string>("");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const cancelledRef = useRef(false);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeTaskRef = useRef<string | null>(null);
  const initialLoadRef = useRef(false);
  const getAccessToken = useAuthStore((state) => state.getAccessToken);
  const showSignInModal = useAuthStore((state) => state.showSignInModal);
  const openSignInModal = useAuthStore((state) => state.openSignInModal);
  const closeSignInModal = useAuthStore((state) => state.closeSignInModal);

  const clearPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const pollStatus = useCallback(
    async (taskId: string) => {
      if (cancelledRef.current) { clearPolling(); return; }
      try {
        const accessToken = getAccessToken();
        const statusUrl = accessToken
          ? `/api/auto-research/status?taskId=${taskId}&accessToken=${encodeURIComponent(accessToken)}`
          : `/api/auto-research/status?taskId=${taskId}`;
        const response = await fetch(statusUrl);
        if (activeTaskRef.current !== taskId) return;
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to fetch status");
        }
        const data = await response.json();
        setResearchResult(data);
        if (!currentResearchTitle && data.output) {
          const firstLine = data.output.split("\n").find((l: string) => l.trim());
          if (firstLine) setCurrentResearchTitle(firstLine.replace(/^#+\s*/, "").slice(0, 60));
        }
        if (data.status === "completed" || data.status === "failed" || data.status === "cancelled") {
          clearPolling();
          setIsResearching(false);
          updateHistoryStatus(taskId, data.status);
        }
      } catch (error) {
        console.error("Error polling research status:", error);
      }
    },
    [clearPolling, getAccessToken, currentResearchTitle]
  );

  useEffect(() => {
    if (initialLoadRef.current || !initialResearchId) return;
    initialLoadRef.current = true;
    activeTaskRef.current = initialResearchId;
    setCurrentTaskId(initialResearchId);
    setResearchResult({ status: "queued", task_id: initialResearchId });
    pollStatus(initialResearchId);
    pollIntervalRef.current = setInterval(() => pollStatus(initialResearchId), 10000);
  }, [initialResearchId, pollStatus]);

  const handleTaskCreated = useCallback(
    (taskId: string, title: string, researchType: string) => {
      clearPolling();
      activeTaskRef.current = taskId;
      setCurrentTaskId(taskId);
      setCurrentResearchTitle(title);
      setIsResearching(true);
      cancelledRef.current = false;
      setResearchResult({ status: "queued", task_id: taskId });
      setResearchParam(taskId);
      saveToHistory({ id: taskId, title, researchType, status: "queued" });
      track("research_started", { type: researchType });
      pollStatus(taskId);
      pollIntervalRef.current = setInterval(() => pollStatus(taskId), 10000);
    },
    [clearPolling, pollStatus]
  );

  const pollPublicStatus = useCallback(
    async (taskId: string) => {
      try {
        const response = await fetch(`/api/auto-research/public-status?taskId=${taskId}`);
        if (activeTaskRef.current !== taskId) return;
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || "Failed to fetch public report");
        }
        const data = await response.json();
        setResearchResult(data);
        if (!currentResearchTitle && data.output) {
          const firstLine = data.output.split("\n").find((l: string) => l.trim());
          if (firstLine) setCurrentResearchTitle(firstLine.replace(/^#+\s*/, "").slice(0, 60));
        }
        if (data.status === "completed" || data.status === "failed" || data.status === "cancelled") {
          clearPolling();
          setIsResearching(false);
        }
      } catch (error) {
        console.error("Error fetching public report:", error);
      }
    },
    [currentResearchTitle, clearPolling]
  );

  const handleSelectExample = useCallback(
    (taskId: string, title: string) => {
      clearPolling();
      activeTaskRef.current = taskId;
      cancelledRef.current = false;
      setCurrentTaskId(taskId);
      setCurrentResearchTitle(title);
      setResearchResult({ status: "queued", task_id: taskId });
      setResearchParam(taskId);
      track("example_viewed", { title });
      pollPublicStatus(taskId).then(() => {
        setResearchResult((prev) => {
          const isStillRunning = prev?.status === "queued" || prev?.status === "running";
          setIsResearching(isStillRunning);
          if (isStillRunning) {
            pollIntervalRef.current = setInterval(() => pollPublicStatus(taskId), 10000);
          }
          return prev;
        });
      });
    },
    [clearPolling, pollPublicStatus]
  );

  const handleSelectHistory = useCallback(
    (item: ResearchHistoryItem) => {
      clearPolling();
      activeTaskRef.current = item.id;
      cancelledRef.current = false;
      setCurrentTaskId(item.id);
      setCurrentResearchTitle(item.title);
      setResearchResult({ status: item.status || "queued", task_id: item.id });
      setResearchParam(item.id);
      track("history_viewed");
      const isInProgress = item.status === "queued" || item.status === "processing";
      setIsResearching(isInProgress);
      pollStatus(item.id);
      if (isInProgress) {
        pollIntervalRef.current = setInterval(() => pollStatus(item.id), 10000);
      }
    },
    [clearPolling, pollStatus]
  );

  const handleNewResearch = useCallback(() => {
    clearPolling();
    activeTaskRef.current = null;
    setIsResearching(false);
    setResearchResult(null);
    setCurrentTaskId(null);
    setCurrentResearchTitle("");
    cancelledRef.current = false;
    setResearchParam(null);
  }, [clearPolling]);

  const handleCancel = async () => {
    if (!currentTaskId) return;
    cancelledRef.current = true;
    activeTaskRef.current = null;
    clearPolling();
    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      const accessToken = getAccessToken();
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;
      await fetch("/api/auto-research/cancel", {
        method: "POST", headers, body: JSON.stringify({ taskId: currentTaskId }),
      });
    } catch (error) {
      console.error("Error cancelling research:", error);
    }
    setIsResearching(false);
    setResearchResult(null);
    setCurrentTaskId(null);
    setResearchParam(null);
  };

  const handleReset = () => {
    clearPolling();
    activeTaskRef.current = null;
    setIsResearching(false);
    setResearchResult(null);
    setCurrentTaskId(null);
    setCurrentResearchTitle("");
    cancelledRef.current = false;
    setResearchParam(null);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); setIsSidebarCollapsed(true); }
      else if (e.key === "ArrowRight") { e.preventDefault(); setIsSidebarCollapsed(false); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => { return () => { clearPolling(); }; }, [clearPolling]);

  const capabilities = useMemo(() => [
    { icon: Factory, title: t("capabilities.supplierTitle"), desc: t("capabilities.supplierDesc"), highlight: t("capabilities.supplierHighlight") },
    { icon: ScrollText, title: t("capabilities.patentTitle"), desc: t("capabilities.patentDesc"), highlight: t("capabilities.patentHighlight") },
    { icon: Shield, title: t("capabilities.regulatoryTitle"), desc: t("capabilities.regulatoryDesc"), highlight: t("capabilities.regulatoryHighlight") },
    { icon: Swords, title: t("capabilities.competitiveTitle"), desc: t("capabilities.competitiveDesc"), highlight: t("capabilities.competitiveHighlight") },
    { icon: TrendingUp, title: t("capabilities.marketTitle"), desc: t("capabilities.marketDesc"), highlight: t("capabilities.marketHighlight") },
    { icon: BarChart3, title: t("capabilities.productionTitle"), desc: t("capabilities.productionDesc"), highlight: t("capabilities.productionHighlight") },
    { icon: Cpu, title: t("capabilities.apiTitle"), desc: t("capabilities.apiDesc"), highlight: t("capabilities.apiHighlight") },
  ], [t]);

  const howItWorksSteps = useMemo(() => [
    { step: "01", icon: Database, title: t("howItWorks.step1Title"), desc: t("howItWorks.step1Desc") },
    { step: "02", icon: Zap, title: t("howItWorks.step2Title"), desc: t("howItWorks.step2Desc") },
    { step: "03", icon: FileText, title: t("howItWorks.step3Title"), desc: t("howItWorks.step3Desc") },
  ], [t]);

  const showResults = isResearching || researchResult;

  return (
    <div className="min-h-screen bg-background">
      <GitHubCorner />

      <button
        onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        className="fixed top-4 left-4 z-30 md:hidden p-2 bg-surface border border-border rounded-lg"
        aria-label="Toggle menu"
      >
        <Cpu className="w-5 h-5 text-primary" />
      </button>

      <div className="flex">
        <Sidebar
          onSelectHistory={handleSelectHistory}
          onNewResearch={handleNewResearch}
          currentResearchId={currentTaskId}
          isCollapsed={isSidebarCollapsed}
          onCollapsedChange={setIsSidebarCollapsed}
          mobileOpen={isMobileSidebarOpen}
          onMobileToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        <main className="flex-1 min-h-screen relative overflow-x-hidden">
          {!showResults ? (
            <div className="min-h-screen flex flex-col">
              {/* ─── Hero Section ─── */}
              <div className="flex-1 relative overflow-hidden">
                {/* Background image */}
                <div className="hero-bg-image" aria-hidden="true" />
                {/* Gradient overlay for readability */}
                <div className="hero-bg-overlay" aria-hidden="true" />
                {/* Animated aurora blobs on top */}
                <div className="aurora-bg" aria-hidden="true">
                  <div className="aurora-blob aurora-blob-1" />
                  <div className="aurora-blob aurora-blob-2" />
                  <div className="aurora-blob aurora-blob-3" />
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-8 sm:px-12 pt-20 sm:pt-24 lg:pt-28 pb-12 lg:pb-16">
                  <div className="flex flex-col lg:flex-row items-start gap-12 lg:gap-16">
                    {/* Left: Value Proposition */}
                    <div className="w-full lg:w-[45%] lg:pt-4">
                      <div className="fade-in-up">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-xs text-text-muted mb-8">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {t("hero.badge")}
                        </div>

                        <h1 className="text-4xl sm:text-5xl lg:text-[3.75rem] font-bold tracking-tight text-foreground leading-[1.05] mb-5">
                          <span className="gradient-text">Takt</span>
                        </h1>

                        <p className="text-base sm:text-lg text-text-muted leading-relaxed mb-8 max-w-md">
                          {t("hero.description")}
                        </p>

                        {/* Stats row */}
                        <div className="flex items-center gap-6 sm:gap-8 mb-8 fade-in-up fade-in-up-delay-1">
                          <div>
                            <div className="stat-value text-2xl font-bold text-foreground">100+</div>
                            <div className="text-[11px] text-text-muted mt-0.5">{t("hero.statSources")}</div>
                          </div>
                          <div className="w-px h-10 bg-border" />
                          <div>
                            <div className="stat-value text-2xl font-bold text-foreground">8.2M+</div>
                            <div className="text-[11px] text-text-muted mt-0.5">{t("hero.statPatents")}</div>
                          </div>
                          <div className="w-px h-10 bg-border" />
                          <div>
                            <div className="stat-value text-2xl font-bold text-foreground">&lt;10min</div>
                            <div className="text-[11px] text-text-muted mt-0.5">{t("hero.statTime")}</div>
                          </div>
                        </div>

                        {/* Deliverables */}
                        <div className="flex items-center gap-4 fade-in-up fade-in-up-delay-2">
                          <span className="text-[11px] text-text-muted uppercase tracking-wider font-medium">{t("hero.outputs")}</span>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-xs text-foreground/60">
                              <FileText className="w-3 h-3 text-red-400/80" />
                              PDF
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-foreground/60">
                              <Presentation className="w-3 h-3 text-orange-400/80" />
                              PPTX
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-foreground/60">
                              <Table2 className="w-3 h-3 text-green-400/80" />
                              XLSX
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-foreground/60">
                              <FileSpreadsheet className="w-3 h-3 text-blue-400/80" />
                              DOCX
                            </div>
                          </div>
                        </div>

                        {/* Trust signals */}
                        <div className="mt-8 pt-6 border-t border-border/50 fade-in-up fade-in-up-delay-3">
                          <div className="flex items-center gap-1.5 text-[10px] text-text-muted uppercase tracking-wider font-medium mb-2">
                            {t("hero.deployment")}
                          </div>
                          <div className="flex items-center flex-wrap gap-x-5 gap-y-1.5">
                            <div className="flex items-center gap-1.5 text-xs text-text-muted">
                              <Lock className="w-3 h-3" />
                              SOC 2
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-text-muted">
                              <Shield className="w-3 h-3" />
                              GDPR
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-text-muted">
                              <Globe className="w-3 h-3" />
                              {t("hero.euData")}
                            </div>
                          </div>
                          <p className="mt-2 text-[11px] text-text-muted">
                            {t("hero.ukGov")}{" "}
                            <a
                              href="mailto:contact@valyu.ai"
                              className="text-primary hover:underline"
                            >
                              contact@valyu.ai
                            </a>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Research Form */}
                    <div className="w-full lg:w-[55%]">
                      <div className="max-w-xl w-full fade-in-up fade-in-up-delay-1">
                        <div className="research-form-container">
                          <AutoResearchForm
                            onTaskCreated={handleTaskCreated}
                            isResearching={isResearching}
                          />
                        </div>

                        {/* Example Reports */}
                        <div className="mt-5">
                          <ExampleReports onSelectExample={handleSelectExample} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── Research Capabilities ─── */}
              <div className="border-t border-border">
                <div className="max-w-7xl mx-auto px-8 sm:px-12 py-10">
                  <div className="text-center mb-8">
                    <h2 className="text-lg font-semibold text-foreground mb-2">{t("capabilities.heading")}</h2>
                    <p className="text-sm text-text-muted max-w-lg mx-auto">
                      {t("capabilities.subheading")}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-5">
                    {capabilities.map((f, i) => {
                      const Icon = f.icon;
                      return (
                        <div key={f.title} className={`fade-in-up fade-in-up-delay-${i + 2} p-4 rounded-lg border border-border bg-surface/30 hover:bg-surface/60 transition-colors`}>
                          <div className="flex items-center gap-2 mb-2">
                            <div className="w-7 h-7 rounded-md bg-primary/8 border border-primary/15 flex items-center justify-center">
                              <Icon className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <span className="text-sm font-semibold text-foreground">{f.title}</span>
                          </div>
                          <p className="text-xs text-text-muted leading-relaxed mb-3">{f.desc}</p>
                          <p className="text-[10px] text-primary/80 font-medium">{f.highlight}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ─── How it works ─── */}
              <div className="border-t border-border">
                <div className="max-w-7xl mx-auto px-8 sm:px-12 py-10">
                  <div className="text-center mb-8">
                    <h2 className="text-lg font-semibold text-foreground mb-2">{t("howItWorks.heading")}</h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                    {howItWorksSteps.map((s) => {
                      const Icon = s.icon;
                      return (
                        <div key={s.step} className="text-center">
                          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-primary/8 border border-primary/15 mb-3">
                            <Icon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="text-[10px] font-bold text-primary/60 uppercase tracking-widest mb-1">{t("howItWorks.step")} {s.step}</div>
                          <h3 className="text-sm font-semibold text-foreground mb-1.5">{s.title}</h3>
                          <p className="text-xs text-text-muted leading-relaxed">{s.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ─── Data Sources Showcase ─── */}
              <div className="border-t border-border">
                <div className="max-w-7xl mx-auto px-8 sm:px-12 py-10">
                  <div className="text-center mb-6">
                    <h2 className="text-lg font-semibold text-foreground mb-2">{t("dataSources.heading")}</h2>
                    <p className="text-sm text-text-muted max-w-lg mx-auto">
                      {t("dataSources.subheading")}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[
                      { name: "USPTO Patents", count: "8.2M+", category: "IP" },
                      { name: "EPO Espacenet", count: "110M+", category: "IP" },
                      { name: "WIPO Patents", count: "99M+", category: "IP" },
                      { name: "SEC EDGAR", count: "Filings", category: "Financial" },
                      { name: "NHTSA", count: "Recalls", category: "Safety" },
                      { name: "Euro NCAP", count: "Ratings", category: "Safety" },
                      { name: "OICA", count: "Production", category: "Industry" },
                      { name: "IEA EV Data", count: "Global", category: "EV" },
                      { name: "FRED", count: "840K+ series", category: "Economic" },
                      { name: "UNECE WP.29", count: "Regulations", category: "Regulatory" },
                      { name: "arXiv", count: "2.4M+", category: "Research" },
                      { name: "Web", count: "Billions", category: "General" },
                    ].map((source) => (
                      <div key={source.name} className="p-3 rounded-lg border border-border bg-surface/30 text-center">
                        <div className="text-xs font-semibold text-foreground">{source.name}</div>
                        <div className="text-[10px] text-text-muted mt-0.5">{source.count}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ─── Enterprise CTA ─── */}
              <div className="border-t border-border">
                <div className="max-w-7xl mx-auto px-8 sm:px-12 py-12">
                  <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-primary/[0.03] p-8 sm:p-10">
                    <div className="relative z-10 max-w-2xl mx-auto text-center">
                      <h2 className="text-xl sm:text-2xl font-bold text-foreground mb-3">
                        {t("cta.heading")}
                      </h2>
                      <p className="text-sm text-text-muted mb-3 max-w-lg mx-auto">
                        {t("cta.desc1")}
                      </p>
                      <p className="text-sm text-text-muted mb-6 max-w-lg mx-auto">
                        {t("cta.desc2")}
                      </p>
                      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                        <a
                          href={process.env.NEXT_PUBLIC_CALENDLY_URL || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-primary px-6 py-3 text-sm flex items-center gap-2"
                        >
                          {t("cta.bookDemo")}
                          <ArrowRight className="w-4 h-4" />
                        </a>
                        <a
                          href="https://docs.valyu.ai/guides/deepresearch-quickstart"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary px-6 py-3 text-sm flex items-center gap-2"
                        >
                          {t("cta.apiDocs")}
                          <ArrowRight className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ─── Footer ─── */}
              <div className="border-t border-border">
                <div className="max-w-7xl mx-auto px-8 sm:px-12 py-6">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    <span className="text-xs text-text-muted">
                      {t("footer.poweredBy")}{" "}
                      <a href="https://valyu.ai" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline font-medium">
                        Valyu DeepResearch API
                      </a>
                    </span>
                    <div className="flex items-center gap-4">
                      <a
                        href="https://github.com/yorkeccak/takt"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-text-muted hover:text-foreground transition-colors"
                      >
                        GitHub
                      </a>
                      <a
                        href="https://docs.valyu.ai/guides/deepresearch-quickstart"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-text-muted hover:text-foreground transition-colors flex items-center gap-1"
                      >
                        {t("footer.apiDocs")} <ArrowRight className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6 sm:p-8 md:p-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/8 border border-primary/15 rounded-xl flex items-center justify-center">
                    <Cpu className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold">
                      <span className="gradient-text">Takt</span>
                    </h1>
                    {currentResearchTitle && (
                      <p className="text-xs sm:text-sm text-text-muted">{currentResearchTitle}</p>
                    )}
                  </div>
                </div>
              </div>
              <ResearchResults result={researchResult} onCancel={handleCancel} onReset={handleReset} />
            </div>
          )}
        </main>
      </div>

      <SignInModal
        open={showSignInModal}
        onOpenChange={(open) => open ? openSignInModal() : closeSignInModal()}
      />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <HomeContent />
    </Suspense>
  );
}
