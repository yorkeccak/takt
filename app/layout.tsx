import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { AnalyticsProvider } from "./providers";
import { AuthInitializer } from "@/app/components/auth/auth-initializer";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://takt.valyu.ai"
  ),
  title: "Takt | AI-Powered Automotive Intelligence",
  description:
    "Deep research for automotive procurement, R&D, and strategy teams. Supplier due diligence, patent landscapes, regulatory tracking, and competitive intelligence - in minutes, not weeks. Powered by Valyu DeepResearch API.",
  keywords: [
    "automotive intelligence",
    "supplier due diligence",
    "patent landscape analysis",
    "regulatory compliance automotive",
    "competitive analysis automotive",
    "automotive AI research",
    "supply chain intelligence",
    "OEM research platform",
    "automotive procurement",
    "LkSG compliance",
    "EU Battery Regulation",
  ],
  authors: [{ name: "Valyu" }],
  creator: "Valyu",
  publisher: "Valyu",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/nabla.png", type: "image/png", sizes: "213x213" },
    ],
    apple: [{ url: "/nabla.png" }],
  },
  openGraph: {
    title: "Takt | AI-Powered Automotive Intelligence",
    description:
      "Supplier due diligence, patent landscapes, regulatory tracking, and competitive intelligence for automotive teams. Board-ready reports in minutes.",
    type: "website",
    siteName: "Takt",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Takt | Automotive Intelligence in Minutes",
    description:
      "AI-powered research for automotive procurement, R&D, and strategy. Supplier due diligence, patent landscapes, and regulatory tracking.",
    creator: "@valaboratory",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("theme");if(t==="light"){document.documentElement.classList.remove("dark");document.documentElement.classList.add("light")}var l=localStorage.getItem("locale");if(l==="de"){document.documentElement.lang="de"}}catch(e){}})()`,
          }}
        />
      </head>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
        style={{ fontFamily: "var(--font-geist-sans), 'Geist', system-ui, -apple-system, sans-serif" }}
      >
        <AnalyticsProvider>
          <AuthInitializer>{children}</AuthInitializer>
        </AnalyticsProvider>
      </body>
    </html>
  );
}
