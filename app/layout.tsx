
import './globals.css';
import type { Metadata } from 'next';
import Providers from '@/context/Providers';
import { Toaster } from '@/components/ui/toaster';
import BottomNav from '@/components/BottomNav';

export const metadata: Metadata = {
  title: 'indcric',
  description: 'The Ultimate Cricket Quiz',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <main>{children}</main>
          <BottomNav />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
