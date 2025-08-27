
'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthProvider';
import { memo, useState, useCallback } from 'react';
import { useQuizStatus } from '@/context/QuizStatusProvider';
import { brandData } from '@/components/home/brandData';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import PageWrapper from '@/components/PageWrapper';
import dynamic from 'next/dynamic';
import { encodeAttempt } from '@/lib/quiz-utils';
import type { CubeBrand } from '@/components/home/brandData';

const CricketFact = dynamic(() => import('@/components/home/CricketFact'), {
    loading: () => <Skeleton className="h-40 w-full" />,
});

const HomeClientContent = dynamic(() => import('@/components/home/HomeClientContent'), { 
    loading: () => <HomeContentSkeleton />,
    ssr: false 
});

const StartQuizButton = dynamic(() => import('@/components/home/StartQuizButton'), {
    loading: () => <Skeleton className="h-12 w-full rounded-full" />,
});


const HomeContentSkeleton = () => (
    <div className="space-y-8 animate-pulse">
        <div className="text-center mb-4">
            <Skeleton className="h-8 w-3/4 mx-auto" />
            <Skeleton className="h-4 w-1/2 mx-auto mt-2" />
        </div>
        <div className="flex justify-center items-center h-[200px]">
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

const MalpracticeWarning = memo(() => {
    const { profile } = useAuth();
    if (!profile) return null;

    const noBallCount = profile.noBallCount || 0;
    if (noBallCount <= 0 || noBallCount >= 3) return null;

    const today = new Date().setHours(0, 0, 0, 0);
    const lastNoBallDay = profile.lastNoBallTimestamp ? new Date(profile.lastNoBallTimestamp.seconds * 1000).setHours(0, 0, 0, 0) : null;

    if(lastNoBallDay !== today) return null;

    const warningsLeft = 3 - noBallCount;
    
    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Fair Play Warning!</AlertTitle>
                <AlertDescription>
                    You have {noBallCount} No-Ball(s) today. {warningsLeft} more and you're Out for the Day! Please contact support to appeal.
                </AlertDescription>
            </Alert>
        </motion.div>
    )
});
MalpracticeWarning.displayName = 'MalpracticeWarning';

function HomePageContent() {
    const { user, isProfileComplete, lastAttemptInSlot, loading: authLoading } = useAuth();
    const { isLoading: isQuizStatusLoading } = useQuizStatus();
    const router = useRouter();
    const { toast } = useToast();
    const [selectedBrand, setSelectedBrand] = useState(brandData[0]);

    const hasPlayedInCurrentSlot = !!lastAttemptInSlot;

    const handleStartQuiz = useCallback((brandToPlay?: CubeBrand) => {
        const brand = brandToPlay || selectedBrand;
        if (!user) {
            router.push(`/auth/login?from=/`);
            return;
        }
        
        if (hasPlayedInCurrentSlot && lastAttemptInSlot) {
            router.push(`/quiz/results?attempt=${encodeAttempt(lastAttemptInSlot)}`);
            toast({
                title: "You've already played this innings!",
                description: `Showing your results for the ${lastAttemptInSlot.format} quiz. You can only attempt one quiz per slot.`,
            });
            return;
        }

        if (!user.emailVerified) {
            toast({
                title: "Email not verified",
                description: "Please verify your email address before playing a quiz.",
                variant: "destructive"
            });
            return;
        }
        if (!isProfileComplete) {
            toast({
                title: "Profile Incomplete",
                description: "Please complete your profile to start playing quizzes.",
                variant: "destructive"
            });
             router.push('/profile');
            return;
        }
        
        router.push(`/quiz?brand=${encodeURIComponent(brand.brand)}&format=${encodeURIComponent(brand.format)}`);
    }, [user, hasPlayedInCurrentSlot, lastAttemptInSlot, isProfileComplete, selectedBrand, router, toast]);

    if (authLoading) {
      return <HomeContentSkeleton />
    }
    
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="space-y-6"
        >
            <MalpracticeWarning />
            
            <HomeClientContent 
                selectedBrand={selectedBrand}
                setSelectedBrand={setSelectedBrand}
                handleStartQuiz={handleStartQuiz}
            />
            
             <div className="mt-6">
                <StartQuizButton
                    brandFormat={hasPlayedInCurrentSlot ? lastAttemptInSlot!.format : selectedBrand.format}
                    onClick={() => handleStartQuiz()}
                    isDisabled={isQuizStatusLoading}
                    hasPlayed={hasPlayedInCurrentSlot}
                />
            </div>
            
            <div className="mt-8">
              <CricketFact format={selectedBrand.format} />
            </div>

        </motion.div>
    );
}

function HomePage() {
  const headerContent = (
      <div className="text-center">
        <h1 className="text-7xl font-extrabold tracking-tighter animate-shimmer">
          CricBlitz
        </h1>
        <p className="mt-1 text-base font-normal text-foreground/80">
          The Ultimate Cricket Quiz Challenge!
        </p>
      </div>
    );
  
  return (
    <PageWrapper title={headerContent} hideBorder>
      <HomePageContent/>
    </PageWrapper>
  );
}

export default memo(HomePage);
