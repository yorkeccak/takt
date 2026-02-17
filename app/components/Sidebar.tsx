"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Factory,
  ScrollText,
  Shield,
  Swords,
  Search,
  ChevronLeft,
  HelpCircle,
  Sun,
  Moon,
  BookOpen,
  History,
  Trash2,
  Clock,
  CheckCircle,
  Loader2,
  XCircle,
  Plus,
  Lock,
  X,
  LogOut,
  User as UserIcon,
  Building2,
  Cpu,
} from "lucide-react";
import { ResearchHistoryItem, getResearchHistory, removeFromHistory, clearHistory } from "@/app/lib/researchHistory";
import { useAuthStore } from "@/app/stores/auth-store";
import { useThemeStore } from "@/app/stores/theme-store";
import { useTranslation } from "@/app/i18n";
import { useLocaleStore } from "@/app/stores/locale-store";
import EnterpriseContactModal from "./EnterpriseContactModal";

const APP_MODE = process.env.NEXT_PUBLIC_APP_MODE || "self-hosted";
const IS_ENTERPRISE = process.env.NEXT_PUBLIC_ENTERPRISE === "true";

interface SidebarProps {
  onSelectHistory?: (item: ResearchHistoryItem) => void;
  onNewResearch?: () => void;
  currentResearchId?: string | null;
  isCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  mobileOpen?: boolean;
  onMobileToggle?: () => void;
}

