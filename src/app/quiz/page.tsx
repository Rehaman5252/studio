
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
  const { user, loading, addQuizAttempt, handleMalpractice, profile, lastAttemptInSlot } = useAuth();
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
  const [isAnswerLocked, setIsAnswerLocked] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
        router.replace('/auth/login?from=/quiz');
    }
  }, [user, loading, router]);


  useEffect(() => {
    if (!user || !profile) return; 

    // **Strict Daily Malpractice Lockout**
    const today = new Date().setHours(0, 0, 0, 0);
    const lastNoBallDay = profile.lastNoBallTimestamp ? new Date(profile.lastNoBallTimestamp.seconds * 1000).setHours(0, 0, 0, 0) : null;
    if (profile.noBallCount >= 3 && lastNoBallDay === today) {
        toast({
            title: "Out for the Day!",
            description: "You have received 3 No-Balls and cannot play until tomorrow.",
            variant: "destructive",
            duration: 5000,
        });
        router.replace('/home');
        return;
    }
    
    // **Strict Slot Enforcement**
    if (lastAttemptInSlot) {
        toast({
            title: "Slot Already Played",
            description: `Showing your results for the ${lastAttemptInSlot.format} quiz.`,
        });
        const attemptDataString = Buffer.from(JSON.stringify(lastAttemptInSlot)).toString('base64');
        const reviewUrl = `/quiz/results?review=true&attempt=${encodeURIComponent(attemptDataString)}`;
        router.replace(reviewUrl);
        return;
    }

    async function fetchQuiz() {
      try {
        const quizData = await generateQuiz({ format });
        setQuestions(quizData.questions);
        setUserAnswers(new Array(quizData.questions.length).fill(null));
        setQuestionStartTime(Date.now());
        setTimeLeft(20); // Reset timer for the first question
        setQuizState('playing'); // Move to playing state immediately
      } catch (error) {
        console.error("Failed to generate quiz:", error);
        toast({ title: 'Error', description: 'Could not load quiz. Please try again.', variant: 'destructive' });
        router.push('/home');
      }
    }
    fetchQuiz();
  }, [format, router, toast, user, lastAttemptInSlot, profile]);

  const submitQuiz = useCallback(async (currentAnswers: (string | null)[], reason?: 'malpractice' | 'time_up') => {
    if (!user || !questions || !addQuizAttempt) return;
    
    setQuizState('submitting');
    
    let malpracticeCount = profile?.noBallCount || 0;
    if (reason === 'malpractice') {
      malpracticeCount = await handleMalpractice();
    }
    
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
        reason: reason === 'malpractice' ? `malpractice_${malpracticeCount}` : undefined,
    };

    // Save attempt to the database
    await addQuizAttempt(attemptData);
    
    // Navigate to results page with the new attempt data
    const attemptDataString = Buffer.from(JSON.stringify(attemptData)).toString('base64');
    router.replace(`/quiz/results?attempt=${encodeURIComponent(attemptDataString)}`);

  }, [user, questions, brand, format, timePerQuestion, usedHintIndices, router, addQuizAttempt, handleMalpractice, profile?.noBallCount]);

  const goToNextQuestion = useCallback(() => {
    if (!questions) return;
    setSelectedOption(null);
    setIsHintVisible(false);
    setCurrentQuestionIndex(prev => prev + 1);
    setTimeLeft(20);
    setQuestionStartTime(Date.now());
    setIsAnswerLocked(false); // Release the lock for the new question
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
        onFinished: () => { setAdConfig(null); setQuizState('playing'); goToNextQuestion(); },
      });
    } else if (adToShow?.type === 'static' && adToShow.logoUrl) {
      setQuizState('ad');
    } else {
      goToNextQuestion();
    }
  }, [currentQuestionIndex, goToNextQuestion]);

  const handleAnswerSelect = useCallback((option: string) => {
    if (isAnswerLocked || !questions) return; // Check lock here
    
    setIsAnswerLocked(true); // Set lock immediately
    setSelectedOption(option);
    const timeTaken = (Date.now() - questionStartTime) / 1000;
    setTimePerQuestion(prev => [...prev, timeTaken]);
    
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestionIndex] = option;
    setUserAnswers(newAnswers);

    setTimeout(() => {
        if (currentQuestionIndex === questions.length - 1) {
            submitQuiz(newAnswers);
        } else {
            handleNextWithAdCheck();
        }
    }, 300);
  }, [isAnswerLocked, questionStartTime, userAnswers, currentQuestionIndex, questions, handleNextWithAdCheck, submitQuiz]);
  
  const handleAdComplete = useCallback(() => {
      setQuizState('playing');
      goToNextQuestion();
  }, [goToNextQuestion]);

  useEffect(() => {
    if (quizState !== 'playing' || !questions || isAnswerLocked) return;
    if (timeLeft <= 0) { 
        handleAnswerSelect("Not Answered"); 
        return; 
    }
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, quizState, questions, handleAnswerSelect, isAnswerLocked]);

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
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [quizState, submitQuiz, userAnswers]);

  if (loading || !user || lastAttemptInSlot) {
    return <CricketLoading message="Authenticating..." />;
  }

  if (quizState === 'loading' || !questions) return <CricketLoading message="Warming up the bowlers..." format={format} />;
  if (quizState === 'submitting') return <CricketLoading message="The umpire is checking... calculating your score!" format={format} />;
  
  if (quizState === 'ad' && !adConfig) {
    const adConfig = interstitialAds[currentQuestionIndex];
    if (adConfig && adConfig.type === 'static' && adConfig.logoUrl) {
      return <InterstitialLoader logoUrl={adConfig.logoUrl} logoHint={adConfig.logoHint!} duration={adConfig.durationMs || 2000} onComplete={handleAdComplete} />;
    }
    goToNextQuestion(); return null;
  }

  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) return <CricketLoading state="error" errorMessage="There was a problem with the next question." />;

  return (
    <>
      <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 overflow-hidden">
        <div className="w-full max-w-2xl mx-auto">
            <QuizHeader format={format} current={currentQuestionIndex} total={questions.length} />
            <div className="flex justify-center my-6"><Timer timeLeft={timeLeft} /></div>
            <QuestionCard question={currentQuestion} isHintVisible={isHintVisible} options={currentQuestion.options} selectedOption={selectedOption} handleAnswerSelect={handleAnswerSelect} />
            <div className="mt-6 flex justify-between items-center">
                <Button variant="outline" onClick={handleHintRequest} disabled={isHintVisible || isAnswerLocked}>
                    <Lightbulb className="mr-2" /> Get Hint (Ad)
                </Button>
                <Button onClick={() => handleAnswerSelect(selectedOption || "Not Answered")} disabled={isAnswerLocked}>
                    {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next'} <ChevronsRight className="ml-2" />
                </Button>
            </div>
        </div>
      </main>
      {adConfig && adConfig.adType === 'video' && <AdDialog open={!!adConfig} onAdFinished={adConfig.onFinished} duration={adConfig.duration} skippableAfter={adConfig.skippableAfter} adTitle={adConfig.adTitle} adType={adConfig.adType} adUrl={adConfig.adUrl} adHint={adConfig.adHint} />}
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
