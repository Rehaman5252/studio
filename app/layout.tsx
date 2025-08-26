
import './globals.css';
import type { Metadata } from 'next';
import Providers from '@/context/Providers';
import { Toaster } from '@/components/ui/toaster';
import BottomNav from '@/components/BottomNav';
import { Inter } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'indcric',
  description: 'The ultimate cricket quiz challenge.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
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