export default function Sidebar({
  onSelectHistory,
  onNewResearch,
  currentResearchId,
  isCollapsed: controlledCollapsed,
  onCollapsedChange,
  mobileOpen = false,
  onMobileToggle,
}: SidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(true);
  const isCollapsed = controlledCollapsed ?? internalCollapsed;
  const setIsCollapsed = (value: boolean) => {
    setInternalCollapsed(value);
    onCollapsedChange?.(value);
  };
  const [history, setHistory] = useState<ResearchHistoryItem[]>([]);
  const [showEnterpriseModal, setShowEnterpriseModal] = useState(false);

  const { isAuthenticated, openSignInModal, user, signOut } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const { t } = useTranslation();
  const { locale, toggleLocale } = useLocaleStore();

  const bottomItems = useMemo(() => [
    { icon: BookOpen, label: t("sidebar.docs"), href: "https://docs.valyu.ai/guides/deepresearch-quickstart" },
    { icon: HelpCircle, label: t("sidebar.discussions"), href: "https://github.com/yorkeccak/takt/discussions" },
  ], [t]);

  const isValyuMode = APP_MODE === "valyu";
  const canViewHistory = !isValyuMode || isAuthenticated;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "d" && !e.metaKey && !e.ctrlKey && !e.altKey && !e.shiftKey) {
        const target = e.target as HTMLElement;
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA" && !target.isContentEditable) {
          e.preventDefault();
          window.open("https://docs.valyu.ai/guides/deepresearch-quickstart", "_blank", "noopener,noreferrer");
        }
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (!canViewHistory) return;

    const fetchHistory = async () => {
      try {
        const { getAccessToken } = useAuthStore.getState();
        const accessToken = getAccessToken();
        const url = accessToken
          ? `/api/auto-research/list?accessToken=${encodeURIComponent(accessToken)}`
          : `/api/auto-research/list`;
        const response = await fetch(url);
        if (!response.ok) throw new Error("List API " + response.status);
        const data = await response.json();
        if (data.tasks && data.tasks.length > 0) {
          const mapped: ResearchHistoryItem[] = data.tasks.map(
            (task: { deepresearch_id: string; query: string; status: string; created_at?: string | number }) => {
              let createdAt = Date.now();
              if (task.created_at) {
                const parsed = typeof task.created_at === "string"
                  ? new Date(task.created_at).getTime()
                  : task.created_at < 1e12 ? task.created_at * 1000 : task.created_at;
                if (!isNaN(parsed)) createdAt = parsed;
              }
              return {
                id: task.deepresearch_id,
                title: task.query,
                researchType: "custom",
                createdAt,
                status: task.status as ResearchHistoryItem["status"],
              };
            }
          );
          setHistory(mapped);
          return;
        }
      } catch {
        // Fall through to localStorage
      }
      const localHistory = getResearchHistory();
      if (localHistory.length > 0) {
        setHistory(localHistory);
      }
    };

    fetchHistory();
    const interval = setInterval(fetchHistory, 30000);
    return () => clearInterval(interval);
  }, [canViewHistory]);

  const handleRemoveItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeFromHistory(id);
    setHistory((prev) => prev.filter((h) => h.id !== id));
  };

  const handleClearHistory = () => {
    if (confirm(t("sidebar.clearConfirm"))) {
      clearHistory();
      setHistory([]);
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-3 h-3 text-green-500" />;
      case "processing":
      case "queued":
        return <Loader2 className="w-3 h-3 text-primary animate-spin" />;
      case "failed":
      case "cancelled":
        return <XCircle className="w-3 h-3 text-red-500" />;
      default:
        return <Clock className="w-3 h-3 text-text-muted" />;
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t("sidebar.justNow");
    if (diffMins < 60) return t("sidebar.mAgo", { count: diffMins });
    if (diffHours < 24) return t("sidebar.hAgo", { count: diffHours });
    if (diffDays < 7) return t("sidebar.dAgo", { count: diffDays });
    return date.toLocaleDateString();
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "supplier": return Factory;
      case "patent": return ScrollText;
      case "regulatory": return Shield;
      case "competitive": return Swords;
      default: return Search;
    }
  };

  const handleHistorySelect = (item: ResearchHistoryItem) => {
    onSelectHistory?.(item);
    if (onMobileToggle && mobileOpen) {
      onMobileToggle();
    }
  };

  const renderHistoryList = () => {
    if (!canViewHistory) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <Lock className="w-8 h-8 text-text-muted mb-2" />
          <p className="text-sm text-text-muted">{t("sidebar.signInForHistory")}</p>
          <p className="text-xs text-text-muted mt-1">{t("sidebar.historySaved")}</p>
          <button onClick={openSignInModal} className="mt-4 px-4 py-2 bg-primary text-white text-sm rounded-lg hover:bg-primary/90 transition-colors">
            {t("sidebar.signIn")}
          </button>
        </div>
      );
    }
    if (history.length === 0) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <History className="w-8 h-8 text-text-muted mb-2" />
          <p className="text-sm text-text-muted">{t("sidebar.noHistory")}</p>
          <p className="text-xs text-text-muted mt-1">{t("sidebar.historyAppear")}</p>
        </div>
      );
    }
    return (
      <>
        <div className="flex-1 overflow-y-auto p-2">
          <div className="space-y-1">
            {history.map((item) => {
              const TypeIcon = getTypeIcon(item.researchType);
              const isActive = currentResearchId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => handleHistorySelect(item)}
                  className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left group cursor-pointer ${
                    isActive ? "bg-primary/10 text-primary" : "hover:bg-surface-hover text-foreground"
                  }`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") handleHistorySelect(item); }}
                >
                  <TypeIcon className="w-4 h-4 mt-0.5 flex-shrink-0 text-text-muted" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{item.title}</div>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(item.status)}
                      <span className="text-xs text-text-muted">{formatDate(item.createdAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => handleRemoveItem(item.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-error/10 rounded transition-all"
                    title={t("sidebar.removeItem")}
                  >
                    <Trash2 className="w-3 h-3 text-error" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
        <div className="p-2 border-t border-border">
          <button
            onClick={handleClearHistory}
            className="w-full flex items-center justify-center gap-2 p-2 text-sm text-text-muted hover:text-error hover:bg-error/5 rounded-lg transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            {t("sidebar.clearHistory")}
          </button>
        </div>
      </>
    );
  };

  const renderBottomItems = (showLabels: boolean) => (
    <div className="space-y-1">
      {bottomItems.map((item, index) => {
        const Icon = item.icon;
        const isDocsLink = item.label === t("sidebar.docs");
        return (
          <a
            key={index}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors text-text-muted text-left"
            title={!showLabels ? item.label : undefined}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {showLabels && (
              <>
                <span className="text-sm truncate">{item.label}</span>
                {isDocsLink && (
                  <div className="flex items-center gap-1 bg-muted border border-border px-1.5 py-0.5 rounded text-xs text-muted-foreground ml-auto">
                    <span>D</span>
                  </div>
                )}
              </>
            )}
          </a>
        );
      })}
      {IS_ENTERPRISE && (
        <button
          onClick={() => setShowEnterpriseModal(true)}
          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors text-text-muted text-left"
          title={!showLabels ? t("sidebar.enterprise") : undefined}
        >
          <Building2 className="w-5 h-5 flex-shrink-0" />
          {showLabels && <span className="text-sm truncate">{t("sidebar.enterprise")}</span>}
        </button>
      )}
      <button
        onClick={toggleLocale}
        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors text-text-muted text-left"
        title={!showLabels ? (locale === "en" ? t("locale.de") : t("locale.en")) : undefined}
      >
        <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center text-xs font-bold">
          {locale === "en" ? "DE" : "EN"}
        </span>
        {showLabels && (
          <span className="text-sm truncate">
            {locale === "en" ? t("locale.de") : t("locale.en")}
          </span>
        )}
      </button>
      <button
        onClick={toggleTheme}
        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors text-text-muted text-left"
        title={!showLabels ? (theme === "light" ? t("sidebar.switchDark") : t("sidebar.switchLight")) : undefined}
      >
        {theme === "light" ? <Moon className="w-5 h-5 flex-shrink-0" /> : <Sun className="w-5 h-5 flex-shrink-0" />}
        {showLabels && <span className="text-sm truncate">{theme === "light" ? t("sidebar.darkMode") : t("sidebar.lightMode")}</span>}
      </button>
    </div>
  );

  const renderUserProfile = (showLabels: boolean) => {
    if (isAuthenticated && user) {
      if (!showLabels) {
        return (
          <button onClick={() => setIsCollapsed(false)} className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-surface-hover transition-colors" title={user.name || user.email}>
            <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">{(user.name || user.email || "U").charAt(0).toUpperCase()}</span>
            </div>
          </button>
        );
      }
      return (
        <div className="flex items-center gap-3 p-2">
          <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
            <span className="text-sm font-semibold text-primary">{(user.name || user.email || "U").charAt(0).toUpperCase()}</span>
          </div>
          <div className="flex-1 min-w-0">
            {user.name && <p className="text-sm font-medium text-foreground truncate">{user.name}</p>}
            <p className="text-xs text-text-muted truncate">{user.email}</p>
          </div>
          <button onClick={signOut} className="p-1.5 rounded-lg hover:bg-error/10 transition-colors flex-shrink-0" title={t("sidebar.signOut")}>
            <LogOut className="w-4 h-4 text-text-muted hover:text-error" />
          </button>
        </div>
      );
    }
    if (isValyuMode) {
      if (!showLabels) {
        return (
          <button onClick={openSignInModal} className="w-full flex items-center justify-center p-2 rounded-lg hover:bg-surface-hover transition-colors" title={t("sidebar.signIn")}>
            <UserIcon className="w-5 h-5 text-text-muted" />
          </button>
        );
      }
      return (
        <button onClick={openSignInModal} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-surface-hover transition-colors text-text-muted text-left">
          <UserIcon className="w-5 h-5 flex-shrink-0" />
          <span className="text-sm">{t("sidebar.signIn")}</span>
        </button>
      );
    }
    return null;
  };

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300" onClick={onMobileToggle} />
      )}

      {/* Desktop Sidebar */}
      <aside className={`hidden md:flex flex-col border-r border-border bg-surface transition-all duration-300 h-screen sticky top-0 z-20 relative ${isCollapsed ? "w-16" : "w-72"}`}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <Link href="/" onClick={() => onNewResearch?.()} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="relative w-9 h-9 flex-shrink-0 bg-primary/10 rounded-lg flex items-center justify-center">
                <Cpu className="w-5 h-5 text-primary" />
              </div>
              {!isCollapsed && <span className="font-semibold text-sm">Takt</span>}
            </Link>
            {!isCollapsed && (
              <button onClick={() => setIsCollapsed(true)} className="p-1.5 hover:bg-surface-hover rounded-lg transition-colors" aria-label={t("sidebar.collapse")}>
                <ChevronLeft className="w-4 h-4 text-text-muted" />
              </button>
            )}
          </div>
        </div>

        {!isCollapsed && isAuthenticated && (
          <div className="p-2 border-b border-border">
            <button onClick={onNewResearch} className="w-full flex items-center justify-center gap-2 p-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">{t("sidebar.newResearch")}</span>
            </button>
          </div>
        )}

        {!isCollapsed && (
          <div className="px-4 py-3 border-b border-border">
            <div className="flex items-center gap-2 text-sm font-medium text-text-muted">
              <History className="w-4 h-4" />
              <span>{t("sidebar.history")}</span>
              {history.length > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded-full">{history.length}</span>
              )}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-hidden">
          {isCollapsed ? (
            <nav className="p-2">
              <div className="space-y-1">
                {isAuthenticated && (
                  <button onClick={onNewResearch} className="w-full flex items-center justify-center p-3 rounded-lg hover:bg-surface-hover transition-colors text-primary" title={t("sidebar.newResearch")}>
                    <Plus className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={() => { if (canViewHistory) { setIsCollapsed(false); } else { openSignInModal(); } }}
                  className="w-full flex items-center justify-center p-3 rounded-lg hover:bg-surface-hover transition-colors text-text-muted"
                  title={canViewHistory ? t("sidebar.history") : t("sidebar.signInForHistory")}
                >
                  {canViewHistory ? <History className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                </button>
              </div>
            </nav>
          ) : (
            <div className="flex flex-col h-full">{renderHistoryList()}</div>
          )}
        </div>

        <div className="p-2 border-t border-border">{renderBottomItems(!isCollapsed)}</div>
        <div className="p-2 border-t border-border">{renderUserProfile(!isCollapsed)}</div>

        <div
          className="absolute -right-3 top-1/2 -translate-y-1/2 z-50 cursor-pointer group"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? t("sidebar.expand") : t("sidebar.collapse")}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setIsCollapsed(!isCollapsed); } }}
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full border bg-surface group-hover:bg-surface-hover shadow-sm transition-colors">
            {isCollapsed ? (
              <span className="text-[10px] font-medium text-text-muted group-hover:text-foreground">&rarr;</span>
            ) : (
              <span className="text-[10px] font-medium text-text-muted group-hover:text-foreground">&larr;</span>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <aside className={`fixed top-0 left-0 h-screen w-72 bg-surface border-r border-border z-50 md:hidden flex flex-col transform transition-transform duration-300 ease-in-out ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <Link href="/" onClick={() => onNewResearch?.()} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="relative w-9 h-9 flex-shrink-0 bg-primary/10 rounded-lg flex items-center justify-center">
                <Cpu className="w-5 h-5 text-primary" />
              </div>
              <span className="font-semibold text-sm">Takt</span>
            </Link>
            <button onClick={onMobileToggle} className="p-1.5 hover:bg-surface-hover rounded-lg transition-colors" aria-label={t("sidebar.close")}>
              <X className="w-5 h-5 text-text-muted" />
            </button>
          </div>
        </div>

        {isAuthenticated && (
          <div className="p-2 border-b border-border">
            <button onClick={() => { onNewResearch?.(); onMobileToggle?.(); }} className="w-full flex items-center justify-center gap-2 p-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" />
              <span className="text-sm font-medium">{t("sidebar.newResearch")}</span>
            </button>
          </div>
        )}

        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2 text-sm font-medium text-text-muted">
            <History className="w-4 h-4" />
            <span>{t("sidebar.history")}</span>
            {history.length > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded-full">{history.length}</span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-hidden">
          <div className="flex flex-col h-full">{renderHistoryList()}</div>
        </div>

        <div className="p-2 border-t border-border">{renderBottomItems(true)}</div>
        <div className="p-2 border-t border-border">{renderUserProfile(true)}</div>
      </aside>

      <EnterpriseContactModal open={showEnterpriseModal} onClose={() => setShowEnterpriseModal(false)} />
    </>
  );
}
