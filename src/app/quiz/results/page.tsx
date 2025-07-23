
'use client';

import React, { Suspense, useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import type { Ad } from '@/lib/ads';
import { adLibrary } from '@/lib/ads';
import { Button } from '@/components/ui/button';
import { AdDialog } from '@/components/AdDialog';
import { Home, Loader2, AlertTriangle, Info } from 'lucide-react';
import { ResultsSummaryCard } from '@/components/quiz/ResultsSummaryCard';
import { Certificate } from '@/components/quiz/Certificate';
import { AnalysisCard } from '@/components/quiz/AnalysisCard';
import { AnswerReview } from '@/components/quiz/AnswerReview';
import { motion } from 'framer-motion';
import type { QuizAttempt } from '@/lib/mockData';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const MalpracticeScreen = memo(({ noBallCount = 1 }: { noBallCount?: number }) => {
    const router = useRouter();
    const isOut = noBallCount >= 3;

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
                <h1 className="text-3xl font-extrabold text-destructive">{isOut ? "You're Out for the Day!" : "It's a No-Ball!"}</h1>
                <p className="text-base text-muted-foreground mt-2">{isOut ? "3 No-Balls have been recorded." : `Quiz Terminated for Unfair Play. (${noBallCount}/3)`}</p>
                <div className="space-y-4 mt-4 text-left">
                     <p className="text-lg">{isOut ? "You've been timed out!" : "Like a batsman leaving the crease, you strayed from the quiz tab."}</p>
                     <p className="text-sm text-muted-foreground">{isOut ? "You cannot participate in any more quizzes until tomorrow. See you in the next match!" : `This is your ${noBallCount === 1 ? 'first' : 'second'} No-Ball. One more and you're Out for the Day!`}</p>
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
        <p className="mt-4 text-muted-foreground">The third umpire is reviewing the results...</p>
    </div>
);

function ResultsComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    
    const [showAnswers, setShowAnswers] = useState(false);
    const [adConfig, setAdConfig] = useState<{ ad: Ad; onFinished: () => void; children?: React.ReactNode; } | null>(null);

    const [finalAttempt, setFinalAttempt] = useState<QuizAttempt | null>(null);

    useEffect(() => {
        const attemptDataString = searchParams.get('attempt');
        
        if (attemptDataString) {
            try {
                const decodedString = Buffer.from(decodeURIComponent(attemptDataString), 'base64').toString('utf-8');
                const attemptData = JSON.parse(decodedString);
                setFinalAttempt(attemptData);
            } catch (error) {
                console.error("Failed to parse attempt data from URL:", error);
                router.replace('/home');
            }
        } else {
            const timer = setTimeout(() => router.replace('/home'), 2000);
            return () => clearTimeout(timer);
        }
    }, [searchParams, router]);
    
    const { isReview, reason, noBallCount, today, questions, userAnswers, brand, format, timePerQuestion, usedHintIndices, score, totalQuestions, slotId, timestamp, isPerfectScore, slotTimings } = useMemo(() => {
        const isReview = searchParams.get('review') === 'true';
        const reason = finalAttempt?.reason;
        const noBallCount = reason?.startsWith('malpractice_') ? parseInt(reason.split('_')[1], 10) : 0;
        const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

        const { questions = [], userAnswers = [], brand = 'N/A', format = 'N/A', timePerQuestion = [], usedHintIndices = [], score = 0, slotId = '', timestamp: attemptTimestamp } = finalAttempt || {};
        
        const total = finalAttempt?.totalQuestions || questions.length || 0;
        const isPerfect = score === total && total > 0;
        
        let timings = '';
        if (attemptTimestamp) {
            const attemptDate = new Date(attemptTimestamp);
            const minutes = attemptDate.getMinutes();
            const slotStartMinute = Math.floor(minutes / 10) * 10;
            const slotStartTime = new Date(attemptDate);
            slotStartTime.setMinutes(slotStartMinute, 0, 0);
            const slotEndTime = new Date(slotStartTime.getTime() + 10 * 60 * 1000);
            const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
            timings = `${formatTime(slotStartTime)} - ${formatTime(slotEndTime)}`;
        }

        return {
            isReview,
            reason,
            noBallCount,
            today,
            questions,
            userAnswers,
            brand,
            format,
            timePerQuestion,
            usedHintIndices,
            score,
            totalQuestions: total,
            slotId,
            timestamp: attemptTimestamp,
            isPerfectScore: isPerfect,
            slotTimings: timings
        };
    }, [finalAttempt, searchParams]);
    
    
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

    if (reason?.startsWith('malpractice_')) {
        return <MalpracticeScreen noBallCount={noBallCount} />;
    }

    if (!finalAttempt) {
        return <ResultsLoader />;
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
                {isReview && (
                    <div className="w-full max-w-md pt-4">
                        <Alert variant="default" className="border-primary bg-primary/10">
                            <Info className="h-4 w-4 text-primary" />
                            <AlertTitle>Reviewing Previous Innings</AlertTitle>
                            <AlertDescription className="text-foreground/80">
                                This is the scorecard from your last attempt in this slot.
                            </AlertDescription>
                        </Alert>
                    </div>
                )}
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

                {isPerfectScore && <Certificate format={format} userName={user?.displayName || "indcric User"} date={today} slotTimings={slotTimings} />}
                
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
