
'use client';

import type { QuizAttempt } from '@/ai/schemas';
import { adLibrary } from '@/lib/ads';
import { decodeAttempt } from '@/lib/quiz-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthProvider';
import { motion } from 'framer-motion';
import { Home, Sparkles, Eye, Ban, BadgeCheck, Award } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense, useMemo, useState, memo, useCallback, useEffect } from 'react';
import PageWrapper from '@/components/PageWrapper';
import { useToast } from '@/hooks/use-toast';

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
);

const ResultsContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { markAttemptAsReviewed } = useAuth();
  const { toast } = useToast();
  
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [showAdForReview, setShowAdForReview] = useState(false);

  const decodedAttempt = useMemo(() => {
    const attemptData = searchParams.get('attempt');
    if (!attemptData) return null;
    return decodeAttempt(attemptData);
  }, [searchParams]);
  
  const [attempt, setAttempt] = useState(decodedAttempt);

  useEffect(() => {
    if (!decodedAttempt) {
      toast({
        title: "Invalid Results Link",
        description: "Could not find your quiz data. Redirecting to home.",
        variant: "destructive"
      });
      router.replace('/');
    }
  }, [decodedAttempt, router, toast]);

  const handleViewAnswers = useCallback(() => {
    if (!attempt) return;
    if (attempt.reviewed) {
        setShowReviewDialog(true);
    } else {
        setShowAdForReview(true);
    }
  }, [attempt]);
  
  const onAdFinished = useCallback(async () => {
    setShowAdForReview(false);
    if(attempt?.slotId) {
        const { success } = await markAttemptAsReviewed(attempt.slotId);
        if (success) {
            setAttempt(prev => prev ? { ...prev, reviewed: true } : null);
            toast({ title: "Success", description: "You can now view your answers." });
        } else {
            toast({ title: "Error", description: "Could not save review status. Please check connection.", variant: "destructive" });
        }
    }
    setShowReviewDialog(true);
  }, [attempt, markAttemptAsReviewed, toast]);
  
  if (!attempt) {
    return <LoadingSkeleton />;
  }

  const isPerfectScore = attempt.score === attempt.totalQuestions;
  const isDisqualified = !!attempt.reason;
  const adConfig = adLibrary.resultsAd;

  const motivationalLine = useMemo(() => {
    if (isDisqualified) return "Fair play is key to the spirit of cricket.";
    if (isPerfectScore) return "Flawless century! You're a true champion.";
    if (attempt.score >= 3) return "Good effort! Keep practicing.";
    return "Tough match, but every game is a learning experience!";
  }, [isDisqualified, isPerfectScore, attempt.score]);

  const pageTitle = useMemo(() => {
    if (isDisqualified) return "Disqualified";
    if (isPerfectScore) return "Perfect Score!";
    return "Quiz Complete!";
  }, [isDisqualified, isPerfectScore]);
  
  return (
    <PageWrapper title="Quiz Scorecard" showBackButton>
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: 'spring' }}
            className="space-y-6"
        >
            <Card className="text-center shadow-lg bg-card/80 overflow-hidden border-none">
                <CardHeader className="p-6">
                    <motion.div
                        animate={{ scale: [1, 1.1, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        className="mx-auto bg-primary/10 p-4 rounded-full w-fit"
                    >
                        {isDisqualified ? <Ban className="h-12 w-12 text-destructive" /> : <Award className="h-12 w-12 text-primary" />}
                    </motion.div>
                    <CardTitle className="text-3xl font-bold mt-4">{pageTitle}</CardTitle>
                    <CardDescription>{attempt.format} Quiz - Sponsored by {attempt.brand}</CardDescription>
                </CardHeader>

                <CardContent className="p-6 pt-0 space-y-6">
                    {!isDisqualified && (
                        <div className="space-y-4">
                            <div className="flex justify-around items-center">
                                <div className="text-center">
                                    <BadgeCheck className="h-8 w-8 text-primary mx-auto mb-1" />
                                    <p className="text-muted-foreground text-sm">You Scored</p>
                                    <p className="text-5xl font-bold tracking-tighter">
                                        <span className="text-primary">{attempt.score}</span>/{attempt.totalQuestions}
                                    </p>
                                </div>
                            </div>
                            <p className="text-lg font-semibold text-primary">{motivationalLine}</p>
                        </div>
                    )}
                    <div className="grid grid-cols-1 gap-4 pt-4 border-t border-border">
                        <Button size="lg" variant="secondary" className="w-full h-14 text-base" onClick={() => router.push('/')}>
                            <Home className="mr-2 h-5 w-5" /> Go Home
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {!isDisqualified && (
              <Card className="bg-card/80">
                  <CardHeader>
                      <CardTitle className="flex items-center gap-2"><Sparkles className="text-primary" /> AI Performance Analysis</CardTitle>
                      <CardDescription>Get a personalized analysis of your performance from our AI coach.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button size="lg" className="w-full" onClick={() => setIsAnalysisOpen(true)}>Generate Free Analysis</Button>
                        <Button size="lg" variant="outline" className="w-full" onClick={handleViewAnswers}>
                            <Eye className="mr-2 h-4 w-4" /> View Answers {attempt.reviewed ? '' : '(Ad)'}
                        </Button>
                  </CardContent>
              </Card>
            )}
        </motion.div>
      
      {showAdForReview && adConfig && (
          <AdDialog
              open={showAdForReview}
              onOpenChange={setShowAdForReview}
              onAdFinished={onAdFinished}
              {...adConfig}
          >
            <p className="text-xs text-muted-foreground mt-2">Watch this ad to review your answers. This is a one-time action per quiz.</p>
          </AdDialog>
      )}

      {attempt && (
         <>
            <ReviewDialog
                open={showReviewDialog}
                onOpenChange={setShowReviewDialog}
                attempt={attempt}
            />
            <AnalysisDialog
                attempt={attempt}
                open={isAnalysisOpen}
                onOpenChange={setIsAnalysisOpen}
            />
         </>
      )}
    </PageWrapper>
  );
};

function QuizResultsPage() {
    return (
        <Suspense fallback={<LoadingSkeleton />}>
            <ResultsContent />
        </Suspense>
    );
}

export default memo(QuizResultsPage);
