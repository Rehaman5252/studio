
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { QuizData, QuizQuestion, QuizAttempt } from '@/ai/schemas';
import { CricketLoading } from '@/components/CricketLoading';
import QuizView from '@/components/quiz/QuizView';
import InterstitialLoader from '@/components/InterstitialLoader';
import { AdDialog } from '@/components/AdDialog';
import { getAIPoweredHint } from '@/ai/flows/ai-powered-hints';
import { adLibrary, interstitialAds, InterstitialAdConfig } from '@/lib/ads';
import { useToast } from '@/hooks/use-toast';
import { getQuizSlotId } from '@/lib/utils';
import { useSettings } from '@/hooks/use-settings';

interface QuizClientProps {
  brand: string;
  format: string;
}

type QuizAPIResponse = QuizData & {
  source?: 'ai' | 'fallback';
};

const encodeAttempt = (attempt: QuizAttempt) => 
     encodeURIComponent(btoa(JSON.stringify(attempt)));

export default function QuizClient({ brand, format }: QuizClientProps) {
  const [quizData, setQuizData] = useState<QuizAPIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [timePerQuestion, setTimePerQuestion] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [showAdDialog, setShowAdDialog] = useState(false);
  const [adForHint, setAdForHint] = useState<any>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const router = useRouter();
  const { user, addQuizAttempt, handleMalpractice } = useAuth();
  const { toast } = useToast();
  const { settings } = useSettings();

  const interstitialConfig: InterstitialAdConfig | null = useMemo(() => {
    return interstitialAds[currentQuestionIndex] || null;
  }, [currentQuestionIndex]);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (!user) {
        setError("You must be logged in to play a quiz.");
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const response = await fetch('/api/quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ format, userId: user.uid }),
        });
        if (!response.ok) {
          throw new Error('Failed to fetch quiz data.');
        }
        const data: QuizAPIResponse = await response.json();
        if (data.questions.length < 5) {
            throw new Error('Invalid quiz data received from server.');
        }

        const dataWithSource = { ...data, source: data.source ?? 'fallback' };
        setQuizData(dataWithSource);
        
        if (dataWithSource.source === 'fallback') {
            toast({
                title: "Classic Quiz Round!",
                description: "This round is powered by our classic quiz engine while AI prepares more fresh challenges!",
            });
        }
        
      } catch (e: any) {
        console.error("Quiz fetch failed:", e);
        setError("Could not load the quiz. Please try again later.");
        toast({
          title: "Error",
          description: "Failed to load quiz. Please check your connection and try again.",
          variant: "destructive"
        })
      } finally {
        setLoading(false);
        setStartTime(Date.now());
      }
    };
    fetchQuiz();
  }, [format, user, toast]);

  const buildAttempt = useCallback((overrides: Partial<QuizAttempt> = {}): QuizAttempt => {
    if (!quizData || !user) throw new Error("Quiz data or user not available for building attempt.");

    const score = overrides.score ?? quizData.questions.reduce((acc, q, i) => userAnswers[i] === q.correctAnswer ? acc + 1 : acc, 0);
    
    const unansweredCount = Math.max(0, quizData.questions.length - userAnswers.length);

    return {
        userId: user.uid,
        slotId: getQuizSlotId(),
        brand,
        format,
        questions: quizData.questions,
        userAnswers,
        score,
        totalQuestions: quizData.questions.length,
        timestamp: Date.now(),
        timePerQuestion,
        source: quizData.source,
        unanswered: unansweredCount,
        ...overrides,
    };
  }, [quizData, user, brand, format, userAnswers, timePerQuestion]);

  const handleNoBall = useCallback(async (reason: 'no-ball') => {
    const noBallCount = await handleMalpractice();
    toast({
        title: "No Ball!",
        description: `Malpractice detected. You have ${noBallCount} no-ball(s). 3 no-balls and you're out for the day!`,
        variant: "destructive"
    });
    
    const attempt = buildAttempt({ reason, score: 0 });

    await addQuizAttempt(attempt);
    
    router.replace(`/quiz/results?attempt=${encodeAttempt(attempt)}`);
  }, [handleMalpractice, toast, buildAttempt, addQuizAttempt, router]);

  const finishQuiz = useCallback(async () => {
    const attempt = buildAttempt();
    
    await addQuizAttempt(attempt);

    router.replace(`/quiz/results?attempt=${encodeAttempt(attempt)}`);

  }, [buildAttempt, addQuizAttempt, router]);

  const handleNextQuestion = useCallback((answer: string) => {
    const endTime = Date.now();
    const timeTaken = (endTime - startTime) / 1000; // in seconds
    setTimePerQuestion(prev => [...prev, parseFloat(timeTaken.toFixed(2))]);
    setUserAnswers(prev => [...prev, answer]);
    
    if (currentQuestionIndex < quizData!.questions.length - 1) {
        if (interstitialConfig) {
            setShowInterstitial(true);
        } else {
            setCurrentQuestionIndex(prev => prev + 1);
            setStartTime(Date.now());
        }
    } else {
      finishQuiz();
    }
  }, [startTime, currentQuestionIndex, quizData, finishQuiz, interstitialConfig]);

  const onInterstitialComplete = useCallback(() => {
    setShowInterstitial(false);
    setCurrentQuestionIndex(prev => prev + 1);
    setStartTime(Date.now());
  }, []);

  const handleHintRequest = () => {
    if (!quizData) return;
    const adConfig = adLibrary.hintAds[currentQuestionIndex];
    if (adConfig) {
      setAdForHint(adConfig);
      setShowAdDialog(true);
    }
  };

  const handleAdFinished = async () => {
    setShowAdDialog(false);
    if (adForHint && quizData) {
      setIsHintLoading(true);
      try {
        const currentQ = quizData.questions[currentQuestionIndex];
        const hintText = await getAIPoweredHint({
            question: currentQ.question,
            options: currentQ.options,
            correctAnswer: currentQ.correctAnswer
        });
        setHint(hintText);
      } catch (e) {
        console.error("Failed to get AI hint:", e);
        setHint("Couldn't get a hint this time. Maybe think about the player's most famous matches?");
      } finally {
        setIsHintLoading(false);
      }
    }
    setAdForHint(null);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background">
        <CricketLoading />
        <p className="mt-4 text-muted-foreground animate-pulse">Loading Quiz...</p>
      </div>
    );
  }

  if (error) {
    return <div className="flex items-center justify-center min-h-screen text-destructive p-4 text-center">{error}</div>;
  }

  if (!quizData) {
    return <div className="flex items-center justify-center min-h-screen">Something went wrong.</div>;
  }
  
  if (showInterstitial && interstitialConfig) {
    if (interstitialConfig.type === 'static' && interstitialConfig.logoUrl) {
      return (
        <InterstitialLoader
          logoUrl={interstitialConfig.logoUrl}
          logoHint={interstitialConfig.logoHint || 'brand logo'}
          duration={interstitialConfig.durationMs}
          onComplete={onInterstitialComplete}
        />
      );
    }
    if (interstitialConfig.type === 'video' && interstitialConfig.videoUrl) {
      return (
        <AdDialog 
            open={true}
            onAdFinished={onInterstitialComplete}
            duration={interstitialConfig.durationSec!}
            skippableAfter={interstitialConfig.skippableAfterSec!}
            adTitle={interstitialConfig.videoTitle!}
            adType='video'
            adUrl={interstitialConfig.videoUrl!}
        />
      )
    }
  }

  return (
    <>
       <QuizView
        question={quizData.questions[currentQuestionIndex]}
        questionNumber={currentQuestionIndex + 1}
        totalQuestions={quizData.questions.length}
        onAnswer={handleNextQuestion}
        onNoBall={handleNoBall}
        brand={brand}
        format={format}
        onHintRequest={handleHintRequest}
        hint={hint}
        isHintLoading={isHintLoading}
        soundEnabled={settings.sound}
       />
      {adForHint && (
        <AdDialog
          open={showAdDialog}
          onAdFinished={handleAdFinished}
          duration={adForHint.duration}
          skippableAfter={adForHint.skippableAfter}
          adTitle={adForHint.title}
          adType={adForHint.type}
          adUrl={adForHint.url}
          adHint={adForHint.hint}
        />
      )}
    </>
  );
}
