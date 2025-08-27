
'use client';

import { Suspense, useMemo, useState, memo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Sparkles, Cpu, BookOpen, Clock, Eye, Trophy, BadgeCheck, Ban } from 'lucide-react';
import type { QuizAttempt } from '@/ai/schemas';
import PageWrapper from '@/components/PageWrapper';
import { Badge } from '@/components/ui/badge';
import { useQuizStatus } from '@/context/QuizStatusProvider';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { decodeAttempt } from '@/lib/quiz-utils';

const AdDialog = dynamic(() => import('@/components/AdDialog').then(mod => mod.AdDialog));
const AnalysisDialog = dynamic(() => import('@/components/history/AnalysisDialog'));
const ReviewDialog = dynamic(() => import('@/components/history/ReviewDialog'));

const CountdownTimer = memo(() => {
    const { timeLeft } = useQuizStatus();
    return (
        <Card className="mt-4 bg-secondary/50 border-primary/20">
            <CardContent className="p-3 text-center">
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 text-primary" />
                    <span>Next quiz opens in:</span>
                    <span className="font-bold text-foreground tabular-nums">{String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}</span>
                </div>
            </CardContent>
        </Card>
    );
});
CountdownTimer.displayName = 'CountdownTimer';

const LoadingSkeleton = () => (
    <PageWrapper title="Loading Results...">
        <div className="space-y-4 animate-pulse">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-12 w-full" />
            <div className="space-y-3 pt-4">
                <Skeleton className="h-14 w-full" />
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

  const timeTaken = attempt.timePerQuestion?.reduce((a, b) => a + b, 0) || 0;
  const isPerfectScore = attempt.score === attempt.totalQuestions;
  const isDisqualified = !!attempt.reason;

  const pageTitle = isDisqualified ? "Disqualified" : "Quiz Results";

  const getMotivationalLine = () => {
      if(isDisqualified) return { text: "Fair play is key to the spirit of cricket.", emoji: " handshake "};
      if(isPerfectScore) return { text: "A flawless century! You're a true champion.", emoji: "🏆" };
      if(attempt.score >= 3) return { text: "Great innings! You're getting closer to a perfect score.", emoji: "🏏" };
      return { text: "Tough match, but every game is a learning experience!", emoji: "💪" };
  }
  const motivationalLine = getMotivationalLine();

  return (
    <PageWrapper title={pageTitle} showBackButton>
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
        >
            <Card className="text-center shadow-lg bg-card/80 overflow-hidden border border-primary/20">
                <CardHeader className="p-4 bg-secondary/30">
                    <CardDescription className="text-sm">
                        {attempt.format} Quiz by {attempt.brand}
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="flex justify-around items-center">
                        {isDisqualified ? (
                             <div className="flex flex-col items-center text-destructive">
                                <Ban className="h-16 w-16" />
                                <span className="text-3xl font-bold mt-2">Disqualified</span>
                                <span className="text-sm text-muted-foreground mt-1">No-Ball detected</span>
                            </div>
                        ) : (
                             <div className="flex flex-col items-center">
                                <span className="text-6xl font-bold text-primary">{attempt.score}<span className="text-4xl text-muted-foreground">/{attempt.totalQuestions}</span></span>
                                <span className="text-sm font-semibold text-muted-foreground">Your Score</span>
                            </div>
                        )}
                        {!isDisqualified && (
                             <div className="flex flex-col items-center">
                                <span className="text-6xl font-bold">{timeTaken.toFixed(1)}<span className="text-4xl text-muted-foreground">s</span></span>
                                <span className="text-sm font-semibold text-muted-foreground">Time Taken</span>
                            </div>
                        )}
                    </div>

                    <div className="text-center">
                        <p className="text-lg font-semibold">{motivationalLine.emoji} {motivationalLine.text}</p>
                    </div>
                    
                    {attempt.source && (
                        <div className="flex justify-center pt-2">
                            <Badge variant={attempt.source === 'ai' ? "default" : "outline"} className="font-normal">
                                {attempt.source === 'ai' ? <Cpu className="h-3 w-3 mr-1.5"/> : <BookOpen className="h-3 w-3 mr-1.5"/>}
                                {attempt.source === 'ai' ? 'AI Generated Quiz' : 'Classic Quiz'}
                            </Badge>
                        </div>
                    )}
                </CardContent>
            </Card>
        </motion.div>
      
      <CountdownTimer />

      <div className="space-y-3 pt-6">
        {!isDisqualified && (
          <>
            {isPerfectScore && (
                <Button asChild size="lg" className="w-full h-14 text-base bg-gradient-to-r from-yellow-400 to-amber-600 text-black hover:from-yellow-500 hover:to-amber-700 animate-glow">
                   <Link href="/certificates">
                     <BadgeCheck className="mr-2 h-5 w-5" /> View Certificate
                   </Link>
                </Button>
            )}
            <AnalysisDialog attempt={attempt}>
                <Button variant="secondary" size="lg" className="w-full h-14 text-base">
                    <Sparkles className="mr-2 h-5 w-5" />
                    AI Performance Review
                </Button>
            </AnalysisDialog>
             <Button size="lg" variant="secondary" className="w-full h-14 text-base" onClick={handleViewAnswers}>
              <Eye className="mr-2 h-5 w-5" /> Review Answers
            </Button>
          </>
        )}
        <Button size="lg" variant="outline" className="w-full h-14 text-base" onClick={() => router.push('/')}>
           <Home className="mr-2 h-5 w-5" /> Return to Home
        </Button>
      </div>

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
