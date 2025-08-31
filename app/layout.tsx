import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Providers } from "@/redux/provider";
import { MusicPlayerProvider } from "@/providers/music-player-provider";
import Navbar from "@/components/navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MusicStream - Your Ultimate Music Experience",
  description: "Discover, stream, and download your favorite music with our modern music streaming platform",
  keywords: "music, streaming, download, songs, albums, playlists",
  authors: [{ name: "MusicStream Team" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#000000" }
  ]
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <Providers>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <MusicPlayerProvider>
              {/* Global Layout Container */}
              <div className="relative min-h-screen flex flex-col">
                {/* Fixed Navbar - Always on top with proper z-index */}
                <div className="fixed top-0 left-0 right-0 z-[100]">
                  <Navbar />
                </div>

                {/* Main Content Area - Accounts for fixed navbar */}
                <main className="flex-1 pt-16 md:pt-20">
                  {children}
                </main>

                {/* Optional: Global background patterns */}
                <div className="fixed inset-0 -z-10 pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-black"></div>
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/[0.02] via-pink-500/[0.01] to-blue-500/[0.02] dark:from-purple-900/10 dark:via-pink-900/5 dark:to-blue-900/10"></div>
                </div>
              </div>
            </MusicPlayerProvider>
          </ThemeProvider>
        </body>
      </html>
    </Providers>
  );
}
