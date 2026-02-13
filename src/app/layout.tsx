import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { FileText, LayoutDashboard, Upload } from "lucide-react";
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
  title: "Invoice Extractor",
  description: "AI-powered invoice data extraction with LLM vision, validation, and human-in-the-loop review",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <div className="min-h-screen flex flex-col">
          <header className="border-b bg-background">
            <div className="container mx-auto flex h-14 items-center gap-6 px-4">
              <Link href="/" className="flex items-center gap-2 font-semibold">
                <FileText className="h-5 w-5" />
                Invoice Extractor
              </Link>
              <nav className="flex items-center gap-4 text-sm">
                <Link
                  href="/"
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Upload className="h-4 w-4" />
                  Upload
                </Link>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
        </div>
      </body>
    </html>
  );
}
