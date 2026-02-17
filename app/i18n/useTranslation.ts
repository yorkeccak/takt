"use client";

import { useCallback } from "react";
import { useLocaleStore } from "@/app/stores/locale-store";
import { translations } from "./translations";

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split(".");
  let current: unknown = obj;
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== "object") return path;
    current = (current as Record<string, unknown>)[key];
  }
  return typeof current === "string" ? current : path;
}

export function useTranslation() {
  const locale = useLocaleStore((state) => state.locale);
  const dict = translations[locale];

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      let value = getNestedValue(dict as unknown as Record<string, unknown>, key);
      if (params) {
        for (const [paramKey, paramValue] of Object.entries(params)) {
          value = value.replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, "g"), String(paramValue));
        }
      }
      return value;
    },
    [dict]
  );

  return { t, locale };
}
