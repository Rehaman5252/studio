
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
import { useQuizStatus, type SlotAttempt } from '@/context/QuizStatusProvider';
import CricketLoading from '@/components/CricketLoading';
import { generateQuiz } from '@/ai/flows/generate-quiz-flow';
import InterstitialLoader from '@/components/InterstitialLoader';
import { db } from '@/lib/firebase';
import { doc, setDoc, collection, writeBatch, increment, type DocumentData } from 'firebase/firestore';


const interstitialAds: Record<number, { logo: string; hint: string }> = {
    0: { logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/44/BMW.svg/600px-BMW.svg.png', hint: 'BMW logo' },
    1: { logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/74/Dominos_pizza_logo.svg/1200px-Dominos_pizza_logo.svg.png', hint: 'Dominos logo' },
    3: { logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Pepsi_logo_2014.svg/1200px-Pepsi_logo_2014.svg.png', hint: 'Pepsi logo' },
};

const QuizHeader = memo(({ format, current, total }: { format: string, current: number, total: number }) => {
    const progressValue = ((current + 1) / total) * 100;
    return (
        <header className="w-full max-w-2xl mx-auto mb-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold">{format} Quiz</h1>
            <p className="font-semibold">{current + 1} / {total}</p>
          </div>
          <Progress value={progressValue} className="h-2 [&>div]:bg-primary" />
        </header>
    );
});
QuizHeader.displayName = 'QuizHeader';

const Timer = memo(({ timeLeft }: { timeLeft: number }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const offset = Math.max(0, circumference - (timeLeft / 20) * circumference);

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

const QuizOption = memo(({ option, index, isSelected, selectedOption, handleAnswerSelect }: {
    option: string;
    index: number;
    isSelected: boolean;
    selectedOption: string | null;
    handleAnswerSelect: (option: string) => void;
}) => {
    return (
        <Button
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
});
QuizOption.displayName = 'QuizOption';

const QuestionCard = memo(({ question, isHintVisible, options, selectedOption, handleAnswerSelect, currentQuestionIndex }: {
    question: QuizQuestion;
    isHintVisible: boolean;
    options: string[];
    selectedOption: string | null;
    handleAnswerSelect: (option: string) => void;
    currentQuestionIndex: number;
}) => (
    <Card className="w-full bg-card shadow-lg">
        <CardHeader>
            <CardTitle className="text-xl md:text-2xl leading-tight text-foreground">
                {question.questionText}
            </CardTitle>
            {isHintVisible && question.hint && (
                <p className="text-sm text-primary pt-2 animate-in fade-in">
                    <strong>Hint:</strong> {question.hint}
                </p>
            )}
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {options.map((option, index) => (
                <QuizOption
                    key={`${currentQuestionIndex}-${index}`}
                    option={option}
                    index={index}
                    isSelected={selectedOption === option}
                    selectedOption={selectedOption}
                    handleAnswerSelect={handleAnswerSelect}
                />
            ))}
        </CardContent>
    </Card>
));
QuestionCard.displayName = 'QuestionCard';

function QuizComponent() {
  const { loading: authLoading } = useRequireAuth();
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

  const saveAttemptInBackground = useCallback(async (attempt: SlotAttempt) => {
    if (!db || !user || !userData) {
      console.error("Cannot save quiz attempt: Missing user context.", { db, user, userData });
      return;
    }

    try {
      const batch = writeBatch(db);

      // 1. Save to user's private quiz history
      const attemptDocRef = doc(collection(db, 'users', user.uid, 'quizHistory'), attempt.slotId);
      batch.set(attemptDocRef, attempt);

      // 2. Update the global live leaderboard for the current slot
      const totalTime = attempt.timePerQuestion?.reduce((a, b) => a + b, 0) || 0;
      const leaderboardEntryRef = doc(db, 'liveLeaderboard', attempt.slotId, 'entries', user.uid);
      batch.set(leaderboardEntryRef, {
        name: userData.name || user.displayName || 'Anonymous',
        score: attempt.score,
        time: totalTime,
        avatar: userData.photoURL || user.photoURL || null,
      });
      
      // 3. Increment user's aggregate stats
      const userDocRef = doc(db, 'users', user.uid);
      
      const userStatsUpdate: DocumentData = {
          quizzesPlayed: increment(1),
          totalTimePlayed: increment(totalTime)
      };
      
      const isPerfectScore = attempt.score === attempt.totalQuestions && attempt.totalQuestions > 0;

      if (isPerfectScore) {
          console.log(`Perfect score detected for user ${user.uid}! Incrementing stats.`);
          userStatsUpdate.perfectScores = increment(1);
          userStatsUpdate.certificatesEarned = increment(1);
          userStatsUpdate.totalRewards = increment(100);
      }
      
      batch.update(userDocRef, userStatsUpdate);

      // Commit the batch and wait for it to complete
      await batch.commit();
      console.log(`Successfully saved quiz data in batch for user ${user.uid}.`);

    } catch (error) {
      console.error("FATAL: Error saving quiz data in batch: ", error);
      // Optionally, add a toast here to inform the user of a save error.
    }
  }, [user, userData]);

  const goToNextQuestion = useCallback(() => {
    setSelectedOption(null);
    setIsHintVisible(false);
    setCurrentQuestionIndex((prev) => prev + 1);
    setTimeLeft(20);
  }, []);
  
  const proceedToNextStep = useCallback(async (answer: string) => {
    const newAnswers = [...userAnswers, answer];
    const newTimes = [...timePerQuestion, 20 - timeLeft];
    
    setUserAnswers(newAnswers);
    setTimePerQuestion(newTimes);
    
    if (!questions) return;

    if (currentQuestionIndex >= questions.length - 1) {
        if (quizCompleted.current) return;
        quizCompleted.current = true;
        
        const score = newAnswers.reduce((acc, ans, index) => 
            (questions[index] && ans === questions[index].correctAnswer) ? acc + 1 : acc, 0);

        const finalAttempt: SlotAttempt = {
            slotId: getQuizSlotId(),
            score,
            totalQuestions: questions.length,
            format,
            brand,
            questions: questions,
            userAnswers: newAnswers,
            timePerQuestion: newTimes,
            usedHintIndices,
            timestamp: Date.now(),
        };

        setLastAttemptInSlot(finalAttempt);
        // Navigate immediately for a faster user experience.
        router.replace(`/quiz/results`);
        // Save the data in the background without blocking the UI.
        saveAttemptInBackground(finalAttempt);
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

  }, [userAnswers, timePerQuestion, timeLeft, questions, currentQuestionIndex, format, brand, usedHintIndices, setLastAttemptInSlot, saveAttemptInBackground, router, goToNextQuestion]);

  // Fetch questions
  useEffect(() => {
    async function fetchQuestions() {
      if (hasFetchedQuestions.current || authLoading) return;
      hasFetchedQuestions.current = true;
      
      setIsLoading(true);
      try {
        const generatedQuestions = await generateQuiz({ format });
        setQuestions(generatedQuestions);
      } catch (error) {
        console.error("Failed to generate quiz:", error);
        setQuestions(null);
        // Let the error boundary handle this
        throw error;
      }
      setIsLoading(false);
    }
    fetchQuestions();
  }, [format, authLoading]);
  
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

  if (authLoading || isLoading) {
    return <CricketLoading message={authLoading ? 'Verifying your session...' : `Generating your ${format} quiz...`} />;
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
            currentQuestionIndex={currentQuestionIndex}
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
    <Suspense fallback={<CricketLoading message="Loading your quiz..." />}>
      <QuizComponent />
    </Suspense>
  )
}
