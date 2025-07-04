
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
import { Loader2, Lightbulb } from 'lucide-react';
import { AdDialog } from '@/components/AdDialog';

const getQuizSlotId = () => {
  const now = new Date();
  const minutes = now.getMinutes();
  // Calculate the start of the current 10-minute slot
  const currentSlotStartMinute = Math.floor(minutes / 10) * 10;
  const slotTime = new Date(now);
  slotTime.setMinutes(currentSlotStartMinute, 0, 0);
  return slotTime.getTime().toString();
};

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
  const router = useRouter();
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
  const [isHintVisible, setIsHintVisible] = useState(false);
  const [wasMidQuizAdShown, setWasMidQuizAdShown] = useState(false);
  const [paused, setPaused] = useState(false);

  const [adConfig, setAdConfig] = useState<{
    ad: Ad;
    onFinished: () => void;
    children?: React.ReactNode;
  } | null>(null);
  
  const advanceToResults = useCallback((finalAnswers: string[]) => {
    const dataToPass = { questions, userAnswers: finalAnswers, brand, format };
    router.replace(
      `/quiz/results?data=${encodeURIComponent(JSON.stringify(dataToPass))}`
    );
  }, [questions, brand, format, router]);


  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        const quizSlotId = getQuizSlotId();
        const historyString = localStorage.getItem('indcric-quiz-history');

        if (historyString) {
          const history = JSON.parse(historyString);
          // Check if ANY quiz has been attempted in this slot.
          const savedAttempt = history.find((attempt: any) => attempt.slotId === quizSlotId);
          
          if (savedAttempt) {
            const dataToPass = { questions: savedAttempt.questions, userAnswers: savedAttempt.userAnswers, brand: savedAttempt.brand, format: savedAttempt.format };
            router.replace(
              `/quiz/results?data=${encodeURIComponent(JSON.stringify(dataToPass))}&retake=true`
            );
            return;
          }
        }
        
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format, brand]);

  const goToNextQuestion = useCallback(() => {
    setPaused(false);
    setSelectedOption(null);
    setIsHintVisible(false);
    setCurrentQuestionIndex((prev) => prev + 1);
    setTimeLeft(20);
  }, []);

  const proceedToNextStep = useCallback((updatedAnswers: string[]) => {
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
      advanceToResults(updatedAnswers);
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
       const newAnswers = [...userAnswers, ''];
       setUserAnswers(newAnswers);
       proceedToNextStep(newAnswers);
    }
  }, [timeLeft, paused, loading, questions.length, selectedOption, userAnswers, proceedToNextStep, adConfig]);

  const handleAnswerSelect = useCallback((option: string) => {
    if (selectedOption) return;

    const newAnswers = [...userAnswers, option];
    setUserAnswers(newAnswers);
    setSelectedOption(option);
    
    setTimeout(() => {
       proceedToNextStep(newAnswers);
    }, 500);
  }, [selectedOption, userAnswers, proceedToNextStep]);

  const handleUseHint = () => {
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
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-primary to-green-400 text-white p-4">
        <Loader2 className="h-12 w-12 animate-spin mb-4" />
        <p className="text-xl">Generating your {format} quiz...</p>
        <p>This might take a moment.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-destructive text-destructive-foreground p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Oops! Something went wrong.</h1>
        <p>{error}</p>
        <Button onClick={() => router.push('/home')} className="mt-6">Go Home</Button>
      </div>
    );
  }

  if (questions.length === 0) return null;
  
  const currentQuestion = questions[currentQuestionIndex];
  const progressValue = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <>
      <div className="flex flex-col min-h-screen bg-gradient-to-b from-primary to-green-400 text-white p-4">
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

          <Card className="w-full bg-white/10 border-0">
            <CardHeader>
              <CardTitle className="text-xl md:text-2xl leading-tight">
                {currentQuestion.questionText}
              </CardTitle>
              {isHintVisible && (
                  <p className="text-sm text-yellow-300 pt-2 animate-in fade-in">
                      <strong>Hint:</strong> {currentQuestion.hint}
                  </p>
              )}
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentQuestion.options.map((option, index) => (
                <Button
                  key={index}
                  onClick={() => handleAnswerSelect(option)}
                  disabled={!!selectedOption}
                  className={`
                    w-full h-auto py-4 text-base whitespace-normal justify-start text-left
                    bg-white/20 hover:bg-white/30 text-white
                    ${selectedOption === option ? 'ring-4 ring-accent' : ''}
                    ${selectedOption && selectedOption !== option ? 'opacity-50' : ''}
                  `}
                >
                  <span className="font-bold mr-4">{String.fromCharCode(65 + index)}</span>
                  <span>{option}</span>
                </Button>
              ))}
            </CardContent>
          </Card>
          
          <Button onClick={handleUseHint} disabled={usedHintIndices.includes(currentQuestionIndex) || !!selectedOption} className="mt-6 bg-yellow-500 hover:bg-yellow-600">
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
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-primary to-green-400 text-white p-4">
            <Loader2 className="h-12 w-12 animate-spin" />
        </div>
    }>
      <QuizComponent />
    </Suspense>
  )
}
