
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/context/AuthProvider';
import { QuizStatusProvider } from '@/context/QuizStatusProvider';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'Indcric - The Ultimate Cricket Quiz Challenge',
    template: '%s | Indcric',
  },
  description: 'Test your cricket knowledge on Indcric, the ultimate quiz app. Compete, climb the leaderboard, and win exciting prizes. Fast, fun, and built for true cricket fans.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark h-full">
      <body className={`${inter.variable} h-full bg-background font-body`}>
        <AuthProvider>
          <QuizStatusProvider>
            {children}
            <Toaster />
          </QuizStatusProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
