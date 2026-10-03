import type { Metadata } from "next";
import { Bricolage_Grotesque, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Providers from "./provider";

import { SmoothScroll } from "../../components/smooth-scroll";
import { Nav } from "../../components/nav";
const display = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-display",
});
const body = Geist({ subsets: ["latin"], variable: "--font-body" });
const code = Geist_Mono({ subsets: ["latin"], variable: "--font-code" });

export const metadata: Metadata = {
  title: "CodeReview AI",
  description: "Four agents review every pull request the moment it opens.",
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
          <SmoothScroll />
          <Nav />
          {children}
        </Providers>
      </body>
    </html>
  );
}
