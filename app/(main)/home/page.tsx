

'use client';

import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthProvider';
import { memo } from 'react';
import StartQuizButton from '@/components/home/StartQuizButton';
import { useQuizStatus } from '@/context/QuizStatusProvider';
import { useMemo, useState } from 'react';
import { getQuizSlotId } from '@/lib/utils';
import { brandData } from '@/components/home/brandData';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import PageWrapper from '@/components/PageWrapper';

const HomeClientContent = dynamic(() => import('@/components/home/HomeClientContent'), {
  loading: () => <HomeContentSkeleton />,
  ssr: false,
});

const HomeContentSkeleton = () => (
    <div className="space-y-8 animate-pulse">
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
    const { user, isProfileComplete, lastAttemptInSlot } = useAuth();
    const { isLoading: isQuizStatusLoading } = useQuizStatus();
    const router = useRouter();
    const { toast } = useToast();
    const [selectedBrand, setSelectedBrand] = useState(brandData[0]);

    const hasPlayedInCurrentSlot = useMemo(() => {
        if (!user || !lastAttemptInSlot) return false;
        // Check if the last attempt's slot ID matches the current one.
        return lastAttemptInSlot.slotId === getQuizSlotId();
    }, [user, lastAttemptInSlot]);

    const handleStartQuiz = () => {
        if (!user) {
            router.push(`/auth/login?from=/home`);
            return;
        }
        
        if (hasPlayedInCurrentSlot && lastAttemptInSlot) {
            const attemptDataString = btoa(JSON.stringify(lastAttemptInSlot));
            const reviewUrl = `/quiz/results?review=true&attempt=${encodeURIComponent(attemptDataString)}`;
            router.push(reviewUrl);
            toast({
                title: "Slot Already Played",
                description: `Showing your results for the ${lastAttemptInSlot.format} quiz.`,
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
            // This case should be handled by the QuizSelection component's alert dialog
            return;
        }
        
        router.push(`/quiz?brand=${encodeURIComponent(selectedBrand.brand)}&format=${encodeURIComponent(selectedBrand.format)}`);
    };

    return (
      <PageWrapper title="indcric">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <MalpracticeWarning />
            <HomeClientContent setSelectedBrand={setSelectedBrand} />

             <div className="mt-8">
                <StartQuizButton
                    brandFormat={hasPlayedInCurrentSlot ? lastAttemptInSlot!.format : selectedBrand.format}
                    onClick={handleStartQuiz}
                    isDisabled={isQuizStatusLoading}
                    hasPlayed={hasPlayedInCurrentSlot}
                />
            </div>

          </motion.div>
      </PageWrapper>
    );
}

export default memo(HomePage);
