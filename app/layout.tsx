import type { Metadata } from "next";
import { HoverTracker } from "@/components/hover-tracker";
import { EB_Garamond } from "next/font/google";
import "./globals.css";

const ebGaramond = EB_Garamond({
  subsets: ["latin"],
  variable: "--font-eb-garamond",
  display: "swap",
});

export const metadata: Metadata = {
  title: "J Split",
  description: "Receipt-first bill splitting for groups.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={ebGaramond.variable} suppressHydrationWarning>
        <div className="liquid-background" aria-hidden="true">
          <div className="liquid-layer liquid-layer-one" />
          <div className="liquid-layer liquid-layer-two" />
          <div className="liquid-layer liquid-layer-three" />
        </div>
        <HoverTracker />
        {children}
      </body>
    </html>
  );
}
