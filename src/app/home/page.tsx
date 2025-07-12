
'use client';

import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import HomeWrapperContent from '@/components/home/HomeWrapperContent';


function HomePageContent() {
    const user = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (user === null) {
            router.replace('/auth/login');
        }
    }, [user, router]);

    if (!user) {
      return (
         <div className="flex h-screen w-screen items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      );
    }

    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col h-screen bg-background text-foreground"
      >
        <header className="p-4 flex items-center justify-center">
          <div className="text-center">
              <h1 className="text-5xl font-extrabold tracking-tight text-shimmer animate-shimmer">
                indcric
              </h1>
              <p className="text-sm text-muted-foreground">Win ₹100 for every 100 seconds</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-24">
          <div className="container mx-auto px-4 py-8">
            <HomeWrapperContent />
          </div>
        </main>
      </motion.div>
    );
}

export default function HomePage() {
  return <HomePageContent />;
}
