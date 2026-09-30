import type { Metadata, Viewport } from "next";
import { DM_Sans, Noto_Sans } from "next/font/google";
import { Toaster } from "@/components/toast";
import { LangProvider } from "@/components/lang";
import { AuthProvider } from "@/components/auth";
import { SITE_DESC, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";
import "./globals.css";

const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin", "latin-ext"] });
// DM Sans has no Indic glyphs; Noto Sans covers Devanagari as fallback.
const noto = Noto_Sans({ variable: "--font-noto", subsets: ["devanagari"] });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: SITE_TITLE, template: `%s | ${SITE_NAME}` },
  description: SITE_DESC,
  applicationName: SITE_NAME,
  keywords: ["JanVaani", "citizen grievance portal", "development requests India", "multilingual civic platform", "report local issues", "Digital Public Good", "voice complaint India", "22 Indian languages", "e-governance"],
  openGraph: { type: "website", siteName: SITE_NAME, title: SITE_TITLE, description: SITE_DESC, locale: "en_IN", images: [{ url: "/og-image.png", width: 1733, height: 907, alt: "JanVaani – your voice shapes India's development" }] },
  twitter: { card: "summary_large_image", title: SITE_TITLE, description: SITE_DESC, images: ["/og-image.png"] },
  manifest: "/site.webmanifest",
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/favicon-32x32.png", sizes: "32x32" }, { url: "/favicon-16x16.png", sizes: "16x16" }],
    apple: "/apple-touch-icon.png",
  },
};

export const viewport: Viewport = { themeColor: "#ffffff" };

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESC,
  applicationCategory: "GovernmentApplication",
  operatingSystem: "Web",
  inLanguage: ["en", "hi", "mr"],
  offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${dmSans.variable} ${noto.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
        <AuthProvider>
          <LangProvider>{children}</LangProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
