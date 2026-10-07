import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./provider";

import { Nav } from "../../components/nav";
import { Footer } from "../../components/footer";
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});
const body = Geist({ subsets: ["latin"], variable: "--font-body" });
const code = Geist_Mono({ subsets: ["latin"], variable: "--font-code" });

export const metadata: Metadata = {
  metadataBase: new URL("https://codequant-review.vercel.app"),
  title: "CodeReview AI | Four AI agents review every pull request",
  description:
    "A production GitHub App: four parallel AI agents post inline review comments in seconds, backed by a queue, retries and deduplication.",
  openGraph: {
    title: "CodeReview AI",
    description: "Four AI agents review every pull request in seconds.",
    images: ["/screenshots/review.png"],
  },
  twitter: { card: "summary_large_image" },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${body.variable} ${code.variable}`}
    >
      <body className="antialiased">
        <Providers>
          <Nav />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
