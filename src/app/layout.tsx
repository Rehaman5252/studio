
'use client';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/context/Providers';
import FirebaseOfflineAlert from '@/components/common/FirebaseOfflineAlert';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="h-full dark" suppressHydrationWarning>
      <head>
          <title>CricBlitz - The Ultimate Cricket Quiz Challenge</title>
          <meta name="description" content="Test your cricket knowledge on CricBlitz and win exciting prizes. Compete on the live leaderboard and become a true cricket champion. Fast, fun, and built for true cricket fans." />
          <meta name="keywords" content="cricket, quiz, ipl, t20, odi, test cricket, sports trivia, cricblitz" />
          <link rel="icon" href="/favicon.ico" />
          <meta name="theme-color" content="hsl(var(--background))" />
      </head>
      <body className={`${inter.variable} h-full bg-background font-sans text-foreground`}>
        <Providers>
          <FirebaseOfflineAlert />
          {children}
        </Providers>
      </body>
    </html>
  );
}
