
'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { generateHint } from '@/ai/flows/ai-powered-hints';
import { reportQuestion } from '@/ai/flows/report-question-flow';
import type { QuizQuestion } from '@/lib/mockData';
import { adLibrary, interstitialAds } from '@/lib/ads';
import { getQuizSlotId } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Flag, Lightbulb, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { AdDialog } from '@/components/AdDialog';
import InterstitialLoader from '@/components/InterstitialLoader';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import CricketLoading from '@/components/CricketLoading';
import { Textarea } from '@/components/ui/textarea';

type QuizState = 'loading' | 'active' | 'answered' | 'completed' | 'error';

const ReportDialog = ({ question }: { question: QuizQuestion }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [reason, setReason] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSubmitReport = async () => {
    if (!reason || !user) {
      toast({ title: 'Please select a reason.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await reportQuestion({
        questionId: question.id,
        questionText: question.question,
        reason,
        comment,
        userId: user.uid,
      });
      if (result.success) {
        toast({ title: "Report Submitted", description: result.message });
        setIsOpen(false);
      } else {
        throw new Error(result.message);
      }
    } catch (e: any) {
      toast({ title: "Submission Failed", description: e.message, variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="mt-2 text-xs text-muted-foreground"><Flag className="mr-2 h-3 w-3" /> Report Question</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
          <DialogDescription>Let us know what's wrong with this question. Your feedback helps us improve.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm font-medium bg-muted p-2 rounded-md">"{question.question}"</p>
          <RadioGroup value={reason} onValueChange={setReason}>
            <div className="flex items-center space-x-2"><RadioGroupItem value="incorrect_answer" id="r1" /><Label htmlFor="r1">The correct answer is wrong.</Label></div>
            <div className="flex items-center space-x-2"><RadioGroupItem value="typo_grammar" id="r2" /><Label htmlFor="r2">There's a typo or grammar error.</Label></div>
            <div className="flex items-center space-x-2"><RadioGroupItem value="unclear_question" id="r3" /><Label htmlFor="r3">The question is confusing or unclear.</Label></div>
            <div className="flex items-center space-x-2"><RadioGroupItem value="other" id="r4" /><Label htmlFor="r4">Other</Label></div>
          </RadioGroup>
          <Textarea placeholder="Optional: Add more details..." value={comment} onChange={(e) => setComment(e.target.value)} />
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
          <Button onClick={handleSubmitReport} disabled={isSubmitting || !reason}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};


function QuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading, addQuizAttempt, handleMalpractice } = useAuth();
  const { toast } = useToast();

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [timePerQuestion, setTimePerQuestion] = useState<number[]>([]);
  const [usedHintIndices, setUsedHintIndices] = useState<number[]>([]);
  
  const [quizState, setQuizState] = useState<QuizState>('loading');
  const [error, setError] = useState<string | null>(null);
  
  const [hint, setHint] = useState('');
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [showAd, setShowAd] = useState<any>(null);
  const [showInterstitialAd, setShowInterstitialAd] = useState<any>(null);
  const [isInterstitial, setIsInterstitial] = useState(false);

  const format = searchParams.get('format') || 'Mixed';
  const brand = searchParams.get('brand') || 'Default Brand';
  const questionTimerRef = useRef<NodeJS.Timeout | null>(null);
  const questionStartTimeRef = useRef<number>(0);
  
  const fetchQuestions = useCallback(async (userId: string) => {
    setQuizState('loading');
    setError(null);
    try {
      const response = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, userId }),
      });

      if (!response.ok) {
        throw new Error(`API responded with ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      if (data && data.questions && data.questions.length > 0) {
        setQuestions(data.questions);
        setQuizState('active');
      } else {
        throw new Error('Failed to load quiz questions.');
      }
    } catch (e: any) {
      console.error("Fetch Questions Error:", e);
      setError('Could not start the quiz. Please try again.');
      setQuizState('error');
    }
  }, [format]);

  useEffect(() => {
    if (!authLoading) {
      if (user) {
        fetchQuestions(user.uid);
      } else {
        router.replace(`/auth/login?from=/quiz?format=${format}`);
      }
    }
  }, [user, authLoading, format, fetchQuestions, router]);

  const handleVisibilityChange = useCallback(async () => {
    if (document.hidden && quizState === 'active') {
      const newCount = await handleMalpractice();

      const attempt = {
        slotId: getQuizSlotId(),
        brand,
        format,
        score: userAnswers.filter((ans, i) => ans === questions[i]?.correctAnswer).length,
        totalQuestions: questions.length,
        questions: questions,
        userAnswers: userAnswers,
        timestamp: Date.now(),
        reason: `malpractice_${newCount}` as const,
      };

      await addQuizAttempt(attempt);

      const attemptDataString = btoa(JSON.stringify(attempt));
      router.replace(`/quiz/results?malpractice=true&attempt=${encodeURIComponent(attemptDataString)}`);
    }
  }, [quizState, handleMalpractice, brand, format, userAnswers, questions, addQuizAttempt, router]);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [handleVisibilityChange]);

  const startQuestionTimer = useCallback(() => {
    questionStartTimeRef.current = Date.now();
    questionTimerRef.current = setTimeout(() => {
      handleAnswer('Timed Out');
    }, 15000);
  }, []);

  useEffect(() => {
    if (quizState === 'active') {
      startQuestionTimer();
    }
    return () => {
      if (questionTimerRef.current) clearTimeout(questionTimerRef.current);
    };
  }, [currentQuestionIndex, quizState, startQuestionTimer]);

  const handleAnswer = (answer: string) => {
    if (quizState !== 'active') return;
    if (questionTimerRef.current) clearTimeout(questionTimerRef.current);

    const timeTaken = (Date.now() - questionStartTimeRef.current) / 1000;
    setTimePerQuestion(prev => [...prev, timeTaken]);
    setUserAnswers(prev => [...prev, answer]);
    setQuizState('answered');
    setHint('');

    setTimeout(() => {
      const nextQuestionIndex = currentQuestionIndex + 1;
      const interstitialAd = interstitialAds[currentQuestionIndex];
      
      if (nextQuestionIndex < questions.length) {
        if (interstitialAd) {
          setShowInterstitialAd(interstitialAd);
          setIsInterstitial(true);
        } else {
          setCurrentQuestionIndex(nextQuestionIndex);
          setQuizState('active');
        }
      } else {
        setQuizState('completed');
        setShowAd({ ...adLibrary.resultsAd, onAdFinished: handleQuizCompletion });
      }
    }, 2000);
  };
  
  const handleInterstitialFinished = () => {
      setShowInterstitialAd(null);
      setIsInterstitial(false);
      setCurrentQuestionIndex(prev => prev + 1);
      setQuizState('active');
  }

  const handleHint = async () => {
    if (!questions[currentQuestionIndex]) return;

    setShowAd({
      ...adLibrary.hintAds[currentQuestionIndex],
      onAdFinished: async () => {
        setShowAd(null);
        setIsHintLoading(true);
        try {
          const res = await generateHint({
            question: questions[currentQuestionIndex].question,
            format: format,
          });
          setHint(res.hint);
          setUsedHintIndices(prev => [...prev, currentQuestionIndex]);
        } catch (e) {
          setHint("Hint not available right now. Try again later.");
        } finally {
          setIsHintLoading(false);
        }
      }
    });
  };

  const handleQuizCompletion = useCallback(async () => {
    setShowAd(null);
    if (!user || questions.length === 0) return;

    const finalScore = userAnswers.filter((ans, i) => ans === questions[i].correctAnswer).length;

    const attempt = {
      slotId: getQuizSlotId(),
      brand,
      format,
      score: finalScore,
      totalQuestions: questions.length,
      questions,
      userAnswers,
      timestamp: Date.now(),
      timePerQuestion,
      usedHintIndices,
    };

    await addQuizAttempt(attempt);

    const attemptDataString = btoa(JSON.stringify(attempt));
    router.push(`/quiz/results?attempt=${encodeURIComponent(attemptDataString)}`);
  }, [user, questions, userAnswers, timePerQuestion, usedHintIndices, brand, format, addQuizAttempt, router]);

  const renderContent = () => {
    switch (quizState) {
      case 'loading':
        return <CricketLoading message="Warming up the bowlers..." format={format} />;
      case 'error':
        return <CricketLoading state="error" errorMessage={error || 'A fielding error occurred.'}><Button onClick={() => router.push('/home')}>Go Home</Button></CricketLoading>;
      case 'active':
      case 'answered':
        const question = questions[currentQuestionIndex];
        if (!question) return <CricketLoading state="error" errorMessage="Question not found." />;
        const userAnswer = userAnswers[currentQuestionIndex];
        const isAnswered = quizState === 'answered';

        return (
          <div className="w-full max-w-2xl mx-auto p-4 flex flex-col justify-between h-full">
            <div>
              <div className="flex justify-between items-center mb-2 text-sm">
                <span className="font-semibold">Question {currentQuestionIndex + 1}/{questions.length}</span>
                <span className="text-muted-foreground">{format} Quiz</span>
              </div>
              <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="mb-4 h-2" />
              <Card className="bg-card/80 border-primary/20 shadow-lg">
                <CardContent className="p-6">
                  <p className="text-lg font-semibold leading-relaxed text-center">{question.question}</p>
                </CardContent>
              </Card>

              <div className="mt-6 space-y-3">
                <AnimatePresence>
                  <RadioGroup
                    key={currentQuestionIndex}
                    onValueChange={handleAnswer}
                    disabled={isAnswered}
                    className="space-y-3"
                  >
                    {question.options.map((option, index) => {
                      const isCorrect = option === question.correctAnswer;
                      const isSelected = option === userAnswer;
                      
                      let variant = 'outline';
                      if (isAnswered) {
                        if (isCorrect) variant = 'correct';
                        else if (isSelected && !isCorrect) variant = 'incorrect';
                      }

                      return (
                        <motion.div
                          key={option}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <Label
                             htmlFor={`option-${index}`}
                             className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-all duration-300
                               ${variant === 'correct' ? 'bg-green-500/20 border-green-500 text-foreground' : ''}
                               ${variant === 'incorrect' ? 'bg-destructive/20 border-destructive text-foreground' : ''}
                               ${variant === 'outline' ? 'bg-card border-border hover:border-primary' : ''}
                             `}
                          >
                            <RadioGroupItem value={option} id={`option-${index}`} className="sr-only" />
                            <span className="flex-1 font-medium">{option}</span>
                            {isAnswered && (isCorrect || isSelected) && <span className="text-2xl">{isCorrect ? '✅' : '❌'}</span>}
                          </Label>
                        </motion.div>
                      );
                    })}
                  </RadioGroup>
                </AnimatePresence>
              </div>

              {isAnswered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-muted rounded-lg text-sm"
                >
                  <strong className="text-primary">Explanation:</strong> {question.explanation}
                   <ReportDialog question={question} />
                </motion.div>
              )}
            </div>

            <div className="mt-8 flex justify-end">
              <Button onClick={handleHint} disabled={isAnswered || usedHintIndices.includes(currentQuestionIndex) || isHintLoading}>
                {isHintLoading ? <Loader2 className="animate-spin mr-2" /> : <Lightbulb className="mr-2" />}
                Get Hint
              </Button>
            </div>

            {hint && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 bg-primary/20 rounded-lg text-sm text-center"
              >
                <strong className="text-primary">Hint:</strong> {hint}
              </motion.div>
            )}
          </div>
        );

      case 'completed':
        return <CricketLoading message="Calculating your final score..." />;

      default:
        return <CricketLoading state="error" errorMessage="Something went wrong." />;
    }
  };
  
  if (authLoading) {
    return <CricketLoading message="Authenticating..." />;
  }

  if (isInterstitial) {
      if (showInterstitialAd.type === 'static') {
          return <InterstitialLoader logoUrl={showInterstitialAd.logoUrl!} logoHint={showInterstitialAd.logoHint!} duration={showInterstitialAd.durationMs} onComplete={handleInterstitialFinished} />;
      } else if (showInterstitialAd.type === 'video') {
          return <AdDialog open={true} onAdFinished={handleInterstitialFinished} duration={showInterstitialAd.durationSec!} skippableAfter={showInterstitialAd.skippableAfterSec!} adTitle={showInterstitialAd.videoTitle!} adType="video" adUrl={showInterstitialAd.videoUrl!} />;
      }
  }

  return (
    <main className="flex flex-col min-h-screen bg-background text-foreground">
      {renderContent()}
      {showAd && quizState !== 'completed' && <AdDialog open={!!showAd} {...showAd} />}
    </main>
  );
}

// Wrap with Suspense because useSearchParams() is used
export default function QuizPageWithSuspense() {
  return (
    <Suspense fallback={<CricketLoading message="Setting the field..." />}>
      <QuizPage />
    </Suspense>
  );
}
