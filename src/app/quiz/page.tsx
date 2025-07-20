
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
import { Lightbulb, ChevronsRight } from 'lucide-react';
import type { QuizAttempt } from '@/lib/mockData';
import InterstitialLoader from '@/components/InterstitialLoader';
import withAuth from '@/components/auth/withAuth';

function QuizComponent() {
  const { user, addQuizAttempt, setLastAttempt } = useAuth();
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
    // Pre-fetch quiz, then show loading for 1s for fact
    fetchQuiz();
    const timer = setTimeout(() => {
      // The quizState change will be triggered by fetchQuiz completing
    }, 1000); 
    
    return () => clearTimeout(timer);
  }, [format, router, toast]);

  const submitQuiz = useCallback((currentAnswers: (string | null)[], reason?: 'malpractice') => {
    if (!user || !questions || !addQuizAttempt || !setLastAttempt) return;
    
    setQuizState('submitting');
    
    const finalUserAnswers = currentAnswers.map(ans => ans === null ? "Not Answered" : ans);
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
        reason,
    };

    setLastAttempt(attemptData);
    
    // Pass data via URL to make results page load instantly
    const attemptDataString = Buffer.from(JSON.stringify(attemptData)).toString('base64');
    router.replace(`/quiz/results?attempt=${encodeURIComponent(attemptDataString)}`);

    addQuizAttempt(attemptData).catch(error => {
        console.error("Error submitting quiz results to DB:", error);
        toast({ title: 'Sync Error', description: 'Could not save your quiz results to your history.', variant: 'destructive' });
    });
  }, [user, questions, brand, format, timePerQuestion, usedHintIndices, router, toast, addQuizAttempt, setLastAttempt]);

  const handleFinalAnswerAndSubmit = useCallback((option: string) => {
    if (!questions) return;
    
    const timeTaken = (Date.now() - questionStartTime) / 1000;
    const finalTimePerQuestion = [...timePerQuestion, timeTaken];
    setTimePerQuestion(finalTimePerQuestion);

    const finalAnswers = [...userAnswers];
    finalAnswers[currentQuestionIndex] = option;
    setUserAnswers(finalAnswers);

    submitQuiz(finalAnswers);

  }, [questionStartTime, timePerQuestion, userAnswers, currentQuestionIndex, questions, submitQuiz]);


  const goToNextQuestion = useCallback(() => {
    if (!questions) return;
    
    setSelectedOption(null);
    setIsHintVisible(false);
    setCurrentQuestionIndex(prev => prev + 1);
    setTimeLeft(20);
    setQuestionStartTime(Date.now());

  }, [questions]);

  const handleNextWithAdCheck = useCallback(() => {
    const adToShow = interstitialAds[currentQuestionIndex];
    if (adToShow?.type === 'video' && adToShow.videoUrl) {
      setQuizState('ad');
      setAdConfig({
        adType: 'video',
        adUrl: adToShow.videoUrl,
        adTitle: adToShow.videoTitle || 'Advertisement',
        duration: adToShow.durationSec || 15,
        skippableAfter: adToShow.skippableAfterSec || 10,
        onFinished: () => {
          setAdConfig(null);
          setQuizState('playing');
          goToNextQuestion();
        },
      });
    } else if (adToShow?.type === 'static' && adToShow.logoUrl) {
      setQuizState('ad');
    } else {
      goToNextQuestion();
    }
  }, [currentQuestionIndex, goToNextQuestion]);


  const handleAnswerSelect = useCallback((option: string) => {
    if (selectedOption || !questions) return;
    
    setSelectedOption(option);
    
    const timeTaken = (Date.now() - questionStartTime) / 1000;
    setTimePerQuestion(prev => [...prev, timeTaken]);
    
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = option;
    setUserAnswers(newAnswers);

    // Short delay for visual feedback before moving on
    setTimeout(() => {
        if (currentQuestionIndex === questions.length - 1) {
            submitQuiz(newAnswers);
        } else {
            handleNextWithAdCheck();
        }
    }, 300);
  }, [selectedOption, questionStartTime, userAnswers, currentQuestionIndex, questions, handleNextWithAdCheck, submitQuiz]);
  
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
        adType: 'video',
        adUrl: adForHint.url,
        adTitle: adForHint.title,
        duration: adForHint.duration,
        skippableAfter: adForHint.skippableAfter,
        onFinished: () => {
            setIsHintVisible(true);
            setUsedHintIndices(prev => [...prev, currentQuestionIndex]);
            setAdConfig(null);
        }
    });
  };

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && quizState === 'playing') {
        submitQuiz(userAnswers, 'malpractice');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [quizState, submitQuiz, userAnswers]);

  if (quizState === 'loading' || !questions) {
    return <CricketLoading message="Warming up the bowlers..." format={format} />;
  }

  if (quizState === 'submitting') {
      return <CricketLoading message="The umpire is checking... calculating your score!" format={format} />;
  }
  
  if (quizState === 'ad' && !adConfig) {
    const adConfig = interstitialAds[currentQuestionIndex];
    if (adConfig && adConfig.type === 'static' && adConfig.logoUrl) {
      return <InterstitialLoader logoUrl={adConfig.logoUrl} logoHint={adConfig.logoHint!} duration={adConfig.durationMs || 2000} onComplete={handleAdComplete} />;
    }
    goToNextQuestion();
    return null;
  }

  const currentQuestion = questions[currentQuestionIndex];
  
  if (!currentQuestion) {
    return <CricketLoading state="error" errorMessage="There was a problem with the next question." />;
  }

  return (
    <>
      <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 overflow-hidden">
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

            <div 
              className="mt-6 flex justify-between items-center"
            >
                <Button variant="outline" onClick={handleHintRequest} disabled={isHintVisible}>
                    <Lightbulb className="mr-2" /> Get Hint (Ad)
                </Button>
                <Button onClick={() => handleAnswerSelect(selectedOption || "Not Answered")} disabled={!selectedOption}>
                    {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next'} 
                    <ChevronsRight className="ml-2" />
                </Button>
            </div>
        </div>
      </main>

      {adConfig && adConfig.adType === 'video' && (
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

const AuthProtectedQuiz = withAuth(QuizComponent);

export default function QuizPage() {
    return (
      <Suspense fallback={<CricketLoading message="Setting the field..." />}>
          <AuthProtectedQuiz />
      </Suspense>
    )
}
