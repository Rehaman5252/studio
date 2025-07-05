
'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { generateQuiz } from '@/ai/flows/generate-quiz-flow';
import type { QuizQuestion } from '@/ai/schemas';
import type { Ad } from '@/lib/ads';
import { adLibrary } from '@/lib/ads';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Lightbulb, AlertTriangle } from 'lucide-react';
import { AdDialog } from '@/components/AdDialog';
import useRequireAuth from '@/hooks/useRequireAuth';
import { useAuth } from '@/context/AuthProvider';
import { cn } from '@/lib/utils';


const Timer = ({ timeLeft }: { timeLeft: number }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = (timeLeft / 20) * circumference;

  return (
    <div className="relative h-28 w-28">
      <svg className="h-full w-full" viewBox="0 0 100 100">
        <circle
          className="stroke-current text-white/20"
          strokeWidth="10"
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
        />
        <circle
          className="stroke-current text-accent transition-all duration-1000 linear"
          strokeWidth="10"
          strokeLinecap="round"
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - strokeDashoffset}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold text-white">{timeLeft}</span>
      </div>
    </div>
  );
};

function QuizComponent() {
  useRequireAuth();
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const brand = searchParams.get('brand') || 'Indcric';
  const format = searchParams.get('format') || 'Cricket';

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const [usedHintIndices, setUsedHintIndices] = useState<number[]>([]);
  const [timePerQuestion, setTimePerQuestion] = useState<number[]>([]);
  const [isHintVisible, setIsHintVisible] = useState(false);
  const [wasMidQuizAdShown, setWasMidQuizAdShown] = useState(false);
  const [paused, setPaused] = useState(false);

  const [adConfig, setAdConfig] = useState<{
    ad: Ad;
    onFinished: () => void;
    children?: React.ReactNode;
  } | null>(null);
  
  const advanceToResults = useCallback((finalAnswers: string[], finalTimes: number[]) => {
    const dataToPass = {
        questions,
        userAnswers: finalAnswers,
        brand,
        format,
        usedHintIndices,
        timePerQuestion: finalTimes
    };
    router.replace(
      `/quiz/results?data=${encodeURIComponent(JSON.stringify(dataToPass))}`
    );
  }, [questions, brand, format, router, usedHintIndices]);


  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const quizQuestions = await generateQuiz({ format, brand });
        if (!quizQuestions || quizQuestions.length < 5) {
            throw new Error('Failed to generate a complete quiz.');
        }
        setQuestions(quizQuestions);
      } catch (e) {
        setError('Could not fetch quiz questions. Please try again later.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    
    fetchQuestions();
  }, [format, brand]);

  const goToNextQuestion = useCallback(() => {
    setPaused(false);
    setSelectedOption(null);
    setIsHintVisible(false);
    setCurrentQuestionIndex((prev) => prev + 1);
    setTimeLeft(20);
  }, []);

  const proceedToNextStep = useCallback((updatedAnswers: string[], updatedTimes: number[]) => {
    if (currentQuestionIndex === 2 && !wasMidQuizAdShown) {
        setPaused(true);
        setAdConfig({
            ad: adLibrary.midQuizAd,
            onFinished: () => {
                setWasMidQuizAdShown(true);
                setAdConfig(null);
                goToNextQuestion();
            }
        });
        return;
    }
    
    if (currentQuestionIndex >= questions.length - 1) {
      advanceToResults(updatedAnswers, updatedTimes);
    } else {
      goToNextQuestion();
    }
  }, [currentQuestionIndex, wasMidQuizAdShown, questions.length, goToNextQuestion, advanceToResults]);
  
  useEffect(() => {
    if (paused || loading || questions.length === 0 || selectedOption || adConfig) return;

    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else {
       const timeTaken = 20;
       const newTimes = [...timePerQuestion, timeTaken];
       setTimePerQuestion(newTimes);
       const newAnswers = [...userAnswers, ''];
       setUserAnswers(newAnswers);
       proceedToNextStep(newAnswers, newTimes);
    }
  }, [timeLeft, paused, loading, questions.length, selectedOption, userAnswers, proceedToNextStep, adConfig, timePerQuestion]);

  const handleAnswerSelect = useCallback((option: string) => {
    if (selectedOption) return;

    const timeTaken = 20 - timeLeft;
    const newTimes = [...timePerQuestion, timeTaken];
    setTimePerQuestion(newTimes);
    
    setSelectedOption(option);
    const newAnswers = [...userAnswers, option];
    setUserAnswers(newAnswers);
    
    setTimeout(() => {
       proceedToNextStep(newAnswers, newTimes);
    }, 1200);
  }, [selectedOption, userAnswers, timeLeft, timePerQuestion, proceedToNextStep]);

  const handleUseHint = useCallback(() => {
    if (usedHintIndices.includes(currentQuestionIndex) || adConfig) return;
    setPaused(true);
    setAdConfig({
        ad: adLibrary.hintAds[currentQuestionIndex],
        onFinished: () => {
            setIsHintVisible(true);
            setUsedHintIndices(prev => [...prev, currentQuestionIndex]);
            setPaused(false);
            setAdConfig(null);
        },
        children: <p className="font-bold text-lg mt-4">Enjoy your hint!</p>
    });
  }, [adConfig, currentQuestionIndex, usedHintIndices]);
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-primary via-green-800 to-green-900 text-white p-4">
        <Loader2 className="h-12 w-12 animate-spin mb-4" />
        <p className="text-xl font-semibold">Generating your {format} quiz...</p>
        <p className="text-sm opacity-80">This might take a moment.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-primary via-green-800 to-green-900 text-white p-4">
        <Card className="bg-background/70 backdrop-blur-sm border-destructive shadow-lg text-center p-6">
            <CardHeader>
                <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                <CardTitle className="text-xl font-bold text-destructive-foreground">Oops! Something went wrong.</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">{error}</p>
                <Button onClick={() => router.push('/home')} className="mt-6">Go Home</Button>
            </CardContent>
        </Card>
      </div>
    );
  }

  if (questions.length === 0) return null;
  
  const currentQuestion = questions[currentQuestionIndex];
  const progressValue = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <>
      <div className="flex flex-col h-screen bg-gradient-to-br from-primary via-green-800 to-green-900 text-white p-4">
        <header className="w-full max-w-2xl mx-auto mb-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold">{format} Quiz</h1>
            <p className="font-semibold">{currentQuestionIndex + 1} / {questions.length}</p>
          </div>
          <Progress value={progressValue} className="h-2 [&>div]:bg-accent" />
        </header>

        <main className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
          <div className="mb-8">
            <Timer timeLeft={timeLeft} />
          </div>

          <Card className="w-full bg-background/70 backdrop-blur-sm border-white/20 shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl leading-tight text-foreground">
                {currentQuestion.questionText}
              </CardTitle>
              {isHintVisible && currentQuestion.hint && (
                  <p className="text-sm text-accent pt-2 animate-in fade-in">
                      <strong>Hint:</strong> {currentQuestion.hint}
                  </p>
              )}
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedOption === option;

                return (
                    <Button
                    key={index}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={!!selectedOption}
                    className={cn(
                        'relative w-full h-auto py-3 text-sm whitespace-normal justify-start text-left transition-all duration-300 ease-in-out',
                        !selectedOption && 'bg-background/80 hover:bg-primary/20 text-foreground ring-1 ring-border',
                        selectedOption && {
                            'opacity-60': !isSelected,
                            'bg-primary text-primary-foreground ring-2 ring-offset-2 ring-offset-background ring-primary': isSelected,
                        }
                    )}
                    >
                    <span className="font-bold mr-4">{String.fromCharCode(65 + index)}</span>
                    <span>{option}</span>
                    </Button>
                );
              })}
            </CardContent>
          </Card>
          
          <Button onClick={handleUseHint} disabled={usedHintIndices.includes(currentQuestionIndex) || !!selectedOption || !currentQuestion.hint} className="mt-6 bg-accent hover:bg-accent/90 text-accent-foreground">
            <Lightbulb className="mr-2" />
            {usedHintIndices.includes(currentQuestionIndex) ? "Hint Used" : "Use Hint"}
          </Button>
        </main>
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

export default function QuizPage() {
  return (
    <Suspense fallback={
        <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-primary via-green-800 to-green-900 text-white p-4">
            <Loader2 className="h-12 w-12 animate-spin" />
        </div>
    }>
      <QuizComponent />
    </Suspense>
  )
}
