
'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import type { QuizData, QuizQuestion, HintOutput } from '@/ai/schemas';
import { CricketLoading } from '@/components/CricketLoading';
import QuizView from '@/components/quiz/QuizView';
import InterstitialLoader from '@/components/InterstitialLoader';
import { AdDialog } from '@/components/AdDialog';
import { getAIPoweredHint } from '@/ai/flows/ai-powered-hints';
import { adLibrary, interstitialAds, type InterstitialAdConfig } from '@/lib/ads';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/hooks/use-settings';
import { buildAttempt, encodeAttempt } from '@/lib/quiz-utils';
import PreQuizLoader from './PreQuizLoader';
import { Button } from '../ui/button';
import { AlertTriangle } from 'lucide-react';
import { isFirebaseConfigured } from '@/lib/firebase';
import { getFallbackQuiz } from '@/lib/fallback-quiz';

interface QuizClientProps {
  brand: string;
  format: string;
}

type QuizAPIResponse = {
  quiz: QuizData;
  source?: 'ai' | 'fallback';
  reqId?: string;
  error?: string;
};

export default function QuizClient({ brand, format }: QuizClientProps) {
  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPreQuizLoader, setShowPreQuizLoader] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [timePerQuestion, setTimePerQuestion] = useState<number[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [quizSource, setQuizSource] = useState<'ai' | 'fallback'>('ai');
  const [showAdDialog, setShowAdDialog] = useState(false);
  const [adForHint, setAdForHint] = useState<InterstitialAdConfig | null>(null);
  const [hints, setHints] = useState<Record<number, HintOutput>>({});
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

    if (authLoading || !user) return;

    if (isOffline) {
        setError("You appear to be offline. Please check your connection.");
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
    
    try {
      setLoading(true);
      setError(null);
      await new Promise(res => setTimeout(res, 100));
      if (controller.signal.aborted) return;

      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ format, userId: user.uid }),
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;
      
      const data: QuizAPIResponse = await response.json();
      
      if (!response.ok || !data.quiz) {
         throw new Error(data.error || "The server returned an unexpected response.");
      }

      setQuizData(data.quiz);
      setQuizSource(data.source || 'fallback');

      if (data.source === 'ai') {
        toast({ title: "✅ Fresh AI-powered quiz loaded!" });
      } else {
        const reason = data.error || 'An unknown issue occurred';
        const userMessage = reason.includes('timeout')
            ? "The AI umpire is thinking! Playing a classic quiz instead."
            : "Heads up! We're using a classic quiz set for now.";
        toast({
            title: "Fallback Quiz Loaded",
            description: userMessage,
            duration: 5000,
        });
      }
      
    } catch (e: any) {
      if (e.name === 'AbortError') return;
      console.error("Quiz fetch failed:", e);
      let userMessage = "Could not load quiz. Playing a classic set instead.";
      
      if (typeof e.message === 'string' && e.message.includes("Failed to fetch")) {
        userMessage = "📴 You appear to be offline. Please check your connection.";
      }
      
      toast({ title: "Error Loading Quiz", description: userMessage, variant: "destructive" });
      
      const localFallback = getFallbackQuiz(format);
      setQuizData(localFallback);
      setQuizSource('fallback');

    } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
    }
  }, [format, user, toast, authLoading, isOffline]);

  useEffect(() => {
    if (user) {
        fetchQuiz();
    } else if (!authLoading) {
        setError("Please sign in to play a quiz.");
        setLoading(false);
        setShowPreQuizLoader(false);
    }
    return () => {
        abortControllerRef.current?.abort();
    };
  }, [fetchQuiz, user, authLoading]);

  const handlePreQuizFinish = useCallback(() => {
    setShowPreQuizLoader(false);
    setStartTime(Date.now());
  }, []);

  const finishQuiz = useCallback(async (finalAnswers: string[], finalTimePerQuestion: number[]) => {
    if (!quizData || !user) return;
    const attempt = buildAttempt({
      user,
      quizData,
      brand,
      format,
      userAnswers: finalAnswers,
      timePerQuestion: finalTimePerQuestion,
      source: quizSource,
    });
    const result = await addQuizAttempt(attempt);
    if(result.success) {
        router.replace(`/quiz/results?attempt=${encodeAttempt(attempt)}`);
    } else {
        setError("Could not save quiz results. Please check your connection and try again.");
    }
  }, [quizData, user, brand, format, addQuizAttempt, router, quizSource]);

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
      source: quizSource,
    });
    await addQuizAttempt(attempt);
    router.replace(`/quiz/results?attempt=${encodeAttempt(attempt)}`);
  }, [handleMalpractice, toast, quizData, user, brand, format, userAnswers, timePerQuestion, addQuizAttempt, router, quizSource]);

  const handleNextQuestion = useCallback((answer: string) => {
    const endTime = Date.now();
    const timeTaken = (endTime - startTime) / 1000;
    
    const updatedAnswers = [...userAnswers, answer];
    const updatedTime = [...timePerQuestion, parseFloat(timeTaken.toFixed(2))];
    
    setUserAnswers(updatedAnswers);
    setTimePerQuestion(updatedTime);
    
    if (quizData && currentQuestionIndex < quizData.questions.length - 1) {
        if (interstitialConfig) {
            setShowInterstitial(true);
        } else {
            setCurrentQuestionIndex(prev => prev + 1);
            setStartTime(Date.now());
        }
    } else {
      // This is the final question, call finishQuiz
      finishQuiz(updatedAnswers, updatedTime);
    }
  }, [startTime, currentQuestionIndex, quizData, finishQuiz, interstitialConfig, userAnswers, timePerQuestion]);

  const onInterstitialComplete = useCallback(() => {
    setShowInterstitial(false);
    setCurrentQuestionIndex(prev => prev + 1);
    setStartTime(Date.now());
  }, []);

  const handleHintRequest = useCallback(async () => {
    if (!quizData || isHintLoading) return;
    const adConfig = adLibrary.hintAds[currentQuestionIndex];
    if (adConfig) {
      setAdForHint(adConfig);
      setShowAdDialog(true);
    }
  }, [quizData, currentQuestionIndex, isHintLoading]);

  const handleAdFinished = useCallback(async () => {
    setShowAdDialog(false);
    if (!adForHint || !quizData) return;
    
    setIsHintLoading(true);
    try {
      const currentQ = quizData.questions[currentQuestionIndex];
      const hintResult = await getAIPoweredHint({ question: currentQ });
      setHints(prev => ({ ...prev, [currentQuestionIndex]: hintResult }));
    } catch (e) {
      console.error("Failed to get AI hint:", e);
      setHints(prev => ({ ...prev, [currentQuestionIndex]: { hint: "Couldn't get a hint this time. Maybe think about the player's most famous matches?", source: "fallback", debug: "Client-side error" } }));
    } finally {
      setIsHintLoading(false);
    }
    setAdForHint(null);
  }, [adForHint, quizData, currentQuestionIndex]);
  
  if (showPreQuizLoader && !error && !authLoading && loading) {
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
            onOpenChange={()=>{}}
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
        hint={hints[currentQuestionIndex]?.hint || null}
        isHintLoading={isHintLoading}
        soundEnabled={settings.sound}
       />
      {adForHint && (
        <AdDialog
          open={showAdDialog}
          onOpenChange={setShowAdDialog}
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
