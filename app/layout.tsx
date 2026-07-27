import "./globals.css";
import { ReactNode } from "react";
import Navbar from "@/components/Navbar";

/* ✅ Auto Mail Cron Import (server side only) */
import "@/lib/autoMailer";

export const metadata = {
  title: "LoanTrack",
  description: "স্বয়ংক্রিয় ঋণ ব্যবস্থাপনা সিস্টেম",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="bn">
      <body className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600">
        <Navbar />
        <main className="min-h-[calc(100vh-64px)]">
          {children}
        </main>
      </body>
    </html>
  );
}