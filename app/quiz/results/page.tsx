
'use client';

import { Suspense, useMemo, useState, memo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Sparkles, Eye, Ban, BadgeCheck, Trophy } from 'lucide-react';
import type { QuizAttempt } from '@/ai/schemas';
import PageWrapper from '@/components/PageWrapper';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { decodeAttempt } from '@/lib/quiz-utils';

const AdDialog = dynamic(() => import('@/components/AdDialog').then(mod => mod.AdDialog));
const AnalysisDialog = dynamic(() => import('@/components/history/AnalysisDialog'));
const ReviewDialog = dynamic(() => import('@/components/history/ReviewDialog'));


const LoadingSkeleton = () => (
    <PageWrapper title="Loading Results...">
        <div className="space-y-4 animate-pulse">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-40 w-full" />
            <div className="space-y-3 pt-4">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
            </div>
        </div>
    </PageWrapper>
)

const ResultsContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showAnswersAd, setShowAnswersAd] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  const attempt: QuizAttempt | null = useMemo(() => {
      const attemptData = searchParams.get('attempt');
      if (!attemptData) return null;
      return decodeAttempt(attemptData);
  }, [searchParams]);

  const adConfig = useMemo(() => {
      // Lazy load ad config to avoid importing it on every page
      return require('@/lib/ads').adLibrary.resultsAd;
  }, []);

  const handleViewAnswers = () => {
    setShowAnswersAd(true);
  };

  const onAdFinished = () => {
    setShowAnswersAd(false);
    setShowReviewDialog(true);
  };

  if (!attempt) {
    return (
        <PageWrapper title="Error">
            <div className="flex flex-col items-center justify-center text-center p-4">
                <h2 className="text-2xl font-bold text-destructive">Could Not Load Quiz Results</h2>
                <p className="text-muted-foreground">There was an error retrieving your scorecard.</p>
                <Button onClick={() => router.push('/')} className="mt-4">
                Return to Home
                </Button>
            </div>
        </PageWrapper>
    );
  }

  const isPerfectScore = attempt.score === attempt.totalQuestions;
  const isDisqualified = !!attempt.reason;
  const totalTime = Math.round(attempt.timePerQuestion?.reduce((a, b) => a + b, 0) || 0);

  const getMotivationalLine = () => {
      if(isDisqualified) return { text: "Fair play is key to the spirit of cricket.", emoji: "🤝"};
      if(isPerfectScore) return { text: "Flawless century! You're a true champion.", emoji: "🏆" };
      if(attempt.score >= 3) return { text: "Good effort! Keep practicing.", emoji: "💪" };
      return { text: "Tough match, but every game is a learning experience!", emoji: "👍" };
  }
  const motivationalLine = getMotivationalLine();
  const pageTitle = isDisqualified ? "Disqualified" : isPerfectScore ? "Perfect Score!" : "Quiz Complete!";

  return (
    <PageWrapper title="Quiz Scorecard" showBackButton>
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="space-y-6"
        >
            <Card className="text-center shadow-lg bg-card/80 overflow-hidden border-none">
                <CardContent className="p-6 space-y-6">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="mx-auto bg-primary/10 p-4 rounded-full w-fit"
                    >
                        {isDisqualified ? (
                            <Ban className="h-12 w-12 text-destructive" />
                         ) : (
                            <span className="text-5xl">🏆</span>
                        )}
                    </motion.div>

                    <h1 className="text-3xl font-bold">{pageTitle}</h1>
                    <p className="text-muted-foreground">{attempt.format} Quiz - Sponsored by {attempt.brand}</p>
                    
                    {!isDisqualified && (
                        <>
                            <div className="flex justify-around items-center pt-4">
                                <div className="text-center">
                                    <p className="text-muted-foreground text-sm">You Scored</p>
                                    <p className="text-4xl font-bold tracking-tighter">
                                        <span className="text-primary">{attempt.score}</span>/{attempt.totalQuestions}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-muted-foreground text-sm">Time Taken</p>
                                    <p className="text-4xl font-bold tracking-tighter">
                                        {totalTime}<span className="text-2xl text-muted-foreground">s</span>
                                    </p>
                                </div>
                            </div>
                            <p className="text-lg font-semibold text-primary">{motivationalLine.text}</p>
                        </>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
                        <Button size="lg" variant="secondary" className="w-full h-14 text-base" onClick={() => router.push('/')}>
                            <Home className="mr-2 h-5 w-5" /> Go Home
                        </Button>
                        {!isDisqualified && (
                            <Button size="lg" variant="outline" className="w-full h-14 text-base" onClick={handleViewAnswers}>
                                <Eye className="mr-2 h-5 w-5" /> View Correct Answers (Ad)
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {!isDisqualified && (
              <Card className="bg-card/80">
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary" /> AI Performance Analysis</CardTitle>
                      <CardDescription>Want to improve? Get a personalized analysis of your performance from our AI coach.</CardDescription>
                  </CardHeader>
                  <CardContent>
                      <AnalysisDialog attempt={attempt}>
                          <Button size="lg" className="w-full">Generate Free Analysis</Button>
                      </AnalysisDialog>
                  </CardContent>
              </Card>
            )}
            
        </motion.div>
      
      {showAnswersAd && adConfig && (
          <AdDialog
              open={showAnswersAd}
              onAdFinished={onAdFinished}
              duration={adConfig.duration}
              skippableAfter={adConfig.skippableAfter}
              adTitle={adConfig.title}
              adType={adConfig.type}
              adUrl={adConfig.url}
          />
      )}
      {showReviewDialog && (
          <ReviewDialog
            open={showReviewDialog}
            onOpenChange={setShowReviewDialog}
            attempt={attempt}
          />
      )}
    </PageWrapper>
  );
};


export default function QuizResultsPage() {
    return (
        <Suspense fallback={<LoadingSkeleton />}>
            <ResultsContent />
        </Suspense>
    )
}
