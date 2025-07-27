
"use client";

import { useEffect, useState, Suspense, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthProvider";
import { getQuizSlotId } from "@/lib/utils";
import type { QuizQuestion } from '@/ai/schemas';
import type { QuizAttempt } from '@/lib/mockData';
import { useSettings } from "@/hooks/use-settings.tsx";

import CricketLoading from "@/components/CricketLoading";
import InterstitialLoader from "@/components/InterstitialLoader";
import { QuestionCard } from "@/components/quiz/QuestionCard";
import { AdDialog } from "@/components/AdDialog";
import { QuizHeader } from "@/components/quiz/QuizHeader";
import { Timer } from "@/components/quiz/Timer";
import { Button } from "@/components/ui/button";
import { Lightbulb, Send, Loader2 } from "lucide-react";
import { interstitialAds, adLibrary } from "@/lib/ads";
import { generateHint } from "@/ai/flows/ai-powered-hints";

function QuizGame() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, profile, addQuizAttempt, handleMalpractice } = useAuth();
    const { settings } = useSettings();

    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswerLocked, setIsAnswerLocked] = useState(false);
    const [userAnswers, setUserAnswers] = useState<string[]>([]);
    const [timePerQuestion, setTimePerQuestion] = useState<number[]>([]);
    
    const [timeLeft, setTimeLeft] = useState(20);
    const [isHintVisible, setIsHintVisible] = useState(false);
    const [usedHintIndices, setUsedHintIndices] = useState<number[]>([]);
    const [isFetchingHint, setIsFetchingHint] = useState(false);

    const [adConfig, setAdConfig] = useState<{ ad: any; onFinished: () => void } | null>(null);
    const [interstitialAd, setInterstitialAd] = useState<any | null>(null);

    const format = useMemo(() => searchParams.get('format') || 'Mixed', [searchParams]);
    const brand = useMemo(() => searchParams.get('brand') || 'Default Brand', [searchParams]);

    const handleVisibilityChange = useCallback(async () => {
        if (document.hidden && currentQuestionIndex < questions.length) {
            const noBallCount = await handleMalpractice();
            const attempt = {
                slotId: getQuizSlotId(),
                brand,
                format,
                score: userAnswers.filter((ans, i) => ans === questions[i].correctAnswer).length,
                totalQuestions: questions.length,
                questions: questions,
                userAnswers: userAnswers,
                timestamp: Date.now(),
                reason: `malpractice_${noBallCount}` as const,
            };
            await addQuizAttempt(attempt);
            const attemptDataString = btoa(JSON.stringify(attempt));
            router.replace(`/quiz/results?attempt=${encodeURIComponent(attemptDataString)}`);
        }
    }, [currentQuestionIndex, questions, userAnswers, format, brand, addQuizAttempt, handleMalpractice, router]);

    useEffect(() => {
        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => {
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [handleVisibilityChange]);
    
    useEffect(() => {
        if (!user) return; // Wait until user is available

        const fetchQuiz = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch('/api/quiz', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ format, userId: user.uid }),
                });

                const data = await response.json();

                if (!response.ok || data.error || !data.questions || data.questions.length < 5) {
                    throw new Error(data.error || 'Failed to fetch a valid quiz.');
                }
                setQuestions(data.questions);

            } catch (err: any) {
                console.error("Quiz loading failed:", err);
                setError(err.message || "Could not load the quiz. Please try again.");
            } finally {
                setLoading(false);
            }
        };
        fetchQuiz();
    }, [format, user]);

    const finishQuiz = useCallback(async () => {
        const finalAnswers = [...userAnswers];
        if (selectedOption) {
            finalAnswers[currentQuestionIndex] = selectedOption;
        }
        
        const finalTimePerQuestion = [...timePerQuestion];
        finalTimePerQuestion[currentQuestionIndex] = 20 - timeLeft;

        const score = finalAnswers.reduce((acc, ans, i) => (ans === questions[i].correctAnswer ? acc + 1 : acc), 0);

        const attempt: QuizAttempt = {
            slotId: getQuizSlotId(),
            brand,
            format,
            score,
            totalQuestions: questions.length,
            questions: questions,
            userAnswers: finalAnswers,
            timePerQuestion: finalTimePerQuestion,
            usedHintIndices,
            timestamp: Date.now(),
        };
        
        await addQuizAttempt(attempt);
        const attemptDataString = btoa(JSON.stringify(attempt));
        router.replace(`/quiz/results?attempt=${encodeURIComponent(attemptDataString)}`);

    }, [userAnswers, selectedOption, currentQuestionIndex, timePerQuestion, timeLeft, questions, brand, format, usedHintIndices, addQuizAttempt, router]);

    const handleAnswerSelect = useCallback((option: string) => {
        if (isAnswerLocked) return;

        setSelectedOption(option);
        setIsAnswerLocked(true);
        setTimePerQuestion(prev => {
            const newTimes = [...prev];
            newTimes[currentQuestionIndex] = 20 - timeLeft;
            return newTimes;
        });

        setTimeout(() => {
            setUserAnswers(prev => {
                const newAnswers = [...prev];
                newAnswers[currentQuestionIndex] = option;
                return newAnswers;
            });

            if (currentQuestionIndex < questions.length - 1) {
                const adToShow = interstitialAds[currentQuestionIndex];
                if (adToShow) {
                    setInterstitialAd(adToShow);
                } else {
                    goToNextQuestion();
                }
            } else {
                finishQuiz();
            }
        }, 1500);
    }, [isAnswerLocked, currentQuestionIndex, timeLeft, questions.length, finishQuiz]);

    useEffect(() => {
        if (loading || isAnswerLocked || isFetchingHint || error) return;
        if (timeLeft > 0) {
            const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
            return () => clearTimeout(timerId);
        } else {
            handleAnswerSelect(selectedOption || 'Not Answered');
        }
    }, [timeLeft, loading, isAnswerLocked, selectedOption, isFetchingHint, error, handleAnswerSelect]);

    const goToNextQuestion = () => {
        setIsAnswerLocked(false);
        setSelectedOption(null);
        setCurrentQuestionIndex(prev => prev + 1);
        setTimeLeft(20);
        setIsHintVisible(false);
        setInterstitialAd(null);
    };

    const handleHint = async () => {
        if (!questions[currentQuestionIndex] || isHintVisible || isFetchingHint) return;

        const ad = adLibrary.hintAds[currentQuestionIndex % adLibrary.hintAds.length];
        
        const onAdFinished = async () => {
            setAdConfig(null);
            setIsFetchingHint(true);
            try {
                const hintResult = await generateHint({ 
                    question: questions[currentQuestionIndex].question,
                    format: format
                });
                
                if (hintResult.hint) {
                    const newQuestions = [...questions];
                    newQuestions[currentQuestionIndex].hint = hintResult.hint;
                    setQuestions(newQuestions);
                    setIsHintVisible(true);
                    setUsedHintIndices(prev => [...prev, currentQuestionIndex]);
                } else {
                    toast.error("Could not get a hint at this time.");
                }
            } catch (error) {
                toast.error("Failed to generate hint.");
            } finally {
                setIsFetchingHint(false);
            }
        };
        
        setAdConfig({ ad, onFinished: onAdFinished });
    };

    if (loading) return <CricketLoading message="Fetching fresh questions..." format={format} />;
    if (error) return <CricketLoading state="error" errorMessage={error}><Button onClick={() => router.push('/home')}>Go Home</Button></CricketLoading>;
    if (!questions.length) return <CricketLoading state="error" errorMessage="No questions found for this format." />;

    const currentQuestion = questions[currentQuestionIndex];

    return (
        <div className="flex flex-col items-center min-h-screen bg-background text-foreground p-4">
            <QuizHeader format={format} current={currentQuestionIndex} total={questions.length} />
            
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentQuestionIndex}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ duration: 0.3 }}
                    className="w-full max-w-2xl"
                >
                    <QuestionCard
                        question={currentQuestion}
                        options={currentQuestion.options}
                        selectedOption={selectedOption}
                        handleAnswerSelect={handleAnswerSelect}
                        isAnswerLocked={isAnswerLocked}
                        correctAnswer={currentQuestion.correctAnswer}
                        isHintVisible={isHintVisible}
                        currentQuestionIndex={currentQuestionIndex}
                    />
                </motion.div>
            </AnimatePresence>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between w-full max-w-2xl gap-4">
                <Button variant="outline" onClick={handleHint} disabled={isHintVisible || isFetchingHint}>
                    {isFetchingHint ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...
                        </>
                    ) : (
                        <>
                            <Lightbulb className="mr-2 h-4 w-4" /> Get a Hint (Ad)
                        </>
                    )}
                </Button>
                
                <Timer timeLeft={timeLeft} />

                <Button
                    onClick={() => handleAnswerSelect(selectedOption || "Not Answered")}
                    disabled={isAnswerLocked || !selectedOption}
                >
                    <Send className="mr-2 h-4 w-4" />
                    {isAnswerLocked ? 'Confirmed' : 'Submit'}
                </Button>
            </div>
            
            {adConfig && <AdDialog open={!!adConfig} onAdFinished={adConfig.onFinished} {...adConfig.ad} />}

            {interstitialAd && interstitialAd.type === 'static' && (
                <InterstitialLoader logoUrl={interstitialAd.logoUrl} logoHint={interstitialAd.logoHint} duration={interstitialAd.durationMs} onComplete={goToNextQuestion} />
            )}
            
            {interstitialAd && interstitialAd.type === 'video' && (
                <AdDialog 
                    open={true} 
                    onAdFinished={goToNextQuestion} 
                    adType="video"
                    adUrl={interstitialAd.videoUrl} 
                    adTitle={interstitialAd.videoTitle}
                    duration={interstitialAd.durationSec}
                    skippableAfter={interstitialAd.skippableAfterSec}
                />
            )}
        </div>
    );
}

export default function QuizPage() {
    return (
        <Suspense fallback={<CricketLoading />}>
            <QuizGame />
        </Suspense>
    )
}
