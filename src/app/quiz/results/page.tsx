
'use client';

import React, { Suspense, useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useQuizStatus } from '@/context/QuizStatusProvider';
import type { Ad } from '@/lib/ads';
import { adLibrary } from '@/lib/ads';
import { Button } from '@/components/ui/button';
import { AdDialog } from '@/components/AdDialog';
import { Home, Loader2, AlertTriangle } from 'lucide-react';
import { ResultsSummaryCard } from '@/components/quiz/ResultsSummaryCard';
import { Certificate } from '@/components/quiz/Certificate';
import { AnalysisCard } from '@/components/quiz/AnalysisCard';
import { AnswerReview } from '@/components/quiz/AnswerReview';
import { motion } from 'framer-motion';


const MalpracticeScreen = memo(() => {
    const router = useRouter();
    return (
        <div 
            className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4"
        >
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md text-center bg-card border-2 border-destructive my-4 rounded-lg p-6 shadow-lg"
            >
                 <div className="mx-auto bg-destructive/20 p-4 rounded-full w-fit mb-4">
                    <AlertTriangle className="h-12 w-12 text-destructive" />
                </div>
                <h1 className="text-3xl font-extrabold text-destructive">It's a Wicket!</h1>
                <p className="text-base text-muted-foreground mt-2">Quiz Terminated for Unfair Play</p>
                <div className="space-y-4 mt-4 text-left">
                     <p className="text-lg">Like a batsman leaving the crease, you strayed from the quiz tab.</p>
                     <p className="text-sm text-muted-foreground">To ensure a fair game for everyone, this quiz attempt has been declared void. You can start a fresh innings in the next quiz slot.</p>
                     <Button size="lg" className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/90 mt-4" onClick={() => router.replace('/home')}>
                        <Home className="mr-2 h-5 w-5" /> Back to the Pavilion
                     </Button>
                </div>
            </motion.div>
        </div>
    );
});
MalpracticeScreen.displayName = "MalpracticeScreen";

const ResultsLoader = () => (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Calculating your score...</p>
    </div>
);

function ResultsComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const { lastAttemptInSlot, isLoading: isContextLoading } = useQuizStatus();
    
    const [showAnswers, setShowAnswers] = useState(false);
    const [adConfig, setAdConfig] = useState<{ ad: Ad; onFinished: () => void; children?: React.ReactNode; } | null>(null);
    
    const isReview = useMemo(() => searchParams.get('review') === 'true', [searchParams]);
    const reason = useMemo(() => searchParams.get('reason'), [searchParams]);
    const today = useMemo(() => new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), []);
    
    const { questions, userAnswers, brand, format, timePerQuestion, usedHintIndices, score, totalQuestions, slotId, timestamp } = useMemo(() => {
        return {
            ...lastAttemptInSlot,
            totalQuestions: lastAttemptInSlot?.questions?.length || 0,
        };
    }, [lastAttemptInSlot]);
    
    const isPerfectScore = useMemo(() => score === totalQuestions && totalQuestions > 0, [score, totalQuestions]);
    
    
    const slotTimings = useMemo(() => {
        if (!timestamp) return '';
        const attemptDate = new Date(timestamp);
        const minutes = attemptDate.getMinutes();
        const slotStartMinute = Math.floor(minutes / 10) * 10;
        
        const slotStartTime = new Date(attemptDate);
        slotStartTime.setMinutes(slotStartMinute, 0, 0);
        
        const slotEndTime = new Date(slotStartTime.getTime() + 10 * 60 * 1000);

        const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        
        return `${formatTime(slotStartTime)} - ${formatTime(slotEndTime)}`;
    }, [timestamp]);
    
    const handleViewAnswers = useCallback(() => {
        if (showAnswers) return;
        setAdConfig({
            ad: adLibrary.resultsAd,
            onFinished: () => {
                setShowAnswers(true);
                setAdConfig(null);
            },
            children: <p className="font-bold text-lg mt-4">Thank you for your patience!</p>
        });
    }, [showAnswers]);

    if (reason === 'malpractice') {
        return <MalpracticeScreen />;
    }

    if (isContextLoading) {
        return <ResultsLoader />;
    }

    if (!lastAttemptInSlot) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-4">
                <h1 className="text-2xl font-bold mb-4">No Recent Quiz Found</h1>
                <p>Could not find data for your last quiz attempt.</p>
                <Button onClick={() => router.push('/home')} className="mt-6">Go Home</Button>
            </div>
        );
    }
    
    let message = "Good effort! Keep practicing. 💪";
    if (isPerfectScore) message = "Perfect score! You're a true cricket expert! 🏆🎉";
    else if (score >= totalQuestions * 0.7) message = "Great job! You really know your cricket. 👍";

    return (
        <>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col items-center min-h-screen bg-background text-foreground p-4 overflow-y-auto"
            >
                <ResultsSummaryCard
                  isReview={isReview}
                  format={format}
                  brand={brand}
                  score={score}
                  totalQuestions={totalQuestions}
                  isPerfectScore={isPerfectScore}
                  message={message}
                  onGoHome={() => router.replace('/home')}
                  onViewAnswers={handleViewAnswers}
                  isViewingAnswers={showAnswers}
                />

                <AnalysisCard
                    questions={questions}
                    userAnswers={userAnswers}
                    timePerQuestion={timePerQuestion}
                    usedHintIndices={usedHintIndices}
                    slotId={slotId}
                    format={format}
                />

                {isPerfectScore && <Certificate format={format} userName={user?.displayName || "CricBlitz User"} date={today} slotTimings={slotTimings} />}
                
                {showAnswers && <AnswerReview questions={questions} userAnswers={userAnswers} />}
            </motion.div>

            {adConfig && (
                <AdDialog
                    open={!!adConfig}
                    onAdFinished={adConfig.onFinished}
                    duration={adConfig.ad.duration}
                    skippableAfter={adConfig.ad.skippableAfter}
                    adTitle={adConfig.ad.title}
                    adType={adConfig.ad.type}
                    adUrl={adConfig.ad.url}
                    adHint={adConfig.ad.hint}
                >
                    {adConfig.children}
                </AdDialog>
            )}
        </>
    );
}

export default function ResultsPage() {
    return (
        <Suspense fallback={<ResultsLoader />}>
            <ResultsComponent />
        </Suspense>
    )
}
