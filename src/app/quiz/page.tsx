
'use client';

import React, { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { QuizQuestion } from '@/ai/schemas';
import type { Ad } from '@/lib/ads';
import { adLibrary } from '@/lib/ads';
import { Button } from '@/components/ui/button';
import { Lightbulb, Loader2 } from 'lucide-react';
import { AdDialog } from '@/components/AdDialog';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/context/AuthProvider';
import { getQuizSlotId } from '@/lib/utils';
import { useQuizStatus, type SlotAttempt } from '@/context/QuizStatusProvider';
import { generateQuiz } from '@/ai/flows/generate-quiz-flow';
import InterstitialLoader from '@/components/InterstitialLoader';
import { db } from '@/lib/firebase';
import { doc, setDoc, collection, writeBatch, increment } from 'firebase/firestore';
import { QuizHeader } from '@/components/quiz/QuizHeader';
import { Timer } from '@/components/quiz/Timer';
import { QuestionCard } from '@/components/quiz/QuestionCard';
import { Skeleton } from '@/components/ui/skeleton';

const QuizSkeleton = () => (
  <div className="flex flex-col h-screen bg-background text-foreground p-4">
    <header className="w-full max-w-2xl mx-auto mb-4 space-y-2">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-6 w-12" />
      </div>
      <Skeleton className="h-2 w-full" />
    </header>
    <main className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto w-full">
      <Skeleton className="h-28 w-28 rounded-full mb-8" />
      <div className="w-full space-y-4">
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
        <Skeleton className="h-10 w-32 mx-auto mt-6" />
      </div>
    </main>
  </div>
);

const interstitialAds: Record<number, { logo: string; hint: string }> = {
    0: { logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/BMW.svg/600px-BMW.svg.png', hint: 'BMW logo' },
    1: { logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Dominos_pizza_logo.svg/1200px-Dominos_pizza_logo.svg.png', hint: 'Dominos logo' },
    3: { logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Pepsi_logo_2014.svg/1200px-Pepsi_logo_2014.svg.png', hint: 'Pepsi logo' },
};

function QuizComponent() {
  const router = useRouter();
  const { user, userData } = useAuth();
  const searchParams = useSearchParams();
  const brand = searchParams.get('brand') || 'indcric';
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
  const [isTerminated, setIsTerminated] = useState(false);

  const [interstitialConfig, setInterstitialConfig] = useState<{ logo: string; hint: string } | null>(null);
  const hasFetchedQuestions = useRef(false);
  const quizCompleted = useRef(false);

  const [adConfig, setAdConfig] = useState<{
    ad: Ad;
    onFinished: () => void;
    children?: React.ReactNode;
  } | null>(null);

  const saveAttemptInBackground = useCallback((attempt: SlotAttempt) => {
    if (db && user && userData) {
        const batch = writeBatch(db);
        const totalTime = attempt.timePerQuestion?.reduce((a, b) => a + b, 0) || 0;

        const attemptDocRef = doc(collection(db, 'users', user.uid, 'quizHistory'));
        batch.set(attemptDocRef, { ...attempt, uid: user.uid, name: userData.name || 'Anonymous' });
        
        const leaderboardEntryRef = doc(db, 'liveLeaderboard', attempt.slotId, 'entries', user.uid);
        batch.set(leaderboardEntryRef, {
            name: userData.name || 'Anonymous',
            score: attempt.score,
            time: totalTime,
            avatar: userData.photoURL || null,
            disqualified: attempt.reason === 'malpractice'
        });
        
        const userDocRef = doc(db, 'users', user.uid);
        batch.update(userDocRef, { quizzesPlayed: increment(1) });

        batch.commit().catch(error => {
            console.error("Error saving quiz data in batch: ", error);
        });
    }
  }, [user, userData]);

  const goToNextQuestion = useCallback(() => {
    setSelectedOption(null);
    setIsHintVisible(false);
    setCurrentQuestionIndex((prev) => prev + 1);
    setTimeLeft(20);
  }, []);
  
  const proceedToNextStep = useCallback((answer: string) => {
    const newAnswers = [...userAnswers, answer];
    const newTimes = [...timePerQuestion, 20 - timeLeft];
    
    setUserAnswers(newAnswers);
    setTimePerQuestion(newTimes);
    
    if (currentQuestionIndex >= questions!.length - 1) {
        if (quizCompleted.current) return;
        quizCompleted.current = true;
        
        const score = newAnswers.reduce((acc, ans, index) => 
            (questions![index] && ans === questions![index].correctAnswer) ? acc + 1 : acc, 0);

        const finalAttempt: SlotAttempt = {
            slotId: getQuizSlotId(),
            score,
            totalQuestions: questions!.length,
            format,
            brand,
            questions: questions!,
            userAnswers: newAnswers,
            timePerQuestion: newTimes,
            usedHintIndices,
            timestamp: Date.now(),
        };

        setLastAttemptInSlot(finalAttempt);
        saveAttemptInBackground(finalAttempt);
        router.replace(`/quiz/results`);
        return;
    }

    if (currentQuestionIndex === 2) {
      setAdConfig({
        ad: adLibrary.midQuizAd,
        onFinished: () => {
          setAdConfig(null);
          goToNextQuestion();
        },
        children: <p className="font-bold text-lg mt-4">Strategic Timeout: A moment to strategize.</p>
      });
      return;
    }
    
    const interstitial = interstitialAds[currentQuestionIndex];
    if (interstitial) {
      setInterstitialConfig(interstitial);
      return;
    }
    
    goToNextQuestion();

  }, [userAnswers, timePerQuestion, timeLeft, currentQuestionIndex, questions, usedHintIndices, saveAttemptInBackground, router, goToNextQuestion, brand, format, setLastAttemptInSlot]);

  useEffect(() => {
    async function fetchQuestions() {
      if (hasFetchedQuestions.current) return;
      hasFetchedQuestions.current = true;
      
      setIsLoading(true);
      try {
        const { questions: generatedQuestions } = await generateQuiz({ format });
        setQuestions(generatedQuestions);
      } catch (error) {
        console.error("Failed to generate quiz:", error);
        setQuestions(null);
        throw error;
      }
      setIsLoading(false);
    }
    fetchQuestions();
  }, [format]);
  
  useEffect(() => {
    if (selectedOption || adConfig || interstitialConfig || !questions || isTerminated) return;

    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else {
       proceedToNextStep('');
    }
  }, [timeLeft, selectedOption, adConfig, interstitialConfig, questions, isTerminated, proceedToNextStep]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isTerminated && questions && !quizCompleted.current) {
        setIsTerminated(true);
        quizCompleted.current = true;

        const malpracticeAttempt: SlotAttempt = {
            slotId: getQuizSlotId(),
            score: 0,
            totalQuestions: questions.length,
            format,
            brand,
            questions,
            userAnswers: Array(questions.length).fill(''),
            timePerQuestion: [],
            usedHintIndices: [],
            timestamp: Date.now(),
            reason: 'malpractice',
        };

        setLastAttemptInSlot(malpracticeAttempt);
        saveAttemptInBackground(malpracticeAttempt);
        
        router.replace(`/quiz/results?reason=malpractice`);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [router, isTerminated, questions, format, brand, setLastAttemptInSlot, saveAttemptInBackground]);


  const onInterstitialComplete = useCallback(() => {
    setInterstitialConfig(null);
    goToNextQuestion();
  }, [goToNextQuestion]);


  const handleAnswerSelect = useCallback((option: string) => {
    if (selectedOption) return;
    setSelectedOption(option);
    setTimeout(() => proceedToNextStep(option), 300);
  }, [selectedOption, proceedToNextStep]);


  const handleUseHint = useCallback(() => {
    if (usedHintIndices.includes(currentQuestionIndex) || adConfig || !questions) return;
    const currentAd = adLibrary.hintAds[currentQuestionIndex % adLibrary.hintAds.length];
    setAdConfig({
        ad: currentAd,
        onFinished: () => {
            setIsHintVisible(true);
            setUsedHintIndices(prev => [...prev, currentQuestionIndex]);
            setAdConfig(null);
        },
        children: <p className="font-bold text-lg mt-4">Enjoy your hint!</p>
    });
  }, [adConfig, currentQuestionIndex, usedHintIndices, questions]);

  if (isLoading) {
    return <QuizSkeleton />;
  }

  if (!questions) {
     return (
        <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-4">
            <h1 className="text-2xl font-bold mb-4">Quiz Generation Failed</h1>
            <p>We couldn't generate the quiz questions. Please try again later.</p>
            <Button onClick={() => router.push('/home')} className="mt-6">Go Home</Button>
        </div>
    );
  }
  
  if (isTerminated) {
     return (
        <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-4">
            <h1 className="text-2xl font-bold mb-4">Quiz Terminated</h1>
        </div>
     );
  }
  
  const currentQuestion = questions[currentQuestionIndex];

  return (
    <>
      <div 
        className="flex flex-col h-screen bg-background text-foreground p-4 select-none"
        onContextMenu={(e) => e.preventDefault()}
      >
        <QuizHeader format={format} current={currentQuestionIndex} total={questions.length} />

        <main className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
          <div className="mb-8">
            <Timer timeLeft={timeLeft} />
          </div>
            
          <QuestionCard
            question={currentQuestion}
            isHintVisible={isHintVisible}
            options={currentQuestion.options}
            selectedOption={selectedOption}
            handleAnswerSelect={handleAnswerSelect}
          />
          
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

const QuizPageFallback = () => (
  <div className="flex h-screen w-screen items-center justify-center bg-background">
    <Loader2 className="h-12 w-12 animate-spin text-primary" />
  </div>
);

export default function QuizPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<QuizPageFallback />}>
        <QuizComponent />
      </Suspense>
    </AuthGuard>
  )
}
