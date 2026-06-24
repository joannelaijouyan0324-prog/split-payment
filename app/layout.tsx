import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Split Payment",
  description: "Receipt-first bill splitting for groups.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
