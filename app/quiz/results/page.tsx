
'use client';

import { Suspense, useMemo, useState, memo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, BarChart, Home, Sparkles, Cpu, BookOpen, Clock, Eye, XCircle, CheckCircle, Trophy } from 'lucide-react';
import type { QuizAttempt } from '@/ai/schemas';
import PageWrapper from '@/components/PageWrapper';
import AnalysisDialog from '@/components/history/AnalysisDialog';
import { Badge } from '@/components/ui/badge';
import { useQuizStatus } from '@/context/QuizStatusProvider';
import { AdDialog } from '@/components/AdDialog';
import ReviewDialog from '@/components/history/ReviewDialog';
import { adLibrary } from '@/lib/ads';
import { motion } from 'framer-motion';

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

const ResultsContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showAnswersAd, setShowAnswersAd] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  const attemptData = searchParams.get('attempt');

  const attempt: QuizAttempt | null = useMemo(() => {
    if (!attemptData) return null;
    try {
      return JSON.parse(atob(decodeURIComponent(attemptData)));
    } catch (e) {
      console.error("Failed to parse attempt data:", e);
      return null;
    }
  }, [attemptData]);

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

  const pageTitle = isDisqualified ? "Disqualified" : isPerfectScore ? "Perfect Score!" : "Quiz Complete";

  return (
    <PageWrapper title={pageTitle} showBackButton>
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
        >
            <Card className="text-center shadow-lg bg-card/80 overflow-hidden">
                <CardHeader className="bg-secondary/30 p-6">
                {isPerfectScore && !isDisqualified ? (
                    <>
                        <Trophy className="h-16 w-16 mx-auto text-yellow-400 animate-bounce" />
                        <CardTitle className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">Perfect Score!</CardTitle>
                    </>
                ) : (
                    <CardTitle className="text-3xl font-bold">{isDisqualified ? 'Disqualified (No-Ball)' : 'Quiz Complete!'}</CardTitle>
                )}
                <CardDescription className="text-lg">{isDisqualified ? 'Malpractice was detected.' : 'Here is your scorecard'}</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    {!isDisqualified && (
                        <div className="flex justify-around items-center">
                            <div className="flex flex-col items-center">
                                <span className="text-5xl font-bold">{attempt.score}<span className="text-3xl text-muted-foreground">/{attempt.totalQuestions}</span></span>
                                <span className="text-sm text-muted-foreground">Your Score</span>
                            </div>
                             <div className="flex flex-col items-center">
                                <span className="text-5xl font-bold">{timeTaken.toFixed(1)}<span className="text-3xl text-muted-foreground">s</span></span>
                                <span className="text-sm text-muted-foreground">Time Taken</span>
                            </div>
                        </div>
                    )}
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
            <Button size="lg" className="w-full h-14 text-base" onClick={handleViewAnswers}>
              <Eye className="mr-2 h-5 w-5" /> View Answers
            </Button>
            <AnalysisDialog attempt={attempt}>
                <Button variant="secondary" size="lg" className="w-full h-14 text-base">
                    <Sparkles className="mr-2 h-5 w-5" />
                    View AI Performance Analysis
                </Button>
            </AnalysisDialog>
          </>
        )}
        <Button size="lg" variant="outline" className="w-full h-14 text-base" onClick={() => router.push('/')}>
           <Home className="mr-2 h-5 w-5" /> Return to Home
        </Button>
      </div>

      {showAnswersAd && (
          <AdDialog
              open={showAnswersAd}
              onAdFinished={onAdFinished}
              duration={adLibrary.resultsAd.duration}
              skippableAfter={adLibrary.resultsAd.skippableAfter}
              adTitle={adLibrary.resultsAd.title}
              adType={adLibrary.resultsAd.type}
              adUrl={adLibrary.resultsAd.url}
          />
      )}
      <ReviewDialog
        open={showReviewDialog}
        onOpenChange={setShowReviewDialog}
        attempt={attempt}
      />
    </PageWrapper>
  );
};


export default function QuizResultsPage() {
    return (
        <Suspense fallback={<div>Loading results...</div>}>
            <ResultsContent />
        </Suspense>
    )
}
