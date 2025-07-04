'use client';

import React, { Suspense, useState, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { QuizQuestion } from '@/ai/schemas';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Trophy, Home, Loader2, CheckCircle2, XCircle, Star, SkipForward, Info } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface QuizAttempt {
  slotId: string;
  brand: string;
  format: string;
  score: number;
  totalQuestions: number;
  questions: QuizQuestion[];
  userAnswers: string[];
  timestamp: number;
}

const getQuizSlotId = () => {
  const now = new Date();
  const minutes = now.getMinutes();
  const currentSlotStartMinute = Math.floor(minutes / 10) * 10;
  const slotTime = new Date(now);
  slotTime.setMinutes(currentSlotStartMinute, 0, 0);
  return slotTime.getTime().toString();
};

function Certificate({ format, userName, date, slotTimings }: { format: string; userName: string; date: string; slotTimings: string }) {
    return (
        <div className="bg-white/90 text-primary rounded-lg p-6 border-4 border-yellow-400 shadow-2xl relative mt-4">
             <Star className="absolute top-2 right-2 text-yellow-400" size={32} />
             <Star className="absolute top-2 left-2 text-yellow-400" size={32} />
             <Star className="absolute bottom-2 right-2 text-yellow-400" size={32} />
             <Star className="absolute bottom-2 left-2 text-yellow-400" size={32} />
            <div className="text-center">
                <p className="text-lg font-semibold">Certificate of Achievement</p>
                <p className="text-sm">This certifies that</p>
                <p className="text-2xl font-bold my-2">{userName}</p>
                <p className="text-sm">has successfully achieved a perfect score in the</p>
                <p className="text-xl font-bold my-2">{format} Quiz</p>
                <p className="text-xs mt-4">Awarded on: {date}</p>
                <p className="text-xs mt-1">Quiz Slot: {slotTimings}</p>
            </div>
        </div>
    );
}

function AdDialog({ open, onAdFinished, duration, skippableAfter, adImageUrl, adTitle, children }: { open: boolean, onAdFinished: () => void, duration: number, skippableAfter: number, adImageUrl: string, adTitle: string, children?: React.ReactNode }) {
  const [adTimeLeft, setAdTimeLeft] = useState(duration);
  const [isSkippable, setIsSkippable] = useState(false);

  useEffect(() => {
    if (!open) return;

    setAdTimeLeft(duration);
    setIsSkippable(false);

    const timer = setInterval(() => {
      setAdTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onAdFinished();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const skippableTimer = setTimeout(() => {
      setIsSkippable(true);
    }, skippableAfter * 1000);

    return () => {
      clearInterval(timer);
      clearTimeout(skippableTimer);
    };
  }, [open, duration, skippableAfter, onAdFinished]);

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        // Only allow closing if the ad is skippable or finished
        if (!isOpen && isSkippable) {
            onAdFinished();
        }
    }}>
        <DialogContent
            className="bg-background text-foreground p-0 max-w-sm"
            onInteractOutside={(e) => e.preventDefault()}
            onEscapeKeyDown={(e) => {
                if (!isSkippable) {
                    e.preventDefault();
                }
            }}
        >
            <DialogHeader className="p-4 border-b">
                <DialogTitle>{adTitle}</DialogTitle>
            </DialogHeader>
            <div className="p-4 text-center">
                 <Image src={adImageUrl} alt="Advertisement" width={400} height={200} className="rounded-md" data-ai-hint="advertisement" />
                {children}
                <div className="mt-4 flex justify-between items-center gap-2">
                    <span className="text-sm text-muted-foreground shrink-0">Ad will close in {adTimeLeft}s</span>
                    {isSkippable ? (
                        <Button onClick={onAdFinished} size="sm" className="h-auto py-1 whitespace-normal">
                            <SkipForward className="mr-2 h-4 w-4"/> Skip
                        </Button>
                    ) : (
                        <Button disabled size="sm" className="h-auto py-1 whitespace-normal text-right">
                           Skip in {Math.max(0, adTimeLeft - (duration - skippableAfter))}s
                        </Button>
                    )}
                </div>
            </div>
        </DialogContent>
    </Dialog>
  );
}

function ResultsComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [showAnswersAd, setShowAnswersAd] = useState(false);
    const [showAnswers, setShowAnswers] = useState(false);

    const { questions, userAnswers, brand, format, isRetake } = useMemo(() => {
        const dataParam = searchParams.get('data');
        const retakeParam = searchParams.get('retake') === 'true';

        if (!dataParam) return { questions: [] as QuizQuestion[], userAnswers: [], brand: '', format: '', isRetake: retakeParam };

        try {
            const parsedData = JSON.parse(decodeURIComponent(dataParam));
            return {
                questions: parsedData.questions || [],
                userAnswers: parsedData.userAnswers || [],
                brand: parsedData.brand || 'CricBlitz',
                format: parsedData.format || 'Cricket',
                isRetake: retakeParam,
            };
        } catch (error) {
            console.error("Failed to parse results data:", error);
            return { questions: [] as QuizQuestion[], userAnswers: [], brand: '', format: '', isRetake: retakeParam };
        }
    }, [searchParams]);
    
    const score = useMemo(() => {
        if (!questions || !userAnswers) return 0;
        return userAnswers.reduce((acc, answer, index) => {
            if (index < questions.length && answer === questions[index].correctAnswer) {
                return acc + 1;
            }
            return acc;
        }, 0);
    }, [questions, userAnswers]);

    const slotTimings = useMemo(() => {
        const quizSlotId = getQuizSlotId();
        const slotStartTime = new Date(parseInt(quizSlotId, 10));
        const slotEndTime = new Date(slotStartTime.getTime() + 10 * 60 * 1000);

        const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

        return `${formatTime(slotStartTime)} - ${formatTime(slotEndTime)}`;
    }, []);

    useEffect(() => {
        const quizSlotId = getQuizSlotId();
        if (questions.length > 0 && userAnswers.length > 0) {
            try {
                const historyString = localStorage.getItem('cricblitz-quiz-history');
                const history: QuizAttempt[] = historyString ? JSON.parse(historyString) : [];

                const attemptExists = history.some(attempt => attempt.slotId === quizSlotId && attempt.format === format);

                if (!attemptExists) {
                    const newAttempt: QuizAttempt = {
                        slotId: quizSlotId,
                        brand,
                        format,
                        score,
                        totalQuestions: questions.length,
                        questions,
                        userAnswers,
                        timestamp: new Date().getTime(),
                    };
                    history.push(newAttempt);
                    localStorage.setItem('cricblitz-quiz-history', JSON.stringify(history));
                }
            } catch (e) {
                console.error("Could not save to localStorage", e);
            }
        }
    }, [questions, userAnswers, brand, format, score]);

    if (!questions || questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-primary to-green-400 text-white p-4">
                <h1 className="text-2xl font-bold mb-4">Invalid Results</h1>
                <p>Could not load quiz results data.</p>
                <Button onClick={() => router.push('/home')} className="mt-6">Go Home</Button>
            </div>
        );
    }
    
    const total = questions.length;
    const isPerfectScore = score === total && total > 0;

    let message = "Good effort! Keep practicing.";
    if (isPerfectScore) {
        message = "Perfect score! You're a true cricket expert!";
    } else if (score >= total * 0.7) {
        message = "Great job! You really know your cricket.";
    }

    const today = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <>
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-primary to-green-400 text-white p-4 overflow-y-auto">
                <Card className="w-full max-w-md text-center bg-white/10 border-0 my-4">
                    <CardHeader>
                        <div className="mx-auto bg-accent/20 p-4 rounded-full w-fit mb-4">
                            <Trophy className="h-12 w-12 text-yellow-300" />
                        </div>
                        <CardTitle className="text-3xl font-extrabold">Quiz Complete!</CardTitle>
                        <CardDescription className="text-base text-white/80">{format} Quiz - Sponsored by {brand}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {isRetake && (
                            <Alert variant="default" className="text-left bg-yellow-500/20 border-yellow-400 text-white">
                                <Info className="h-4 w-4 text-yellow-300" />
                                <AlertTitle className="font-bold">Attempt already recorded</AlertTitle>
                                <AlertDescription>
                                    You have already played this quiz. Here is your result for this slot.
                                </AlertDescription>
                            </Alert>
                        )}
                        <div>
                            <p className="text-lg">You Scored</p>
                            <p className="text-6xl font-bold my-2">
                                {score} <span className="text-3xl text-white/70">/ {total}</span>
                            </p>
                        </div>
                        <p className="text-lg font-medium text-yellow-300">{message}</p>
                        
                        {isPerfectScore && (
                            <div className="bg-green-500/20 p-4 rounded-lg border border-green-400">
                                <h3 className="font-bold text-lg text-white">Congratulations!</h3>
                                <p className="text-sm text-white/90">You've won ₹100! The amount will be credited via Razorpay soon.</p>
                            </div>
                        )}

                        <Button
                            size="lg"
                            className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg"
                            onClick={() => router.replace('/home')}
                        >
                            <Home className="mr-2 h-5 w-5" />
                            Back to Home
                        </Button>
                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={() => {
                                setShowAnswers(false);
                                setShowAnswersAd(true);
                            }}
                        >
                           View Correct Answers (Ad)
                        </Button>
                    </CardContent>
                </Card>

                {showAnswers && (
                    <Card className="w-full max-w-md text-left bg-white/10 border-0 mt-4 mb-4">
                        <CardHeader><CardTitle>Answer Review</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {questions.map((q, i) => (
                                <div key={i} className="text-sm p-3 rounded-lg bg-black/20">
                                    <p className="font-bold mb-2">{i+1}. {q.questionText}</p>
                                    <p className={cn("flex items-center", userAnswers[i] === q.correctAnswer ? "text-green-300" : "text-red-300")}>
                                      {userAnswers[i] === q.correctAnswer ? <CheckCircle2 className="mr-2"/> : <XCircle className="mr-2"/>}
                                      Your answer: {userAnswers[i] || 'Not answered'}
                                    </p>
                                    {userAnswers[i] !== q.correctAnswer && <p className="text-green-300 flex items-center"><CheckCircle2 className="mr-2"/> Correct: {q.correctAnswer}</p>}
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
                
                {isPerfectScore && <Certificate format={format} userName="CricBlitz User" date={today} slotTimings={slotTimings} />}
            </div>

            <AdDialog
                open={showAnswersAd}
                onAdFinished={() => {
                    setShowAnswersAd(false);
                    setShowAnswers(true);
                }}
                duration={30}
                skippableAfter={15}
                adImageUrl="https://placehold.co/800x400"
                adTitle="View Correct Answers"
            >
                <p className="font-bold text-lg mt-4">Thank you for your patience!</p>
            </AdDialog>
        </>
    );
}

export default function ResultsPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-primary to-green-400 text-white p-4">
                <Loader2 className="h-12 w-12 animate-spin" />
                <p>Loading results...</p>
            </div>
        }>
            <ResultsComponent />
        </Suspense>
    )
}
