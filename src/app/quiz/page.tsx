
'use client';

import React, { useState, useEffect, Suspense, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { QuizQuestion } from '@/ai/schemas';
import type { Ad } from '@/lib/ads';
import { adLibrary } from '@/lib/ads';
import { Button } from '@/components/ui/button';
import { Lightbulb } from 'lucide-react';
import { AdDialog } from '@/components/AdDialog';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/context/AuthProvider';
import { getQuizSlotId } from '@/lib/utils';
import { useQuizStatus, type SlotAttempt } from '@/context/QuizStatusProvider';
import CricketLoading from '@/components/CricketLoading';
import { generateQuiz } from '@/ai/flows/generate-quiz-flow';
import InterstitialLoader from '@/components/InterstitialLoader';
import { db } from '@/lib/firebase';
import { doc, setDoc, collection, writeBatch, increment } from 'firebase/firestore';
import { QuizHeader } from '@/components/quiz/QuizHeader';
import { Timer } from '@/components/quiz/Timer';
import { QuestionCard } from '@/components/quiz/QuestionCard';


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
  const [facts, setFacts] = useState<string[] | null>(null);
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

        // 1. Save to user's private quiz history collection
        const attemptDocRef = doc(collection(db, 'users', user.uid, 'quizHistory'));
        batch.set(attemptDocRef, { ...attempt, uid: user.uid, name: userData.name || 'Anonymous' });
        
        // 2. Upsert the global live leaderboard for the current slot
        const leaderboardEntryRef = doc(db, 'liveLeaderboard', attempt.slotId, 'entries', user.uid);
        batch.set(leaderboardEntryRef, {
            name: userData.name || 'Anonymous',
            score: attempt.score,
            time: totalTime,
            avatar: userData.photoURL || null,
            disqualified: attempt.reason === 'malpractice'
        });
        
        // 3. Increment the total quizzes played for the user
        const userDocRef = doc(db, 'users', user.uid);
        batch.update(userDocRef, { quizzesPlayed: increment(1) });

        // Commit the batch
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

  // Fetch questions
  useEffect(() => {
    async function fetchQuestions() {
      if (hasFetchedQuestions.current) return;
      hasFetchedQuestions.current = true;
      
      setIsLoading(true);
      try {
        const { questions: generatedQuestions, facts: generatedFacts } = await generateQuiz({ format });
        setQuestions(generatedQuestions);
        setFacts(generatedFacts);
      } catch (error) {
        console.error("Failed to generate quiz:", error);
        setQuestions(null);
        setFacts(null);
        // Let the error boundary handle this
        throw error;
      }
      setIsLoading(false);
    }
    fetchQuestions();
  }, [format]);
  
  // Timer effect
  useEffect(() => {
    if (selectedOption || adConfig || interstitialConfig || !questions || isTerminated) return;

    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else {
       proceedToNextStep('');
    }
  }, [timeLeft, selectedOption, adConfig, interstitialConfig, questions, isTerminated, proceedToNextStep]);

  // Anti-cheat effect and unmount save
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && !isTerminated && questions && !quizCompleted.current) {
        setIsTerminated(true);
        quizCompleted.current = true; // Mark as completed to prevent other logic from running

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
    return <CricketLoading message={`Generating your ${format} quiz...`} facts={facts} />;
  }

  if (!questions) {
    return (
        <CricketLoading state="error" errorMessage="Could not load quiz questions.">
            <Button onClick={() => router.push('/home')}>Go Home</Button>
      </CricketLoading>
    );
  }
  
  if (isTerminated) {
     return <CricketLoading state="error" errorMessage="Quiz Terminated." />;
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

export default function QuizPage() {
  return (
    <AuthGuard>
      <Suspense fallback={<CricketLoading message="Loading your quiz..." />}>
        <QuizComponent />
      </Suspense>
    </AuthGuard>
  )
}
