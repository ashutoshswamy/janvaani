import type { Metadata } from "next";
import { DM_Sans, Noto_Sans } from "next/font/google";
import { Toaster } from "@/components/toast";
import { LangProvider } from "@/components/lang";
import { AuthProvider } from "@/components/auth";
import "./globals.css";

const dmSans = DM_Sans({ variable: "--font-dm-sans", subsets: ["latin", "latin-ext"] });
// DM Sans has no Indic glyphs; Noto Sans covers Devanagari as fallback.
const noto = Noto_Sans({ variable: "--font-noto", subsets: ["devanagari"] });

export const metadata: Metadata = {
  title: "JanVaani - Your voice shapes India's development",
  description: "Multilingual citizen development request platform. A Digital Public Good.",
  icons: { icon: "/logo.png", apple: "/logo.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${dmSans.variable} ${noto.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <AuthProvider>
          <LangProvider>{children}</LangProvider>
        </AuthProvider>
        <Toaster />
      </body>
    </html>
  );
}
