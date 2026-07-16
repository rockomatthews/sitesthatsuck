import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
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
  title: "sites that suck — Chappie roasts your website",
  description:
    "Paste a URL. An AI studio's seven personas roast the design, code, speed and copy in 30 seconds — with a suck score, a shareable card, and the actual fixes.",
  openGraph: {
    title: "sites that suck — get your website roasted by Chappie",
    description:
      "A suck score out of 100, a savage verdict, and the real fixes. Free.",
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
