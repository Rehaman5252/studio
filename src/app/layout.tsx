
import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from '@/context/Providers';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'CricBlitz - The Ultimate Cricket Quiz Challenge',
    template: '%s | CricBlitz',
  },
  description: 'Test your cricket knowledge on CricBlitz and win exciting prizes. Compete on the live leaderboard and become a true cricket champion. Fast, fun, and built for true cricket fans.',
  keywords: ['cricket', 'quiz', 'ipl', 't20', 'odi', 'test cricket', 'sports trivia', 'CricBlitz'],
  icons: {
    icon: '/favicon.ico',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: 'hsl(var(--background))' },
    { media: '(prefers-color-scheme: dark)', color: 'hsl(var(--background))' },
  ],
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className={`${inter.variable} h-full bg-background font-body`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
