
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Providers } from '@/context/Providers';
import BottomNav from '@/components/BottomNav';
import { usePathname } from 'next/navigation';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CricBlitz',
  description: 'The Ultimate Live Cricket Quiz Challenge',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-foreground`}>
        <Providers>
          <div className="flex flex-col min-h-screen">
            <main className="flex-1 pb-20">{children}</main>
            <BottomNav />
          </div>
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
