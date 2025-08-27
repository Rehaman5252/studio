
import './globals.css';
import type { Metadata } from 'next';
import Providers from '@/context/Providers';
import { Toaster } from '@/components/ui/toaster';
import BottomNav from '@/components/BottomNav';
import { Inter } from 'next/font/google';
import Script from 'next/script';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'indcric',
  description: 'Win ₹100 for every 100 seconds!',
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
        <Script id="screenshot-blocker" strategy="afterInteractive">
          {`
            document.addEventListener('contextmenu', function(e) {
              if (e.target.closest('input, textarea, [contenteditable="true"]')) {
                return;
              }
              e.preventDefault();
            });
            document.addEventListener('keydown', function(e) {
                // Block common screenshot and copy shortcuts
                if (e.key === 'PrintScreen' || (e.ctrlKey && e.shiftKey && e.key === 'I') || (e.ctrlKey && e.shiftKey && e.key === 'J') || (e.ctrlKey && e.key === 'U') || (e.ctrlKey && e.key === 'S') || (e.ctrlKey && e.key === 'C') || (e.metaKey && e.key === 'c') || (e.metaKey && e.key === 's') ) {
                    if (e.target.closest('input, textarea, [contenteditable="true"]')) {
                        // Allow copying from input fields
                        if (e.ctrlKey && e.key ==='C' || e.metaKey && e.key === 'c') return;
                    }
                    e.preventDefault();
                }
            });
          `}
        </Script>
      </body>
    </html>
  );
}
