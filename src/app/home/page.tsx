
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

const HomeWrapper = dynamic(() => import('@/components/home/HomeWrapper'), {
  loading: () => (
    <div className="space-y-8 p-4">
      <div className="text-center mb-8">
        <Skeleton className="h-8 w-3/4 mx-auto" />
        <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
      </div>
      <Skeleton className="w-48 h-48 mx-auto" />
      <Skeleton className="w-full mt-8 h-[140px] rounded-2xl" />
      <div className="grid grid-cols-2 gap-4 mt-8">
        <Skeleton className="w-full h-[108px] rounded-lg" />
        <Skeleton className="w-full h-[108px] rounded-lg" />
        <Skeleton className="w-full h-[108px] rounded-lg" />
        <Skeleton className="w-full h-[108px] rounded-lg" />
      </div>
       <Skeleton className="w-full mt-8 h-[60px] rounded-full" />
    </div>
  ),
  ssr: false,
});

function HomePageContent() {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace('/auth/login');
        }
    }, [user, loading, router]);

    if (loading || !user) {
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
            <h1 className="text-6xl font-extrabold tracking-tighter text-shimmer animate-shimmer">
              indcric
            </h1>
            <p className="text-sm text-muted-foreground">win ₹100 for every 100 seconds!</p>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto pb-24">
          <div className="container mx-auto px-4 py-8">
            <HomeWrapper />
          </div>
        </main>
      </motion.div>
    );
}

export default function HomePage() {
  return <HomePageContent />;
}
