
'use client';

import React, { useState, useEffect, Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { generateQuiz } from '@/ai/flows/generate-quiz-flow';
import type { QuizQuestion } from '@/ai/schemas';
import { useToast } from '@/hooks/use-toast';
import { getQuizSlotId } from '@/lib/utils';
import { adLibrary, interstitialAds } from '@/lib/ads';
import { AdDialog } from '@/components/AdDialog';
import { QuestionCard } from '@/components/quiz/QuestionCard';
import { QuizHeader } from '@/components/quiz/QuizHeader';
import { Timer } from '@/components/quiz/Timer';
import CricketLoading from '@/components/CricketLoading';
import { Button } from '@/components/ui/button';
import { Lightbulb, ChevronsRight, Loader2 } from 'lucide-react';
import type { QuizAttempt } from '@/lib/mockData';
import InterstitialLoader from '@/components/InterstitialLoader';

function QuizComponent() {
  const { user, addQuizAttempt, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const brand = searchParams.get('brand') || 'Default Brand';
  const format = searchParams.get('format') || 'Mixed';

  const [questions, setQuestions] = useState<QuizQuestion[] | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<(string | null)[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(20);
  const [questionStartTime, setQuestionStartTime] = useState(0);
  const [timePerQuestion, setTimePerQuestion] = useState<number[]>([]);
  const [isHintVisible, setIsHintVisible] = useState(false);
  const [usedHintIndices, setUsedHintIndices] = useState<number[]>([]);
  const [adConfig, setAdConfig] = useState<any | null>(null);
  const [quizState, setQuizState] = useState<'loading' | 'playing' | 'ad' | 'submitting'>('loading');

  useEffect(() => {
    if (!authLoading && user === null) {
      router.replace('/auth/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchQuiz() {
      try {
        const quizData = await generateQuiz({ format });
        setQuestions(quizData.questions);
        setUserAnswers(new Array(quizData.questions.length).fill(null));
        setQuestionStartTime(Date.now());
        setQuizState('playing');
      } catch (error) {
        console.error("Failed to generate quiz:", error);
        toast({ title: 'Error', description: 'Could not load quiz. Please try again.', variant: 'destructive' });
        router.push('/home');
      }
    }
    if (user) {
      fetchQuiz();
    }
  }, [format, router, toast, user]);

  const submitQuiz = useCallback(async () => {
    if (!user || !questions || !addQuizAttempt) return;
    setQuizState('submitting');
    
    // Ensure all unanswered questions are marked as "Not Answered"
    const finalUserAnswers = userAnswers.map(ans => ans === null ? "Not Answered" : ans);

    const score = questions.reduce((acc, q, index) => (finalUserAnswers[index] === q.correctAnswer ? acc + 1 : acc), 0);
    const slotId = getQuizSlotId();
    
    const attemptData: QuizAttempt = {
        slotId,
        brand,
        format,
        score,
        totalQuestions: questions.length,
        questions,
        userAnswers: finalUserAnswers,
        timestamp: Date.now(),
        timePerQuestion,
        usedHintIndices,
    };

    try {
        // Add to the central state via AuthProvider
        addQuizAttempt(attemptData);
        // Remove the interstitial loader logic before finishing
        // setQuizState('submitting');
        router.replace('/quiz/results');

    } catch (error) {
        console.error("Error submitting quiz results:", error);
        toast({ title: 'Submission Error', description: 'Could not save your quiz results.', variant: 'destructive' });
        setQuizState('playing');
    }
  }, [user, questions, userAnswers, brand, format, timePerQuestion, usedHintIndices, router, toast, addQuizAttempt]);

  const goToNextQuestion = useCallback(() => {
    if (!questions) return;
    setSelectedOption(null);
    setIsHintVisible(false);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setTimeLeft(20);
      setQuestionStartTime(Date.now());
      setQuizState('playing');
    } else {
      submitQuiz();
    }
  }, [questions, currentQuestionIndex, submitQuiz]);

  const handleNextQuestion = useCallback(() => {
    const adToShow = interstitialAds[currentQuestionIndex];
    if (adToShow) {
        if (adToShow.type === 'video') {
             setAdConfig({
                ...adLibrary.midQuizAd,
                onFinished: () => {
                    setAdConfig(null);
                    goToNextQuestion();
                },
             });
        } else {
            setQuizState('ad');
        }
    } else {
        goToNextQuestion();
    }
  }, [currentQuestionIndex, goToNextQuestion]);

  const handleAnswerSelect = useCallback((option: string) => {
    if (selectedOption || !questions) return;
    
    setSelectedOption(option);
    
    const timeTaken = (Date.now() - questionStartTime) / 1000;
    setTimePerQuestion(prev => [...prev, timeTaken]);
    
    setUserAnswers(prev => {
        const newAnswers = [...prev];
        newAnswers[currentQuestionIndex] = option;
        return newAnswers;
    });

    setTimeout(() => {
      handleNextQuestion();
    }, 1000);
  }, [selectedOption, questionStartTime, currentQuestionIndex, handleNextQuestion, questions]);
  
  const handleAdComplete = useCallback(() => {
      setQuizState('playing');
      goToNextQuestion();
  }, [goToNextQuestion]);


  useEffect(() => {
    if (quizState !== 'playing' || !questions) return;
    
    if (timeLeft === 0) {
      handleAnswerSelect("Not Answered");
      return;
    }

    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, quizState, questions, handleAnswerSelect]);

  const handleHintRequest = () => {
    if (!questions || isHintVisible) return;
    const adForHint = adLibrary.hintAds[currentQuestionIndex] || adLibrary.hintAds[0];
    setAdConfig({
        ...adForHint,
        onFinished: () => {
            setIsHintVisible(true);
            setUsedHintIndices(prev => [...prev, currentQuestionIndex]);
            setAdConfig(null);
        }
    });
  };

  if (authLoading || quizState === 'loading') {
    return <CricketLoading message="Warming up the bowlers..." format={format} />;
  }

  if (quizState === 'submitting') {
      return <CricketLoading message="The umpire is checking... calculating your score!" format={format} />;
  }
  
  if (quizState === 'ad') {
    const adConfig = interstitialAds[currentQuestionIndex];
    if (adConfig && adConfig.type === 'static' && adConfig.logoUrl) {
      return <InterstitialLoader logoUrl={adConfig.logoUrl} logoHint={adConfig.logoHint} duration={adConfig.duration} onComplete={handleAdComplete} />;
    }
    // If it's a video ad, it's handled by the AdDialog, so we just proceed.
    goToNextQuestion();
    return null;
  }

  if (!questions) {
    return <CricketLoading state="error" errorMessage="Could not load the quiz questions." />;
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <>
      <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <div className="w-full max-w-2xl mx-auto">
            <QuizHeader format={format} current={currentQuestionIndex} total={questions.length} />
            
            <div className="flex justify-center my-6">
                <Timer timeLeft={timeLeft} />
            </div>

            <QuestionCard
                question={currentQuestion}
                isHintVisible={isHintVisible}
                options={currentQuestion.options}
                selectedOption={selectedOption}
                handleAnswerSelect={handleAnswerSelect}
            />

            <div className="mt-6 flex justify-between items-center">
                <Button variant="outline" onClick={handleHintRequest} disabled={isHintVisible}>
                    <Lightbulb className="mr-2" /> Get Hint (Ad)
                </Button>
                <Button onClick={handleNextQuestion} disabled={!selectedOption}>
                    {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next'} 
                    <ChevronsRight className="ml-2" />
                </Button>
            </div>
        </div>
      </main>

      {adConfig && (
          <AdDialog
              open={!!adConfig}
              onAdFinished={adConfig.onFinished}
              duration={adConfig.duration}
              skippableAfter={adConfig.skippableAfter}
              adTitle={adConfig.adTitle}
              adType={adConfig.adType}
              adUrl={adConfig.adUrl}
              adHint={adConfig.adHint}
          />
      )}
    </>
  );
}


export default function QuizPage() {
    return (
      <Suspense fallback={<CricketLoading message="Setting the field..." />}>
          <QuizComponent />
      </Suspense>
    )
}
