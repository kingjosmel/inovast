import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SessionProviders } from "@/components/auth/SessionProviders";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FoodGo - Fast Food & Grocery Delivery",
  description: "On-demand food delivery platform connecting customers, merchants, and riders.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SessionProviders>{children}</SessionProviders>
      </body>
    </html>
  );
}
