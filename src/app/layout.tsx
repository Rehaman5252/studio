
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Providers } from "@/context/Providers";
import FirebaseOfflineAlert from "@/components/common/FirebaseOfflineAlert";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "indcric - The Ultimate Cricket Quiz",
  description: "Play cricket quizzes, win rewards, and prove your knowledge!",
  manifest: "/manifest.json",
  themeColor: "#1a202c",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
            <FirebaseOfflineAlert />
            {children}
        </Providers>
      </body>
    </html>
  );
}
