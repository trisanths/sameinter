import type React from "react";
import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DevChat - AI-Powered Development Assistant",
  description: "Build, code, and create with AI assistance",
  generator: "DevChat",
  keywords: ["AI", "development", "coding", "assistant", "React", "Next.js"],
  authors: [{ name: "DevChat Team" }],
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`antialiased ${plusJakartaSans.className}`}>
        {children}
      </body>
    </html>
  );
}
