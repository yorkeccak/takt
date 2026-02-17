"use client";

import { Analytics } from "@vercel/analytics/next";
import { track } from "@vercel/analytics";

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Analytics />
    </>
  );
}

export { track };
