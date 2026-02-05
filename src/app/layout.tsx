import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ModeToggle } from "@/components/mode-toggle";
import { Sidebar } from "@/components/sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Leon Dashboard",
  description: "Operational task dashboard for Leon",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <Providers>
          <div className="min-h-screen bg-background text-foreground">
            <header className="border-b bg-card/80 backdrop-blur">
              <div className="flex h-14 items-center justify-between px-4 @container/header">
                <div className="flex flex-col">
                  <span className="text-sm font-semibold tracking-tight text-primary">
                    Leon Dashboard
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Tasks · Metrics · Ops
                  </span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>Theme</span>
                  <ModeToggle />
                </div>
              </div>
            </header>
            <div className="flex gap-6 px-4 py-6">
              <Sidebar />
              <main className="flex-1">
                {children}
              </main>
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}
