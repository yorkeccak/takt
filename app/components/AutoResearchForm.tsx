"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Factory,
  ScrollText,
  Shield,
  Swords,
  ChevronDown,
  ChevronUp,
  Loader2,
  ArrowRight,
  TrendingUp,
  BarChart3,
} from "lucide-react";
import { useAuthStore } from "@/app/stores/auth-store";
import { useTranslation } from "@/app/i18n";
import { track } from "@/app/providers";

const APP_MODE = process.env.NEXT_PUBLIC_APP_MODE || "self-hosted";

interface AutoResearchFormProps {
  onTaskCreated: (taskId: string, title: string, researchType: string) => void;
  isResearching: boolean;
}

type ResearchType = "supplier" | "patent" | "regulatory" | "competitive" | "market" | "production" | "custom";

export default function AutoResearchForm({
  onTaskCreated,
  isResearching,
}: AutoResearchFormProps) {
  const [researchType, setResearchType] = useState<ResearchType>("supplier");
  const [researchSubject, setResearchSubject] = useState("");
  const [researchFocus, setResearchFocus] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [industryContext, setIndustryContext] = useState("");
  const [specificQuestions, setSpecificQuestions] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { t } = useTranslation();

  const getAccessToken = useAuthStore((state) => state.getAccessToken);
  const openSignInModal = useAuthStore((state) => state.openSignInModal);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const researchTypes = useMemo(() => [
    {
      id: "supplier" as ResearchType,
      label: t("form.supplierLabel"),
      icon: Factory,
      placeholder: t("form.supplierPlaceholder"),
      description: t("form.supplierDesc"),
    },
    {
      id: "patent" as ResearchType,
      label: t("form.patentLabel"),
      icon: ScrollText,
      placeholder: t("form.patentPlaceholder"),
      description: t("form.patentDesc"),
    },
    {
      id: "regulatory" as ResearchType,
      label: t("form.regulatoryLabel"),
      icon: Shield,
      placeholder: t("form.regulatoryPlaceholder"),
      description: t("form.regulatoryDesc"),
    },
    {
      id: "competitive" as ResearchType,
      label: t("form.competitiveLabel"),
      icon: Swords,
      placeholder: t("form.competitivePlaceholder"),
      description: t("form.competitiveDesc"),
    },
    {
      id: "market" as ResearchType,
      label: t("form.marketLabel"),
      icon: TrendingUp,
      placeholder: t("form.marketPlaceholder"),
      description: t("form.marketDesc"),
    },
    {
      id: "production" as ResearchType,
      label: t("form.productionLabel"),
      icon: BarChart3,
      placeholder: t("form.productionPlaceholder"),
      description: t("form.productionDesc"),
    },
    {
      id: "custom" as ResearchType,
      label: t("form.customLabel"),
      icon: Search,
      placeholder: t("form.customPlaceholder"),
      description: t("form.customDesc"),
    },
  ], [t]);

  const quickExamples: Record<ResearchType, string[]> = useMemo(() => ({
    supplier: [t("quickExamples.supplier1"), t("quickExamples.supplier2"), t("quickExamples.supplier3")],
    patent: [t("quickExamples.patent1"), t("quickExamples.patent2"), t("quickExamples.patent3")],
    regulatory: [t("quickExamples.regulatory1"), t("quickExamples.regulatory2"), t("quickExamples.regulatory3")],
    competitive: [t("quickExamples.competitive1"), t("quickExamples.competitive2"), t("quickExamples.competitive3")],
    market: [t("quickExamples.market1"), t("quickExamples.market2"), t("quickExamples.market3")],
    production: [t("quickExamples.production1"), t("quickExamples.production2"), t("quickExamples.production3")],
    custom: [],
  }), [t]);

  const selectedType = researchTypes.find((rt) => rt.id === researchType)!;
  const isValyuMode = APP_MODE !== "self-hosted";

  useEffect(() => {
    const savedData = localStorage.getItem("auto_research_pending");
    if (savedData && isAuthenticated) {
      try {
        const data = JSON.parse(savedData);
        setResearchType(data.researchType);
        setResearchSubject(data.researchSubject);
        setResearchFocus(data.researchFocus);
        setIndustryContext(data.industryContext);
        setSpecificQuestions(data.specificQuestions);
        localStorage.removeItem("auto_research_pending");
      } catch (e) {
        console.error("Failed to restore form data:", e);
      }
    }
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!researchSubject.trim()) {
      setError(t("form.errorEmpty"));
      return;
    }

    if (isValyuMode && !isAuthenticated) {
      const formData = {
        researchType,
        researchSubject: researchSubject.trim(),
        researchFocus: researchFocus.trim(),
        industryContext: industryContext.trim(),
        specificQuestions: specificQuestions.trim(),
      };
      localStorage.setItem("auto_research_pending", JSON.stringify(formData));
      openSignInModal();
      return;
    }

    setIsSubmitting(true);
    track("research_submitted", { type: researchType });

    try {
      const headers: HeadersInit = { "Content-Type": "application/json" };
      const accessToken = getAccessToken();
      if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`;

      const response = await fetch("/api/auto-research", {
        method: "POST",
        headers,
        body: JSON.stringify({
          researchType,
          researchSubject: researchSubject.trim(),
          researchFocus: researchFocus.trim(),
          industryContext: industryContext.trim(),
          specificQuestions: specificQuestions.trim(),
        }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to start research";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.message || errorMessage;
        } catch {
          errorMessage = response.statusText || errorMessage;
        }
        if (response.status === 401) openSignInModal();
        throw new Error(errorMessage);
      }

      const data = await response.json();
      localStorage.removeItem("auto_research_pending");
      onTaskCreated(data.deepresearch_id, researchSubject.trim(), researchType);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickSelect = (example: string) => {
    setResearchSubject(example);
    localStorage.removeItem("auto_research_pending");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Research Type Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {researchTypes.map((type) => {
          const Icon = type.icon;
          return (
            <button
              key={type.id}
              type="button"
              onClick={() => { setResearchType(type.id); setResearchSubject(""); }}
              className={`research-type-tab ${researchType === type.id ? "active" : ""}`}
            >
              {researchType === type.id && <Icon className="w-3.5 h-3.5" />}
              <span>{type.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Input */}
      <div>
        <input
          type="text"
          value={researchSubject}
          onChange={(e) => setResearchSubject(e.target.value)}
          placeholder={selectedType.placeholder}
          className="input-field text-sm"
          required
          disabled={isSubmitting || isResearching}
        />

        {quickExamples[researchType].length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {quickExamples[researchType].slice(0, 3).map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => handleQuickSelect(example)}
                className="example-chip"
                disabled={isSubmitting || isResearching}
              >
                {example}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Advanced Options (includes research focus) */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="flex items-center gap-1.5 text-xs text-text-muted hover:text-foreground transition-colors"
      >
        {showAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        {t("form.refine")}
      </button>

      {showAdvanced && (
        <div className="space-y-4 p-4 bg-background rounded-lg border border-border">
          <div>
            <label htmlFor="researchFocus" className="block text-xs font-medium text-text-muted mb-1.5">
              {t("form.focusLabel")}
            </label>
            <textarea
              id="researchFocus"
              value={researchFocus}
              onChange={(e) => setResearchFocus(e.target.value)}
              placeholder={t("form.focusPlaceholder")}
              className="input-field resize-none h-16 text-sm"
              disabled={isSubmitting || isResearching}
            />
          </div>
          <div>
            <label htmlFor="industryContext" className="block text-xs font-medium text-text-muted mb-1.5">
              {t("form.contextLabel")}
            </label>
            <textarea
              id="industryContext"
              value={industryContext}
              onChange={(e) => setIndustryContext(e.target.value)}
              placeholder={t("form.contextPlaceholder")}
              className="input-field resize-none h-14 text-sm"
              disabled={isSubmitting || isResearching}
            />
          </div>
          <div>
            <label htmlFor="specificQuestions" className="block text-xs font-medium text-text-muted mb-1.5">
              {t("form.questionsLabel")}
            </label>
            <textarea
              id="specificQuestions"
              value={specificQuestions}
              onChange={(e) => setSpecificQuestions(e.target.value)}
              placeholder={t("form.questionsPlaceholder")}
              className="input-field resize-none h-16 text-sm"
              disabled={isSubmitting || isResearching}
            />
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-3 bg-error/10 border border-error/20 rounded-lg text-error text-xs">
          {error}
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isSubmitting || isResearching || !researchSubject.trim()}
        className="btn-primary w-full flex items-center justify-center gap-2 py-3 text-sm"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            {t("form.submitting")}
          </>
        ) : (
          <>
            {t("form.submit")}
            <ArrowRight className="w-4 h-4" />
          </>
        )}
      </button>
    </form>
  );
}
