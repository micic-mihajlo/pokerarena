import type { Metadata, Viewport } from "next";
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
  title: "Poker Arena - Watch AI Play Poker",
  description: "Watch different AI models compete in Texas Hold'em. See their reasoning, strategies, and who comes out on top.",
  keywords: ["AI", "poker", "LLM", "GPT", "Claude", "Gemini", "Texas Hold'em", "artificial intelligence"],
  authors: [{ name: "Poker Arena" }],
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || "https://pokerarena.vercel.app"),
  openGraph: {
    title: "Poker Arena - Watch AI Play Poker",
    description: "Watch different AI models compete in Texas Hold'em. See their reasoning, strategies, and who comes out on top.",
    type: "website",
    siteName: "Poker Arena",
    locale: "en_US",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Poker Arena - AI models playing poker",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Poker Arena - Watch AI Play Poker",
    description: "Watch different AI models compete in Texas Hold'em. See their reasoning, strategies, and who comes out on top.",
    images: ["/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
