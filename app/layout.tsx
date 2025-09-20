
import './globals.css';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import ClientOnly from '@/components/ClientOnly';
import Providers from '@/context/Providers';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'indcric - The Ultimate Cricket Quiz',
  description: 'win ₹100 for every 100 seconds!',
  manifest: '/manifest.json',
  themeColor: '#D4AF37',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'indcric',
  },
};

const BottomNav = dynamic(() => import('@/components/BottomNav'), {
  ssr: false,
  loading: () => (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-card/80 border-t z-50">
        <div className="flex h-full items-center justify-around max-w-md mx-auto">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-10 w-10 rounded-full" />
        </div>
    </div>
  ),
});


export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
      </head>
      <body className={`${inter.variable} antialiased prevent-select dark`}>
          <Providers>
            <div className="relative flex flex-col min-h-screen">
              <main className="flex-1 pb-20">{children}</main>
              <ClientOnly fallback={<Alert variant="destructive" className="fixed bottom-0 w-full rounded-none"><AlertTriangle className="h-4 w-4" /><AlertTitle>Navigation Failed</AlertTitle><AlertDescription>Could not load app navigation. Please refresh.</AlertDescription></Alert>}>
                <BottomNav />
              </ClientOnly>
            </div>
            <Toaster />
          </Providers>
      </body>
    </html>
  );
}
