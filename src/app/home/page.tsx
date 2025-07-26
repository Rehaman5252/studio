
'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthProvider';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const HomeClientContent = dynamic(() => import('@/components/home/HomeClientContent'), {
  loading: () => <HomeContentSkeleton />,
  ssr: false,
});

const HomeContentSkeleton = () => (
    <div className="space-y-8 animate-pulse mt-10">
        <div className="text-center mb-8">
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
        </div>
        <div className="flex justify-center items-center h-[192px]">
            <Skeleton className="w-48 h-48 rounded-lg" />
        </div>
        <Skeleton className="h-[124px] w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-[92px] w-full" />
            <Skeleton className="h-[92px] w-full" />
            <Skeleton className="h-[92px] w-full" />
            <Skeleton className="h-[92px] w-full" />
        </div>
        <Skeleton className="h-16 w-full rounded-full" />
    </div>
);

const MalpracticeWarning = () => {
    const { profile } = useAuth();
    if (!profile) return null;

    const noBallCount = profile.noBallCount || 0;
    if (noBallCount <= 0 || noBallCount >= 3) return null;

    const today = new Date().setHours(0, 0, 0, 0);
    const lastNoBallDay = profile.lastNoBallTimestamp ? new Date(profile.lastNoBallTimestamp.seconds * 1000).setHours(0, 0, 0, 0) : null;

    if(lastNoBallDay !== today) return null;

    const warningsLeft = 3 - noBallCount;
    
    return (
        <Alert variant="destructive" className="mb-4 animate-fade-in-up">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Fair Play Warning!</AlertTitle>
            <AlertDescription>
                You have {noBallCount} No-Ball(s) today. {warningsLeft} more and you're Out for the Day!
            </AlertDescription>
        </Alert>
    )
}

function HomePage() {
    return (
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        <header className="p-4 flex items-center justify-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
              <h1 className="text-6xl font-extrabold tracking-tight text-shimmer animate-shimmer">
                indcric
              </h1>
              <p className="text-sm text-muted-foreground">Win ₹100 for every 100 seconds</p>
          </motion.div>
        </header>
        <main className="flex-1 overflow-y-auto pb-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="container mx-auto px-4 py-2"
          >
            <MalpracticeWarning />
            <HomeClientContent />
          </motion.div>
        </main>
      </div>
    );
}

export default HomePage;
