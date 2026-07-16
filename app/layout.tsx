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
  metadataBase: new URL("https://chappiebarks.com"),
  title: {
    default: "Sites That Suck — two websites a day, roasted by a robot",
    template: "%s · Sites That Suck",
  },
  description:
    "Every day Chappie the robot picks two websites and takes them apart — design, code, speed, copy. A suck score, a savage verdict, and the actual fixes.",
  applicationName: "Sites That Suck",
  keywords: [
    "website roast",
    "website critique",
    "web design review",
    "site audit",
    "Chappie",
  ],
  // iMessage pulls og:title / og:image / og:site_name — all absolute via
  // metadataBase; opengraph-image.tsx supplies the card automatically.
  openGraph: {
    type: "website",
    url: "https://chappiebarks.com",
    siteName: "Sites That Suck",
    title: "Sites That Suck — two websites a day, roasted by a robot",
    description:
      "Chappie picks two victims a day. Suck scores, savage verdicts, real fixes. He laughs because it's funny.",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    site: "@chappieworks",
    creator: "@chappieworks",
    title: "Sites That Suck — two websites a day, roasted by a robot",
    description:
      "Chappie picks two victims a day. Suck scores, savage verdicts, real fixes.",
  },
  appleWebApp: {
    capable: true,
    title: "Sites That Suck",
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false },
  robots: { index: true, follow: true },
};

export const viewport = {
  themeColor: "#0b0b0c",
  width: "device-width",
  initialScale: 1,
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
