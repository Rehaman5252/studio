
'use client';

import React, { useState, useEffect, Suspense, useCallback, useRef, memo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { QuizQuestion } from '@/ai/schemas';
import type { Ad } from '@/lib/ads';
import { adLibrary } from '@/lib/ads';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Lightbulb } from 'lucide-react';
import { AdDialog } from '@/components/AdDialog';
import useRequireAuth from '@/hooks/useRequireAuth';
import { useAuth } from '@/context/AuthProvider';
import { cn, getQuizSlotId } from '@/lib/utils';
import { useQuizStatus } from '@/context/QuizStatusProvider';
import CricketLoading from '@/components/CricketLoading';
import { generateQuiz } from '@/ai/flows/generate-quiz-flow';
import InterstitialLoader from '@/components/InterstitialLoader';

const interstitialAds: Record<number, { logo: string; hint: string }> = {
    0: { logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/Tata_logo.svg/1024px-Tata_logo.svg.png', hint: 'Tata logo' },
    1: { logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Dominos_pizza_logo.svg/1200px-Dominos_pizza_logo.svg.png', hint: 'Dominos logo' },
    3: { logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Pepsi_logo_2014.svg/1200px-Pepsi_logo_2014.svg.png', hint: 'Pepsi logo' },
};

const Timer = memo(({ timeLeft }: { timeLeft: number }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  // Ensure strokeDashoffset doesn't go below 0
  const offset = circumference - (timeLeft / 20) * circumference;

  return (
    <div className="relative h-28 w-28">
      <svg className="h-full w-full" viewBox="0 0 100 100">
        <circle
          className="stroke-current text-border"
          strokeWidth="10"
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
        />
        <circle
          className="stroke-current text-primary transition-all duration-1000 linear"
          strokeWidth="10"
          strokeLinecap="round"
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold text-foreground">{timeLeft}</span>
      </div>
    </div>
  );
});
Timer.displayName = 'Timer';

function QuizComponent() {
  useRequireAuth();
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const brand = searchParams.get('brand') || 'Indcric';
  const format = searchParams.get('format') || 'Cricket';

  const { setLastAttemptInSlot } = useQuizStatus();
  
  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(20);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const [usedHintIndices, setUsedHintIndices] = useState<number[]>([]);
  const [timePerQuestion, setTimePerQuestion] = useState<number[]>([]);
  const [isHintVisible, setIsHintVisible] = useState(false);
  const [wasMidQuizAdShown, setWasMidQuizAdShown] = useState(false);
  const [paused, setPaused] = useState(false);

  const [interstitialConfig, setInterstitialConfig] = useState<{ logo: string; hint: string } | null>(null);

  const [adConfig, setAdConfig] = useState<{
    ad: Ad;
    onFinished: () => void;
    children?: React.ReactNode;
  } | null>(null);

  const stateRef = useRef({ userAnswers, timePerQuestion, usedHintIndices, questions, brand, format });
  stateRef.current = { userAnswers, timePerQuestion, usedHintIndices, questions, brand, format };

  useEffect(() => {
    async function fetchQuestions() {
      setIsLoading(true);
      try {
        const generatedQuestions = await generateQuiz({ format, brand });
        setQuestions(generatedQuestions);
      } catch (error) {
        console.error("Failed to generate quiz:", error);
        setQuestions(null); // Explicitly set to null on error
      }
      setIsLoading(false);
    }
    fetchQuestions();
  }, [format, brand]);
  
  const advanceToResults = useCallback(() => {
    router.replace(`/quiz/results`);
  }, [router]);


  useEffect(() => {
    if (!user || !questions) return;
    
    // On mount with questions, save an initial attempt record.
    const initialAttempt = {
        slotId: getQuizSlotId(),
        score: 0,
        totalQuestions: questions.length,
        format,
        brand,
        questions: questions,
        userAnswers: [],
        timePerQuestion: [],
        usedHintIndices: [],
    };
    setLastAttemptInSlot(initialAttempt);

    return () => {
      // On unmount, save the final state of the quiz.
      const { userAnswers, timePerQuestion, usedHintIndices, questions: finalQuestions, brand, format } = stateRef.current;
      
      if (finalQuestions && user) {
        const score = userAnswers.reduce((acc, answer, index) => 
            (finalQuestions[index] && answer === finalQuestions[index].correctAnswer) ? acc + 1 : acc, 0);

        const currentProgress = {
          slotId: getQuizSlotId(),
          score,
          totalQuestions: finalQuestions.length,
          format,
          brand,
          questions: finalQuestions,
          userAnswers,
          timePerQuestion,
          usedHintIndices,
        };
        setLastAttemptInSlot(currentProgress);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, questions]); // Rerun only when user or questions are loaded

  const goToNextQuestion = useCallback(() => {
    setPaused(false);
    setSelectedOption(null);
    setIsHintVisible(false);
    setCurrentQuestionIndex((prev) => prev + 1);
    setTimeLeft(20);
  }, []);

  const proceedToNextQuestionFlow = useCallback(() => {
    if (!questions) return;
    
    // Mid-quiz ad logic
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
    
    // Final question logic
    if (currentQuestionIndex >= questions.length - 1) {
      advanceToResults();
    } else {
      goToNextQuestion();
    }
  }, [currentQuestionIndex, wasMidQuizAdShown, questions, goToNextQuestion, advanceToResults, setAdConfig, setPaused]);


  const onInterstitialComplete = useCallback(() => {
    setInterstitialConfig(null);
    proceedToNextQuestionFlow();
  }, [proceedToNextQuestionFlow]);


  const handleAnswerSelect = useCallback((option: string) => {
    if (selectedOption) return;

    const timeTaken = 20 - timeLeft;
    setTimePerQuestion(prev => [...prev, timeTaken]);
    
    setSelectedOption(option);
    setUserAnswers(prev => [...prev, option]);
    
    setTimeout(() => {
        const interstitial = interstitialAds[currentQuestionIndex];
        if (interstitial) {
            setInterstitialConfig(interstitial);
        } else {
            proceedToNextQuestionFlow();
        }
    }, 300);
  }, [selectedOption, timeLeft, currentQuestionIndex, proceedToNextQuestionFlow]);

  // Timer effect
  useEffect(() => {
    if (paused || selectedOption || adConfig || interstitialConfig || !questions) return;

    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else {
       const timeTaken = 20;
       setTimePerQuestion(prev => [...prev, timeTaken]);
       setUserAnswers(prev => [...prev, '']);
       const interstitial = interstitialAds[currentQuestionIndex];
       if (interstitial) {
            setInterstitialConfig(interstitial);
        } else {
            proceedToNextQuestionFlow();
        }
    }
  }, [timeLeft, paused, selectedOption, adConfig, interstitialConfig, proceedToNextQuestionFlow, currentQuestionIndex, questions]);

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

  if (isLoading) {
    return <CricketLoading message="Getting your quiz ready..." />;
  }

  if (!questions) {
    return (
        <CricketLoading state="error" errorMessage="Could not load quiz questions.">
            <Button onClick={() => router.push('/home')}>Go Home</Button>
      </CricketLoading>
    );
  }
  
  const currentQuestion = questions[currentQuestionIndex];
  const progressValue = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <>
      <div className="flex flex-col h-screen bg-background text-foreground p-4">
        <header className="w-full max-w-2xl mx-auto mb-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold">{format} Quiz</h1>
            <p className="font-semibold">{currentQuestionIndex + 1} / {questions.length}</p>
          </div>
          <Progress value={progressValue} className="h-2 [&>div]:bg-primary" />
        </header>

        <main className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
          <div className="mb-8">
            <Timer timeLeft={timeLeft} />
          </div>

          <Card className="w-full bg-card shadow-lg">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl leading-tight text-foreground">
                {currentQuestion.questionText}
              </CardTitle>
              {isHintVisible && currentQuestion.hint && (
                  <p className="text-sm text-primary pt-2 animate-in fade-in">
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
                    variant="outline"
                    className={cn(
                        'relative w-full h-auto py-3 text-sm whitespace-normal justify-start text-left transition-all duration-300 ease-in-out',
                        !selectedOption && 'hover:bg-primary/10 hover:border-primary',
                        selectedOption && {
                            'opacity-50': !isSelected,
                            'bg-primary text-primary-foreground border-primary': isSelected,
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
          
          <Button onClick={handleUseHint} disabled={usedHintIndices.includes(currentQuestionIndex) || !!selectedOption || !currentQuestion.hint} className="mt-6 bg-primary/20 text-primary-foreground hover:bg-primary/30">
            <Lightbulb className="mr-2" />
            {usedHintIndices.includes(currentQuestionIndex) ? "Hint Used" : "Use Hint"}
          </Button>
        </main>
      </div>

      {interstitialConfig && (
        <InterstitialLoader 
            logoUrl={interstitialConfig.logo} 
            logoHint={interstitialConfig.hint}
            onComplete={onInterstitialComplete} 
        />
      )}

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
    <Suspense fallback={<CricketLoading message="Loading your quiz..." />}>
      <QuizComponent />
    </Suspense>
  )
}
