
import './globals.css';
import type { Metadata } from 'next';
import Providers from '@/app/context/Providers';
import { Toaster } from '@/app/components/ui/toaster';
import BottomNav from '@/app/components/BottomNav';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'indcric - Win ₹100 for every 100 seconds!',
  description: 'Win ₹100 for every 100 seconds! The ultimate cricket quiz challenge.',
  manifest: '/manifest.json',
  themeColor: '#228B22',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'indcric',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased prevent-select`}>
        <Providers>
          <div className="relative flex flex-col min-h-screen">
            <main className="flex-1 pb-20">{children}</main>
            <BottomNav />
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
