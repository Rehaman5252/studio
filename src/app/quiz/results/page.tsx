
'use client';

import React, { Suspense, useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useQuizStatus } from '@/context/QuizStatusProvider';
import type { QuizQuestion } from '@/ai/schemas';
import type { Ad } from '@/lib/ads';
import { adLibrary } from '@/lib/ads';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AdDialog } from '@/components/AdDialog';
import { Trophy, Home, Loader2, CheckCircle2, XCircle, Star, Info, MessageCircleQuestion, Sparkles, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateQuizAnalysis } from '@/ai/flows/generate-quiz-analysis-flow';
import ReactMarkdown from 'react-markdown';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import CricketLoading from '@/components/CricketLoading';
import { db } from '@/lib/firebase';
import { doc, updateDoc, increment } from 'firebase/firestore';

const MalpracticeScreen = memo(() => {
    const router = useRouter();
    return (
        <div 
            className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4"
        >
            <Card className="w-full max-w-md text-center bg-card border-2 border-destructive my-4">
                <CardHeader>
                     <div className="mx-auto bg-destructive/20 p-4 rounded-full w-fit mb-4">
                        <AlertTriangle className="h-12 w-12 text-destructive" />
                    </div>
                    <CardTitle className="text-3xl font-extrabold text-destructive">Quiz Terminated</CardTitle>
                    <CardDescription className="text-base text-muted-foreground">Malpractice Detected</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     <p className="text-lg">Your quiz session was ended because you switched tabs or left the app.</p>
                     <p className="text-sm text-muted-foreground">To ensure fair play for all users, this is not permitted during a quiz.</p>
                     <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90 mt-4" onClick={() => router.replace('/home')}>
                        <Home className="mr-2 h-5 w-5" /> Go Home
                     </Button>
                </CardContent>
            </Card>
        </div>
    );
});
MalpracticeScreen.displayName = "MalpracticeScreen";


const Certificate = memo(({ format, userName, date, slotTimings }: { format: string; userName: string; date: string; slotTimings: string }) => (
    <div className="w-full max-w-md">
        <div className="bg-card text-foreground rounded-lg p-6 border-4 border-primary shadow-2xl shadow-primary/20 relative mt-4">
            <Star className="absolute top-2 right-2 text-primary" size={32} />
            <Star className="absolute top-2 left-2 text-primary" size={32} />
            <Star className="absolute bottom-2 right-2 text-primary" size={32} />
            <Star className="absolute bottom-2 left-2 text-primary" size={32} />
            <div className="text-center">
                <p className="text-lg font-semibold text-muted-foreground">Certificate of Achievement</p>
                <p className="text-sm">This certifies that</p>
                <p className="text-2xl font-bold my-2 text-primary">{userName}</p>
                <p className="text-sm">has successfully achieved a perfect score in the</p>
                <p className="text-xl font-bold my-2">{format} Quiz</p>
                <p className="text-xs mt-4 text-muted-foreground">Awarded on: {date}</p>
                <p className="text-xs mt-1 text-muted-foreground">Quiz Slot: {slotTimings}</p>
            </div>
        </div>
    </div>
));
Certificate.displayName = 'Certificate';

