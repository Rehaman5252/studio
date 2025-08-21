
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
  description: "CricBlitz - The ultimate cricket quiz. Test your knowledge and win rewards!",
  keywords: ["cricket", "quiz", "live quiz", "t20", "odi", "test cricket", "ipl", "rewards", "CricBlitz"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable
        )}
      >
        <Providers>
          <div className="relative flex flex-col items-center min-h-screen w-full">
            <main className="w-full max-w-md flex-1 py-4">
              {children}
            </main>
            <BottomNav />
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
