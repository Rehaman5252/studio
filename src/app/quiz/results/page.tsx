
'use client';

import React, { Suspense, useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useQuizStatus } from '@/context/QuizStatusProvider';
import { getQuizSlotId } from '@/lib/utils';
import type { QuizQuestion } from '@/ai/schemas';
import type { Ad } from '@/lib/ads';
import { adLibrary } from '@/lib/ads';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AdDialog } from '@/components/AdDialog';
import { Trophy, Home, Loader2, CheckCircle2, XCircle, Star, Info, MessageCircleQuestion, Sparkles, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { generateQuizAnalysis } from '@/ai/flows/generate-quiz-analysis-flow';
import ReactMarkdown from 'react-markdown';

const Certificate = ({ format, userName, date, slotTimings }: { format: string; userName: string; date: string; slotTimings: string }) => {
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

const AnalysisCard = ({ questions, userAnswers, timePerQuestion, usedHintIndices }: { questions: QuizQuestion[]; userAnswers: string[], timePerQuestion?: number[], usedHintIndices?: number[] }) => {
    const [analysis, setAnalysis] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleFetchAnalysis = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const result = await generateQuizAnalysis({ questions, userAnswers, timePerQuestion, usedHintIndices });
            setAnalysis(result.analysis);
        } catch (err) {
            console.error(err);
            setError('The AI could not generate an analysis for this quiz. Please try again.');
        } finally {
            setIsLoading(false);
        }
    }, [questions, userAnswers, timePerQuestion, usedHintIndices]);
    
    if (analysis) {
        return (
            <Card className="w-full max-w-md text-left bg-white/10 border-0 mt-4 mb-4">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="text-accent" /> AI Performance Analysis
                    </CardTitle>
                </CardHeader>
                <CardContent>
                     <div className="prose prose-sm dark:prose-invert max-w-none text-white/90 [&_h2]:font-bold [&_h2]:text-lg [&_h2]:mt-4 [&_h3]:font-semibold [&_h3]:text-md [&_h3]:mt-3 [&_ul]:list-disc [&_ul]:pl-5 [&_p]:mt-2">
                        <ReactMarkdown>{analysis}</ReactMarkdown>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="w-full max-w-md text-center bg-white/10 border-0 mt-4 mb-4">
            <CardContent className="p-6">
                <Sparkles className="h-10 w-10 text-accent mx-auto mb-3" />
                <h3 className="text-lg font-bold">Want to improve?</h3>
                <p className="text-sm text-white/80 mb-4">Get a personalized analysis of your performance from our AI coach.</p>
                {isLoading ? (
                    <Button disabled className="w-full">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating Report...
                    </Button>
                ) : (
                    <Button onClick={handleFetchAnalysis} className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                        Generate Free Analysis
                    </Button>
                )}
                {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
            </CardContent>
        </Card>
    );
};


function ResultsComponent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const { setLastAttemptInSlot } = useQuizStatus();
    const [showAnswers, setShowAnswers] = useState(false);
    const [adConfig, setAdConfig] = useState<{ ad: Ad; onFinished: () => void; children?: React.ReactNode; } | null>(null);

    const { questions, userAnswers, brand, format, timePerQuestion, usedHintIndices } = useMemo(() => {
        const dataParam = searchParams.get('data');

        if (!dataParam) return { questions: [] as QuizQuestion[], userAnswers: [], brand: '', format: '', timePerQuestion: [], usedHintIndices: [] };

        try {
            const parsedData = JSON.parse(decodeURIComponent(dataParam));
            return {
                questions: parsedData.questions || [],
                userAnswers: parsedData.userAnswers || [],
                brand: parsedData.brand || 'Indcric',
                format: parsedData.format || 'Cricket',
                timePerQuestion: parsedData.timePerQuestion || [],
                usedHintIndices: parsedData.usedHintIndices || [],
            };
        } catch (error) {
            console.error("Failed to parse results data:", error);
            return { questions: [] as QuizQuestion[], userAnswers: [], brand: '', format: '', timePerQuestion: [], usedHintIndices: [] };
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

    // Save the attempt to global state once results are calculated
    useEffect(() => {
        if (questions.length > 0) {
            const attempt = {
                slotId: getQuizSlotId(),
                score,
                totalQuestions: questions.length,
                format,
                brand,
            };
            setLastAttemptInSlot(attempt);
        }
    }, [score, questions, format, brand, setLastAttemptInSlot]);


    const slotTimings = useMemo(() => {
        const quizSlotId = getQuizSlotId();
        const slotStartTime = new Date(parseInt(quizSlotId, 10));
        const slotEndTime = new Date(slotStartTime.getTime() + 10 * 60 * 1000);

        const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

        return `${formatTime(slotStartTime)} - ${formatTime(slotEndTime)}`;
    }, []);

    const handleViewAnswers = () => {
        if (showAnswers) return;
        setAdConfig({
            ad: adLibrary.resultsAd,
            onFinished: () => {
                setShowAnswers(true);
                setAdConfig(null);
            },
            children: <p className="font-bold text-lg mt-4">Thank you for your patience!</p>
        });
    };

    if (!questions || questions.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-primary to-green-400 text-white p-4">
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
                    <CardContent className="space-y-4">
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
                        
                        <div className="grid grid-cols-2 gap-3">
                            <Button
                                size="lg"
                                className="bg-background/80 text-foreground hover:bg-white/90"
                                onClick={() => router.replace('/home')}
                            >
                                <Home className="mr-2 h-5 w-5" />
                                Home
                            </Button>
                            <Button
                                size="lg"
                                className="bg-accent hover:bg-accent/90 text-accent-foreground"
                                onClick={() => router.replace('/home')}
                            >
                                <RefreshCw className="mr-2 h-5 w-5" />
                                Play Again
                            </Button>
                        </div>

                        <Button
                            variant="secondary"
                            className="w-full"
                            onClick={handleViewAnswers}
                            disabled={showAnswers}
                        >
                           {showAnswers ? "Answers Displayed Below" : "View Correct Answers (Ad)"}
                        </Button>
                    </CardContent>
                </Card>

                {showAnswers && (
                    <Card className="w-full max-w-md text-left bg-white/10 border-0 mt-4 mb-4">
                        <CardHeader><CardTitle>Answer Review</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {questions.map((q, i) => (
                                <div key={i} className="text-sm p-3 rounded-lg bg-black/20">
                                    <p className="font-bold mb-2 flex items-start gap-2"><MessageCircleQuestion className="h-5 w-5 mt-0.5 shrink-0"/> {i+1}. {q.questionText}</p>
                                    <p className={cn("flex items-center", userAnswers[i] === q.correctAnswer ? "text-green-300" : "text-red-300")}>
                                      {userAnswers[i] === q.correctAnswer ? <CheckCircle2 className="mr-2 shrink-0"/> : <XCircle className="mr-2 shrink-0"/>}
                                      Your answer: {userAnswers[i] || 'Not answered'}
                                    </p>
                                    {userAnswers[i] !== q.correctAnswer && <p className="text-green-300 flex items-center"><CheckCircle2 className="mr-2 shrink-0"/> Correct: {q.correctAnswer}</p>}
                                    <div className="mt-2 pt-2 border-t border-white/20 text-white/80">
                                        <p className="font-semibold">Explanation:</p>
                                        <p>{q.explanation}</p>
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                )}
                
                <AnalysisCard questions={questions} userAnswers={userAnswers} timePerQuestion={timePerQuestion} usedHintIndices={usedHintIndices} />
                
                {isPerfectScore && <Certificate format={format} userName={user?.displayName || "Indcric User"} date={today} slotTimings={slotTimings} />}
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
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-b from-primary to-green-400 text-white p-4">
                <Loader2 className="h-12 w-12 animate-spin" />
                <p>Loading results...</p>
            </div>
        }>
            <ResultsComponent />
        </Suspense>
    )
}