const AnalysisCard = memo(({ questions, userAnswers, timePerQuestion, usedHintIndices, slotId }: { questions: QuizQuestion[]; userAnswers: string[], timePerQuestion?: number[], usedHintIndices?: number[], slotId: string }) => {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getAnalysisCacheKey = useCallback(() => `analysis_${slotId}`, [slotId]);

    useEffect(() => {
        const cachedAnalysis = localStorage.getItem(getAnalysisCacheKey());
        if (cachedAnalysis) {
            setAnalysis(cachedAnalysis);
        }
    }, [getAnalysisCacheKey]);

    const handleFetchAnalysis = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateQuizAnalysis({ questions, userAnswers, timePerQuestion, usedHintIndices });
            setAnalysis(result.analysis);
            localStorage.setItem(getAnalysisCacheKey(), result.analysis);
        } catch (err) {
            console.error("Analysis generation failed:", err);
            setError('Could not generate the analysis. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, [questions, userAnswers, timePerQuestion, usedHintIndices, getAnalysisCacheKey]);
    
    return (
        <div className="w-full max-w-md">
            <Card className="w-full text-left bg-card border-0 mt-4 mb-4">
                 <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="text-primary" /> AI Performance Analysis
                    </CardTitle>
                </CardHeader>
                <CardContent>
                {analysis ? (
                     <div className="prose prose-sm dark:prose-invert max-w-none text-foreground/90 [&_h2]:font-bold [&_h2]:text-lg [&_h2]:mt-4 [&_h3]:font-semibold [&_h3]:text-md [&_h3]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_p]:mt-2">
                        <ReactMarkdown>{analysis}</ReactMarkdown>
                    </div>
                ) : (
                    <div className="text-center">
                        <h3 className="text-lg font-bold">Want to improve?</h3>
                        <p className="text-sm text-muted-foreground mb-4">Get a personalized analysis of your performance from our AI coach.</p>
                        {isLoading ? (
                            <Button disabled className="w-full">
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Generating Report...
                            </Button>
                        ) : (
                            <Button onClick={handleFetchAnalysis} className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                                Generate Free Analysis
                            </Button>
                        )}
                        {error && <p className="text-destructive text-xs mt-2">{error}</p>}
                    </div>
                )}
                </CardContent>
            </Card>
        </div>
    )
});
AnalysisCard.displayName = 'AnalysisCard';


const AnswerReview = memo(({ questions, userAnswers }: { questions: QuizQuestion[], userAnswers: string[] }) => (
    <div className="w-full max-w-md">
        <Card className="w-full text-left bg-card border-0 mt-4 mb-4">
            <CardHeader><CardTitle>Answer Review</CardTitle></CardHeader>
            <CardContent className="space-y-4">
                {questions.map((q, i) => (
                    <div key={i} className="text-sm p-3 rounded-lg bg-background">
                        <p className="font-bold mb-2 flex items-start gap-2"><MessageCircleQuestion className="h-5 w-5 mt-0.5 shrink-0"/> {i+1}. {q.questionText}</p>
                        <p className={cn("flex items-center text-foreground/90", userAnswers[i] === q.correctAnswer ? 'text-green-400' : 'text-red-400' )}>
                          {userAnswers[i] === q.correctAnswer ? <CheckCircle2 className="mr-2 shrink-0"/> : <XCircle className="mr-2 shrink-0"/>}
                          Your answer: {userAnswers[i] || 'Not answered'}
                        </p>
                        {userAnswers[i] !== q.correctAnswer && <p className="text-green-400 flex items-center"><CheckCircle2 className="mr-2 shrink-0"/> Correct: {q.correctAnswer}</p>}
                        {q.explanation && (
                            <div className="mt-2 pt-2 border-t border-border text-muted-foreground">
                                <p className="font-semibold text-foreground">Explanation:</p>
                                <p>{q.explanation}</p>
                            </div>
                        )}
                    </div>
                ))}
            </CardContent>
        </Card>
    </div>
));
AnswerReview.displayName = 'AnswerReview';

function ResultsComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const { lastAttemptInSlot, isLoading: isContextLoading } = useQuizStatus();
    
    // Hooks must be called unconditionally at the top level.
    const [showAnswers, setShowAnswers] = useState(false);
    const [adConfig, setAdConfig] = useState<{ ad: Ad; onFinished: () => void; children?: React.ReactNode; } | null>(null);
    const isReview = useMemo(() => searchParams.get('review') === 'true', [searchParams]);
    const reason = useMemo(() => searchParams.get('reason'), [searchParams]);
    const today = useMemo(() => new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }), []);
    
    const { questions, userAnswers, brand, format, timePerQuestion, usedHintIndices, score, totalQuestions, slotId } = useMemo(() => {
        return {
            ...lastAttemptInSlot,
            totalQuestions: lastAttemptInSlot?.questions?.length || 0,
        };
    }, [lastAttemptInSlot]);
    
    const isPerfectScore = useMemo(() => score === totalQuestions && totalQuestions > 0, [score, totalQuestions]);
    
    useEffect(() => {
        if (isPerfectScore && user && db) {
            const userDocRef = doc(db, 'users', user.uid);
            updateDoc(userDocRef, { 
                perfectScores: increment(1),
                certificatesEarned: increment(1),
            }).catch(error => {
                console.error("Error updating perfect score count:", error);
            });
        }
    }, [isPerfectScore, user]);
    
    
    const slotTimings = useMemo(() => {
        if (!lastAttemptInSlot?.slotId) return '';
        const slotStartTime = new Date(parseInt(lastAttemptInSlot.slotId, 10));
        const slotEndTime = new Date(slotStartTime.getTime() + 10 * 60 * 1000);
        const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        return `${formatTime(slotStartTime)} - ${formatTime(slotEndTime)}`;
    }, [lastAttemptInSlot?.slotId]);
    
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

    // Conditional returns can only happen AFTER all hooks are called.
    if (reason === 'malpractice') {
        return <MalpracticeScreen />;
    }

    if (isContextLoading) {
        return <CricketLoading message="Calculating your score..." />;
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
            <div 
                className="flex flex-col items-center min-h-screen bg-background text-foreground p-4 overflow-y-auto"
            >
                <div className="w-full max-w-md">
                    <Card className="w-full text-center bg-card border-0 my-4">
                        {isReview && (
                            <div className="p-4 pt-6 text-left">
                                <Alert variant="default" className="border-primary bg-primary/10">
                                    <Info className="h-4 w-4 text-primary" />
                                    <AlertTitle>Reviewing Attempt</AlertTitle>
                                    <AlertDescription className="text-foreground/80">
                                        You have already played in this 10-minute slot. Here are your results.
                                    </AlertDescription>
                                </Alert>
                            </div>
                        )}
                        <CardHeader className={cn(isReview && "pt-2")}>
                            <div className="mx-auto bg-primary/20 p-4 rounded-full w-fit mb-4">
                                <Trophy className="h-12 w-12 text-primary" />
                            </div>
                            <CardTitle className="text-3xl font-extrabold">Quiz Complete!</CardTitle>
                            <CardDescription className="text-base text-muted-foreground">{format} Quiz - Sponsored by {brand}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-lg">You Scored</p>
                                <p className="text-6xl font-bold my-2 text-primary">
                                    {score} <span className="text-3xl text-muted-foreground">/ {totalQuestions}</span>
                                </p>
                            </div>
                            <p className="text-lg font-medium text-primary">{message}</p>
                            
                            {isPerfectScore && (
                                <div className="bg-primary/20 p-4 rounded-lg border border-primary">
                                    <h3 className="font-bold text-lg text-foreground">Congratulations!</h3>
                                    <p className="text-sm text-foreground/90">You've won a special reward!</p>
                                </div>
                            )}
                            
                            <div className="grid grid-cols-1 gap-3">
                                <Button size="lg" className="bg-secondary text-secondary-foreground hover:bg-secondary/90" onClick={() => router.replace('/home')}>
                                    <Home className="mr-2 h-5 w-5" /> Go Home
                                </Button>
                            </div>

                            <Button variant="outline" className="w-full" onClick={handleViewAnswers} disabled={showAnswers}>
                               {showAnswers ? "Answers Displayed Below" : "View Correct Answers (Ad)"}
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <AnalysisCard
                    questions={questions}
                    userAnswers={userAnswers}
                    timePerQuestion={timePerQuestion}
                    usedHintIndices={usedHintIndices}
                    slotId={slotId}
                />

                {isPerfectScore && <Certificate format={format} userName={user?.displayName || "CricBlitz User"} date={today} slotTimings={slotTimings} />}
                
                {showAnswers && <AnswerReview questions={questions} userAnswers={userAnswers} />}
            </div>

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
        <Suspense fallback={<CricketLoading message="Calculating your score..." />}>
            <ResultsComponent />
        </Suspense>
    )
}
