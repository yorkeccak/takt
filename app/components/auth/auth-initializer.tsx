"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/app/stores/auth-store";
import { useThemeStore } from "@/app/stores/theme-store";
import { useLocaleStore } from "@/app/stores/locale-store";

export function AuthInitializer({ children }: { children: React.ReactNode }) {
  const initializeAuth = useAuthStore((state) => state.initialize);
  const initializeTheme = useThemeStore((state) => state.initialize);
  const initializeLocale = useLocaleStore((state) => state.initialize);

  useEffect(() => {
    initializeAuth();
    initializeTheme();
    initializeLocale();
  }, [initializeAuth, initializeTheme, initializeLocale]);

  return <>{children}</>;
}
