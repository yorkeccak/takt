export interface ResearchHistoryItem {
  id: string;
  title: string;
  researchType: string;
  createdAt: number;
  status?: "queued" | "processing" | "completed" | "failed" | "cancelled";
}

const STORAGE_KEY = "auto_research_history";
const MAX_HISTORY_ITEMS = 50;

export function getResearchHistory(): ResearchHistoryItem[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored) as ResearchHistoryItem[];
  } catch (error) {
    console.error("Failed to load research history:", error);
    return [];
  }
}

export function saveToHistory(item: Omit<ResearchHistoryItem, "createdAt">): void {
  if (typeof window === "undefined") return;

  try {
    const history = getResearchHistory();
    const existingIndex = history.findIndex((h) => h.id === item.id);

    const newItem: ResearchHistoryItem = {
      ...item,
      createdAt: Date.now(),
    };

    if (existingIndex !== -1) {
      history[existingIndex] = { ...history[existingIndex], ...newItem };
    } else {
      history.unshift(newItem);
    }

    const trimmedHistory = history.slice(0, MAX_HISTORY_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedHistory));
  } catch (error) {
    console.error("Failed to save to research history:", error);
  }
}

export function updateHistoryStatus(
  id: string,
  status: ResearchHistoryItem["status"]
): void {
  if (typeof window === "undefined") return;

  try {
    const history = getResearchHistory();
    const index = history.findIndex((h) => h.id === id);

    if (index !== -1) {
      history[index].status = status;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    }
  } catch (error) {
    console.error("Failed to update research history status:", error);
  }
}

export function removeFromHistory(id: string): void {
  if (typeof window === "undefined") return;

  try {
    const history = getResearchHistory();
    const filtered = history.filter((h) => h.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to remove from research history:", error);
  }
}

export function clearHistory(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear research history:", error);
  }
}

export function getHistoryItem(id: string): ResearchHistoryItem | undefined {
  const history = getResearchHistory();
  return history.find((h) => h.id === id);
}
