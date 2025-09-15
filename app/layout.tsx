
import './globals.css';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { Inter } from 'next/font/google';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import ClientOnly from '@/components/ClientOnly';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'CricBlitz - The Ultimate Cricket Quiz',
  description: 'Test your cricket knowledge and win rewards!',
  manifest: '/manifest.json',
  themeColor: '#228B22',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'CricBlitz',
  },
};

const Providers = dynamic(() => import('@/context/Providers'), {
  ssr: false,
  loading: () => <div className="flex-1" />, // Render nothing while loading providers
});

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
              <ClientOnly>
                <BottomNav />
              </ClientOnly>
            </div>
            <Toaster />
          </Providers>
      </body>
    </html>
  );
}
