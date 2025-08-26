
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { QuizData } from '@/ai/schemas';
import { CricketLoading } from '@/components/CricketLoading';
import QuizView from '@/components/quiz/QuizView';
import InterstitialLoader from '@/components/InterstitialLoader';
import { AdDialog } from '@/components/AdDialog';
import { getAIPoweredHint } from '@/ai/flows/ai-powered-hints';
import { adLibrary, interstitialAds, InterstitialAdConfig } from '@/lib/ads';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/hooks/use-settings';
import { buildAttempt, encodeAttempt } from '@/lib/quiz-utils';
import PreQuizLoader from './PreQuizLoader';
import { Button } from '../ui/button';
import { AlertTriangle } from 'lucide-react';
import { mapFirestoreError } from '@/lib/utils';
import { isFirebaseConfigured } from '@/lib/firebase';

interface QuizClientProps {
  brand: string;
  format: string;
}

type QuizAPIResponse = QuizData & {
  source?: 'ai' | 'fallback';
  fallbackReason?: string;
};

export default function QuizClient({ brand, format }: QuizClientProps) {
  const [quizData, setQuizData] = useState<QuizAPIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPreQuizLoader, setShowPreQuizLoader] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [timePerQuestion, setTimePerQuestion] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [showAdDialog, setShowAdDialog] = useState(false);
  const [adForHint, setAdForHint] = useState<InterstitialAdConfig | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const router = useRouter();
  const { user, addQuizAttempt, handleMalpractice, loading: authLoading, isOffline } = useAuth();
  const { toast } = useToast();
  const { settings } = useSettings();
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const interstitialConfig: InterstitialAdConfig | null = useMemo(() => {
    return interstitialAds[currentQuestionIndex] || null;
  }, [currentQuestionIndex]);

  const fetchQuiz = useCallback(async () => {
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // --- Start: Readiness Checks ---
    if (authLoading) {
      // Don't set error here, just wait for auth to be ready.
      // The parent component will show a loader.
      return;
    }

    if (isOffline) {
        setError("You appear to be offline. Please check your connection.");
        setLoading(false);
        setShowPreQuizLoader(false);
        return;
    }

    if (!user) {
      setError("Please sign in to play a quiz.");
      setLoading(false);
      setShowPreQuizLoader(false);
      return;
    }
    if (!isFirebaseConfigured) {
        setError("🔥 The app is not connected to the server. Please try again later.");
        setLoading(false);
        setShowPreQuizLoader(false);
        return;
    }
    // --- End: Readiness Checks ---
    
    try {
      setLoading(true);
      setError(null);
      // Small buffer to avoid race conditions
      await new Promise(res => setTimeout(res, 100));
      if (controller.signal.aborted) return;

      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, userId: user.uid }),
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;
      
      const data: QuizAPIResponse = await response.json();
      
      if (!response.ok) {
        // Even if the response is not "ok" (e.g. 500 error), it might contain a usable fallback quiz.
        if (data.source === 'fallback' && data.questions) {
             toast({
              title: "Heads up!",
              description: "The AI Umpire is taking a moment. Playing a classic quiz instead.",
              duration: 5000,
            });
        } else {
            const errorMsg = (data as any).error || `The server returned an error (${response.status}). Please try again.`;
            throw new Error(errorMsg);
        }
      }
      
      if (!data.questions || data.questions.length < 5) throw new Error('Invalid quiz data received from the server.');

      setQuizData(data);
      if (response.ok && data.source === 'fallback' && data.fallbackReason) {
          toast({
              title: "Heads up!",
              description: data.fallbackReason.includes('Timeout') ? "The AI umpire is thinking! Playing a classic quiz instead." : data.fallbackReason,
              duration: 5000,
          });
      }
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      console.error("Quiz fetch failed:", e);
      const errorMessage = mapFirestoreError(e);

      if (!controller.signal.aborted) {
        setError(errorMessage);
        toast({ title: "Error Loading Quiz", description: errorMessage, variant: "destructive" });
      }
    } finally {
        if (!controller.signal.aborted) setLoading(false);
    }
  }, [format, user, toast, authLoading, isOffline]);

  useEffect(() => {
    fetchQuiz();
    return () => {
        abortControllerRef.current?.abort();
    };
  }, [fetchQuiz]);

  const handlePreQuizFinish = useCallback(() => {
    setShowPreQuizLoader(false);
    setStartTime(Date.now());
  }, []);

  const finishQuiz = useCallback(async (currentAnswers: string[], currentTimePerQuestion: number[]) => {
    if (!quizData || !user) return;
    const attempt = buildAttempt({
      user,
      quizData,
      brand,
      format,
      userAnswers: currentAnswers,
      timePerQuestion: currentTimePerQuestion,
    });
    await addQuizAttempt(attempt);
    router.replace(`/quiz/results?attempt=${encodeAttempt(attempt)}`);
  }, [quizData, user, brand, format, addQuizAttempt, router]);

  const handleNoBall = useCallback(async (reason: 'no-ball') => {
    if (!quizData || !user) return;
    const noBallCount = await handleMalpractice();
    toast({
        title: "No Ball!",
        description: `Malpractice detected. You have ${noBallCount} no-ball(s). 3 no-balls and you're out!`,
        variant: "destructive"
    });
    
    const attempt = buildAttempt({
      user,
      quizData,
      brand,
      format,
      userAnswers,
      timePerQuestion,
      overrides: { reason, score: 0 },
    });
    await addQuizAttempt(attempt);
    router.replace(`/quiz/results?attempt=${encodeAttempt(attempt)}`);
  }, [handleMalpractice, toast, quizData, user, brand, format, userAnswers, timePerQuestion, addQuizAttempt, router]);

  const handleNextQuestion = useCallback((answer: string) => {
    const endTime = Date.now();
    const timeTaken = (endTime - startTime) / 1000;
    
    const updatedAnswers = [...userAnswers, answer];
    const updatedTime = [...timePerQuestion, parseFloat(timeTaken.toFixed(2))];
    
    setUserAnswers(updatedAnswers);
    setTimePerQuestion(updatedTime);
    
    if (currentQuestionIndex < quizData!.questions.length - 1) {
        if (interstitialConfig) {
            setShowInterstitial(true);
        } else {
            setCurrentQuestionIndex(prev => prev + 1);
            setStartTime(Date.now());
        }
    } else {
      finishQuiz(updatedAnswers, updatedTime);
    }
  }, [startTime, currentQuestionIndex, quizData, finishQuiz, interstitialConfig, userAnswers, timePerQuestion]);

  const onInterstitialComplete = useCallback(() => {
    setShowInterstitial(false);
    setCurrentQuestionIndex(prev => prev + 1);
    setStartTime(Date.now());
  }, []);

  const handleHintRequest = useCallback(() => {
    if (!quizData) return;
    const adConfig = adLibrary.hintAds[currentQuestionIndex];
    if (adConfig) {
      setAdForHint(adConfig as any);
      setShowAdDialog(true);
    }
  }, [quizData, currentQuestionIndex]);

  const handleAdFinished = useCallback(async () => {
    setShowAdDialog(false);
    if (!adForHint || !quizData) return;
    
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
    setAdForHint(null);
  }, [adForHint, quizData, currentQuestionIndex]);
  
  if (showPreQuizLoader && !error && !authLoading) {
      return <PreQuizLoader format={format} onFinish={handlePreQuizFinish} />;
  }
  
  if (authLoading) {
     return (
        <div className="flex flex-col items-center justify-center min-h-screen text-muted-foreground p-4 text-center">
             <CricketLoading />
            <p className="mb-4 mt-4">Connecting to server...</p>
        </div>
    );
  }

  if (error) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-destructive p-4 text-center">
            <AlertTriangle className="h-12 w-12 mb-4" />
            <p className="font-semibold mb-4">{error}</p>
            <Button onClick={fetchQuiz}>Try Again</Button>
        </div>
    );
  }

  if (loading || !quizData) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-muted-foreground p-4 text-center">
             <CricketLoading />
            <p className="mb-4 mt-4">Loading Quiz...</p>
        </div>
    );
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
