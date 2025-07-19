
'use client';
import type { ReactNode } from 'react';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/context/Providers';
import { useAuth } from '@/context/AuthProvider';
import { WifiOff } from 'lucide-react';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// Metadata and viewport are not used in a client component,
// so we manage the title via useEffect or a dedicated component if needed.
// For simplicity, we'll keep the static parts here.
// export const metadata: Metadata = { ... };
// export const viewport: Viewport = { ... };

function OfflineBanner() {
  const { isOffline } = useAuth();

  if (!isOffline) {
    return null;
  }

  return (
    <div className="bg-destructive text-destructive-foreground p-2 text-center text-sm flex items-center justify-center gap-2">
      <WifiOff className="h-4 w-4" />
      You are currently offline. Some features may be unavailable.
    </div>
  );
}


export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className="h-full" suppressHydrationWarning>
      <head>
          <title>indcric - The Ultimate Cricket Quiz Challenge</title>
          <meta name="description" content="Test your cricket knowledge on indcric and win exciting prizes. Compete on the live leaderboard and become a true cricket champion. Fast, fun, and built for true cricket fans." />
          <meta name="keywords" content="cricket, quiz, ipl, t20, odi, test cricket, sports trivia, indcric" />
          <link rel="icon" href="/favicon.ico" />
          <meta name="theme-color" content="hsl(var(--background))" />
      </head>
      <body className={`${inter.variable} h-full bg-background font-sans text-foreground`}>
        <Providers>
          <OfflineBanner />
          {children}
        </Providers>
      </body>
    </html>
  );
}
