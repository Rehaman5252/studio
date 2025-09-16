
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
import { buildAttempt } from '@/lib/quiz-utils';
import PreQuizLoader from './PreQuizLoader';
import { Button } from '../ui/button';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { isFirebaseConfigured } from '@/lib/firebase';
import { motion } from 'framer-motion';
import { getQuizSlotId } from '@/lib/utils';
import LoginPrompt from '../auth/LoginPrompt';


interface QuizClientProps {
  brand: string;
  format: string;
}

type QuizState = 'loading' | 'pre-quiz' | 'playing' | 'submitting' | 'error' | 'unauthenticated';

type QuizAPIResponse = {
  ok: boolean;
  quiz: QuizData;
  source?: 'ai' | 'fallback';
  reqId?: string;
  error?: { message: string };
  errorDetails?: { message: string, originalError: string, code: string };
};

const IS_DEV = process.env.NODE_ENV !== "production";


export default function QuizClient({ brand, format }: QuizClientProps) {
  const [quizState, setQuizState] = useState<QuizState>('loading');
  const [quizData, setQuizData] = useState<QuizData | null>(null);
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
  
  const isFinishedRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const slotId = getQuizSlotId();
        if (sessionStorage.getItem(`quiz-finished-${slotId}`)) {
          isFinishedRef.current = true;
          router.replace('/'); 
        }
    }
  }, [router]);


  const interstitialConfig: InterstitialAdConfig | null = useMemo(() => {
    return interstitialAds[currentQuestionIndex] || null;
  }, [currentQuestionIndex]);

  const fetchQuiz = useCallback(async () => {
    if (isFinishedRef.current || authLoading) return;
    abortControllerRef.current?.abort();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setQuizState('loading');
    setError(null);

    if (!user) {
        setQuizState('unauthenticated');
        return;
    }
    if (isOffline) {
        setError("You appear to be offline. Please check your connection.");
        setQuizState('error');
        return;
    }
    if (!isFirebaseConfigured) {
        setError("🔥 The app is not connected to the server. Please try again later.");
        setQuizState('error');
        return;
    }
    
    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, userId: user.uid }),
        signal: controller.signal,
      });

      if (controller.signal.aborted) return;
      
      const responseText = await response.text();
      let data: QuizAPIResponse;
      
      try {
        data = JSON.parse(responseText);
      } catch(parseErr) {
        console.error('Quiz API returned non-json:', responseText);
        throw new Error('Server returned an unexpected response. Please try again.');
      }
      
      if (!data.ok || !data.quiz) {
         const msg = data.error?.message || data.errorDetails?.message || "Could not load quiz from the server.";
         if (data.quiz && data.source === 'fallback') {
            setQuizData(data.quiz);
            setQuizSource('fallback');
            setQuizState('pre-quiz');
            toast({ title: 'Heads up!', description: msg, variant: 'default' });
         } else {
            setError(msg);
            setQuizState('error');
         }
         return;
      }
      
      if (data.source === 'fallback' && data.errorDetails) {
          let friendlyTitle = "Standard Quiz Loaded";
          let friendlyDesc = "The AI is warming up, so here's a ready-made quiz for you.";

          switch (data.errorDetails.code) {
            case "INVALID_JSON":
              friendlyTitle = "⚠️ Bad Request Fixed";
              friendlyDesc = "We couldn't read your request, but a quiz is ready anyway.";
              break;
            case "INVALID_PAYLOAD":
              friendlyTitle = "⚠️ Invalid Request";
              friendlyDesc = "Some data was missing, but we generated a quiz for you.";
              break;
            case "AI_FLOW_FAILED":
              friendlyTitle = "🤖 AI Unavailable";
              friendlyDesc = "The AI engine stumbled, so a standard quiz is here for you.";
              break;
            case "FATAL":
              friendlyTitle = "🔥 Unexpected Error";
              friendlyDesc = "Something went wrong, but you're not blocked—here's a quiz.";
              break;
          }

          if (IS_DEV) {
            friendlyDesc += ` (Dev: ${data.reqId} - ${data.errorDetails.originalError})`;
          }

          toast({
              title: friendlyTitle,
              description: friendlyDesc,
              duration: 7000,
          });
      }

      setQuizData(data.quiz);
      setQuizSource(data.source || 'ai');
      setQuizState('pre-quiz');
      
    } catch (e: any) {
      if (e.name === 'AbortError') return; // Ignore abort errors
      console.error("Quiz fetch failed:", e);
      let userMessage = "Could not load quiz. The AI might be busy. Please try again.";
      
      if (typeof e.message === 'string' && e.message.includes("Failed to fetch")) {
          userMessage = "📴 You appear to be offline. Please check your connection.";
      } else if (typeof e.message === 'string') {
          userMessage = e.message;
      }
      
      setError(userMessage);
      setQuizState('error');
    }
  }, [format, user, authLoading, isOffline, toast]);

  useEffect(() => {
    if (!authLoading) {
        fetchQuiz();
    }
    return () => {
        abortControllerRef.current?.abort();
    };
  }, [fetchQuiz, authLoading]);

  const handlePreQuizFinish = useCallback(() => {
    if (isFinishedRef.current) return;
    setQuizState('playing');
    setStartTime(Date.now());
  }, []);

  const finishQuiz = useCallback(async (finalAnswers: string[], finalTimePerQuestion: number[]) => {
    if (isFinishedRef.current || !quizData || !user) return;
    isFinishedRef.current = true; 
    setQuizState('submitting');
    
    const attempt = buildAttempt({
      user,
      quizData,
      brand,
      format,
      userAnswers: finalAnswers,
      timePerQuestion: finalTimePerQuestion,
      source: quizSource,
    });
    
    sessionStorage.setItem(`quiz-finished-${attempt.slotId}`, "true");
    const { success, attemptId } = await addQuizAttempt(attempt);

    if (success && attemptId) {
        router.replace(`/quiz/results?attemptId=${attemptId}`);
    } else {
        toast({ title: "Submission Error", description: "Could not save your results. Please check connection.", variant: "destructive"});
        router.replace('/');
    }

  }, [quizData, user, brand, format, addQuizAttempt, router, quizSource, toast]);

  const handleNoBall = useCallback(async (reason: 'no-ball') => {
    if (isFinishedRef.current || !quizData || !user) return;
    isFinishedRef.current = true;
    setQuizState('submitting');

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
    sessionStorage.setItem(`quiz-finished-${attempt.slotId}`, "true");
    
    const { success, attemptId } = await addQuizAttempt(attempt);

    if (success && attemptId) {
        router.replace(`/quiz/results?attemptId=${attemptId}`);
    } else {
        toast({ title: "Submission Error", description: "Could not save your results. Please check connection.", variant: "destructive"});
        router.replace('/');
    }

  }, [handleMalpractice, toast, quizData, user, brand, format, userAnswers, timePerQuestion, addQuizAttempt, router, quizSource]);

  const handleNextQuestion = useCallback((answer: string) => {
    if (isFinishedRef.current) return;

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
  
  if (quizState === 'loading' || authLoading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-muted-foreground p-4 text-center">
             <CricketLoading />
            <p className="mb-4 mt-4">Warming up...</p>
        </div>
    );
  }

  if (quizState === 'unauthenticated') {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
            <LoginPrompt 
                icon={AlertTriangle}
                title="Authentication Required"
                description="Please sign in to play a quiz."
            />
        </div>
    );
  }
  
  if (quizState === 'pre-quiz' && quizData) {
      return <PreQuizLoader format={format} onFinish={handlePreQuizFinish} />;
  }

  if (quizState === 'error') {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen text-destructive p-4 text-center">
            <AlertTriangle className="h-12 w-12 mb-4" />
            <p className="font-semibold mb-4">{error}</p>
            <Button onClick={fetchQuiz}>Try Again</Button>
        </div>
    );
  }
  
  if (quizState === 'submitting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-muted-foreground p-4 text-center">
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="flex flex-col items-center gap-4"
        >
            <ShieldCheck className="h-16 w-16 text-primary animate-pulse" />
            <h2 className="text-2xl font-bold text-foreground">Third Umpire Review...</h2>
            <p>Sending your scorecard for verification.</p>
            <CricketLoading />
        </motion.div>
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

  if (quizState === 'playing' && quizData) {
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
            hint={hints[currentQuestionIndex]}
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

  return <div className="flex items-center justify-center min-h-screen"><CricketLoading /></div>;
}

