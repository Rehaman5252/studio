
'use client';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/context/Providers';
import BottomNav from '@/components/BottomNav';
import { usePathname } from 'next/navigation';
import { Toaster } from '@/components/ui/toaster';


const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const pathname = usePathname();
  const showNav = !['/auth/login', '/auth/signup', '/auth/forgot-password', '/walkthrough'].includes(pathname);

  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
          <title>CricBlitz - The Ultimate Cricket Challenge</title>
          <meta name="description" content="Test your cricket knowledge on CricBlitz and win exciting prizes. Compete on the live leaderboard and become a true cricket champion." />
          <meta name="keywords" content="cricket, quiz, ipl, t20, odi, test cricket, sports trivia, cricblitz" />
          <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.variable} bg-background font-sans text-foreground`}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <main className="flex-1 pb-20">{children}</main>
            {showNav && <BottomNav />}
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
