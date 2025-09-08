
'use client';

import React, { Suspense, useEffect, useState, memo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Home, Sparkles, Eye, Ban, BadgeCheck, AlertTriangle } from 'lucide-react';
import type { QuizAttempt } from '@/ai/schemas';
import PageWrapper from '@/components/PageWrapper';
import { motion } from 'framer-motion';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/hooks/use-toast';

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
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const searchParams = useSearchParams();
    const attemptId = searchParams.get('attemptId');

    const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [showReviewDialog, setShowReviewDialog] = useState(false);
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

    useEffect(() => {
        if (!attemptId) {
            setError("No quiz attempt ID found in the link.");
            setLoading(false);
            return;
        }
        if (!user) {
            // This case is mostly handled by AuthGuard, but good to have a fallback.
             toast({ title: "Not logged in", description: "You need to be logged in to view results.", variant: "destructive"});
             router.replace(`/auth/login?from=/quiz/results?attemptId=${attemptId}`);
            setLoading(false);
            return;
        }

        const fetchAttempt = async () => {
            if (!db) {
                setError("Database connection is not available.");
                setLoading(false);
                return;
            }
            
            setLoading(true);
            try {
                // The attempt ID is the slot ID.
                const attemptDocRef = doc(db, 'users', user.uid, 'quizAttempts', attemptId);
                const attemptDoc = await getDoc(attemptDocRef);
                if (attemptDoc.exists()) {
                    setAttempt(attemptDoc.data() as QuizAttempt);
                } else {
                    setError("We couldn't find the quiz data for this link. It might be expired or invalid.");
                }
            } catch (err) {
                console.error("Failed to fetch quiz attempt:", err);
                setError("A server error occurred while fetching your results.");
            } finally {
                setLoading(false);
            }
        };

        fetchAttempt();
    }, [attemptId, user, router, toast]);

    const handleViewAnswers = () => {
        setShowReviewDialog(true);
    };

    if (loading) {
        return <LoadingSkeleton />;
    }

    if (error || !attempt) {
        return (
            <PageWrapper title="Error">
                <Card className="text-center">
                    <CardHeader>
                        <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                        <CardTitle className="text-2xl font-bold text-destructive">Could Not Load Quiz Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-6">{error || "The attempt data is missing."}</p>
                        <Button onClick={() => router.push('/')}>
                            <Home className="mr-2 h-4 w-4" />
                            Return to Home
                        </Button>
                    </CardContent>
                </Card>
            </PageWrapper>
        );
    }
  
    const isPerfectScore = attempt.score === attempt.totalQuestions;
    const isDisqualified = !!attempt.reason;
  
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
                      
                      <div className="space-y-1">
                          <h1 className="text-3xl font-bold">{pageTitle}</h1>
                          <p className="text-muted-foreground">{attempt.format} Quiz - Sponsored by {attempt.brand}</p>
                      </div>
                      
                      {!isDisqualified && (
                          <>
                              <div className="flex justify-around items-center">
                                  <div className="text-center">
                                      <BadgeCheck className="h-8 w-8 text-primary mx-auto mb-1" />
                                      <p className="text-muted-foreground text-sm">You Scored</p>
                                      <p className="text-5xl font-bold tracking-tighter">
                                          <span className="text-primary">{attempt.score}</span>/{attempt.totalQuestions}
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
                                  <Eye className="mr-2 h-5 w-5" /> View Answers
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
                      <Button size="lg" className="w-full" onClick={() => setIsAnalysisOpen(true)}>Generate Free Analysis</Button>
                    </CardContent>
                </Card>
              )}
          </motion.div>

        {attempt && (
          <AnalysisDialog
            open={isAnalysisOpen}
            onOpenChange={setIsAnalysisOpen}
            attempt={attempt}
          />
        )}
        
        {attempt && (
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
