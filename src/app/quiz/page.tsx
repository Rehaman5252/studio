
'use client';

import React, { useState, useEffect, Suspense, useCallback, memo } from 'react';
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
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';

const questionVariants = {
  hidden: { opacity: 0, x: 300 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } },
  exit: { opacity: 0, x: -300, transition: { duration: 0.3, ease: 'easeIn' } },
};

const QuizComponent = memo(function QuizComponent() {
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
    
    if (lastAttemptInSlot) {
        toast({
            title: "Slot Already Played",
            description: `Showing your results for the ${lastAttemptInSlot.format} quiz.`,
        });
        const attemptDataString = btoa(JSON.stringify(lastAttemptInSlot));
        const reviewUrl = `/quiz/results?review=true&attempt=${encodeURIComponent(attemptDataString)}`;
        router.replace(reviewUrl);
        return;
    }

    async function fetchQuiz() {
      if (!user || !db) {
        toast({ title: 'Error', description: 'Authentication or database service is not available.', variant: 'destructive' });
        router.push('/home');
        return;
      }

      setQuizState('loading');
      
      try {
        const userAttemptsQuery = query(collection(db, `users/${user.uid}/quizAttempts`));
        const userAttemptsSnapshot = await getDocs(userAttemptsQuery);
        const userAskedQuestions = userAttemptsSnapshot.docs.flatMap(doc => (doc.data().questions || []).map((q: QuizQuestion) => q.questionText));

        const sevenDaysAgo = Timestamp.fromDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000));
        const recentGlobalQuestionsQuery = query(collection(db, 'askedQuestions'), where('createdAt', '>=', sevenDaysAgo));
        const recentGlobalQuestionsSnapshot = await getDocs(recentGlobalQuestionsQuery);
        const recentGlobalQuestions = recentGlobalQuestionsSnapshot.docs.map(doc => doc.data().questionText as string);
        
        const allQuestionsToExclude = [...new Set([...userAskedQuestions, ...recentGlobalQuestions])];
        
        console.log("📦 Requesting quiz, excluding", allQuestionsToExclude.length, "questions.");
        const quizData = await generateQuiz({ format, askedQuestions: allQuestionsToExclude });
        
        if (!quizData?.questions || quizData.questions.length !== 5) {
            console.error("❌ Quiz generation failed or returned invalid data:", quizData);
            toast({
                title: 'Could not load quiz',
                description: quizData.errorMessage || 'Invalid response from the quiz generator. Please try again.',
                variant: 'destructive',
                duration: 5000,
            });
            router.push('/home');
            return;
        }

        setQuestions(quizData.questions);
        setUserAnswers(new Array(quizData.questions.length).fill(null));
        setQuestionStartTime(Date.now());
        setTimeLeft(20);
        setQuizState('playing');
        
      } catch (error) {
        console.error("A critical, unexpected error occurred during fetchQuiz:", error);
        toast({ title: 'Critical Error', description: 'A critical error occurred while fetching the quiz. Please try again later.', variant: 'destructive' });
        router.push('/home');
      }
    }
    fetchQuiz();
  }, [format, router, toast, user, profile, lastAttemptInSlot]);

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

    await addQuizAttempt(attemptData);
    
    const attemptDataString = btoa(JSON.stringify(attemptData));
    router.replace(`/quiz/results?attempt=${encodeURIComponent(attemptDataString)}`);

  }, [user, questions, brand, format, timePerQuestion, usedHintIndices, router, addQuizAttempt, handleMalpractice, profile?.noBallCount]);

  const goToNextQuestion = useCallback(() => {
    if (!questions) return;
    setSelectedOption(null);
    setIsHintVisible(false);
    setCurrentQuestionIndex(prev => prev + 1);
    setTimeLeft(20);
    setQuestionStartTime(Date.now());
    setIsAnswerLocked(false);
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
    if (isAnswerLocked || !questions) return;
    
    setIsAnswerLocked(true);
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
    }, 1000);
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
  if (!currentQuestion) {
      console.error("🚨 Current question is undefined. This should not happen.", { currentQuestionIndex, questions });
      toast({ title: 'Quiz Error', description: 'Could not load the next question.', variant: 'destructive'});
      router.push('/home');
      return <CricketLoading state="error" errorMessage="There was a problem with the next question." />;
  }

  return (
    <>
      <main className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4 overflow-hidden">
        <div className="w-full max-w-2xl mx-auto">
            <QuizHeader format={format} current={currentQuestionIndex} total={questions.length} />
            <div className="flex justify-center my-6"><Timer timeLeft={timeLeft} /></div>
             <AnimatePresence mode="wait">
                <motion.div
                    key={currentQuestionIndex}
                    variants={questionVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    <QuestionCard
                        question={currentQuestion}
                        isHintVisible={isHintVisible}
                        options={currentQuestion.options}
                        selectedOption={selectedOption}
                        handleAnswerSelect={handleAnswerSelect}
                        isAnswerLocked={isAnswerLocked}
                        correctAnswer={currentQuestion.correctAnswer}
                    />
                </motion.div>
            </AnimatePresence>
            <div className="mt-6 flex justify-between items-center">
                <Button variant="outline" onClick={handleHintRequest} disabled={isHintVisible || isAnswerLocked}>
                    <Lightbulb className="mr-2" /> Get Hint (Ad)
                </Button>
                <Button onClick={() => handleAnswerSelect(selectedOption || "Not Answered")} disabled={!isAnswerLocked && selectedOption === null}>
                    {currentQuestionIndex === questions.length - 1 ? 'Finish Quiz' : 'Next'} <ChevronsRight className="ml-2" />
                </Button>
            </div>
        </div>
      </main>
      {adConfig && adConfig.adType === 'video' && <AdDialog open={!!adConfig} onAdFinished={adConfig.onFinished} duration={adConfig.duration} skippableAfter={adConfig.skippableAfter} adTitle={adConfig.adTitle} adType={adConfig.adType} adUrl={adConfig.adUrl} adHint={adConfig.adHint} />}
    </>
  );
});

export default function QuizPage() {
    return (
      <Suspense fallback={<CricketLoading message="Setting the field..." />}>
          <QuizComponent />
      </Suspense>
    )
}
    