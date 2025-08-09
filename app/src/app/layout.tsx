import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import Providers from "@/context/Providers";
import { Toaster } from "@/components/ui/toaster";
import BottomNav from "@/components/BottomNav";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "CricBlitz",
  description: "The ultimate live cricket quiz challenge. Win prizes for your knowledge!",
  keywords: ["cricket", "quiz", "live quiz", "t20", "odi", "test cricket", "ipl", "rewards"],
};

/**
 * This is the root layout for the entire application.
 * It's crucial for setting up global styles, fonts, and context providers.
 * By wrapping the children with the <Providers> component, we ensure that
 * all contexts (like AuthContext) are available to every page.
 */
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        {/* The Providers component centralizes all context providers. */}
        <Providers>
          <div className="relative flex min-h-screen w-full flex-col">
            <main className="flex-1 pb-16">{children}</main>
            {/* The BottomNav is part of the main layout for consistent navigation. */}
            <BottomNav />
          </div>
          {/* The Toaster component is for displaying notifications. */}
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
