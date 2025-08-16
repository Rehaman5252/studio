
'use client';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { CricketLoading } from '@/components/CricketLoading';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { getAIPoweredHint } from '@/ai/flows/ai-powered-hints';
import { AdDialog } from '@/components/AdDialog';
import { Lightbulb, Loader2 } from 'lucide-react';
import type { QuizData, QuizQuestion } from '@/ai/schemas';
import { getQuizSlotId } from '@/lib/utils';
import { adLibrary, interstitialAds, InterstitialAdConfig } from '@/lib/ads';
import InterstitialLoader from '@/components/InterstitialLoader';

interface QuizClientProps {
  brand: string;
  format: string;
}

export default function QuizClient({ brand, format }: QuizClientProps) {
  const router = useRouter();
  const { user, addQuizAttempt, handleMalpractice } = useAuth();
  const { toast } = useToast();

  const [quizData, setQuizData] = useState<QuizData | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(15);
  const [isAnswered, setIsAnswered] = useState(false);
  const [timePerQuestion, setTimePerQuestion] = useState<number[]>([]);
  const [isHintLoading, setIsHintLoading] = useState(false);
  const [showAdForHint, setShowAdForHint] = useState(false);
  const [interstitialAdConfig, setInterstitialAdConfig] = useState<InterstitialAdConfig | null>(null);
  const [isInterstitialVisible, setIsInterstitialVisible] = useState(false);
  const [hintedQuestions, setHintedQuestions] = useState<Set<string>>(new Set());

  const currentQuestion = useMemo(() => quizData?.questions[currentQuestionIndex], [quizData, currentQuestionIndex]);

  // Fetch quiz data
  useEffect(() => {
    const fetchQuiz = async () => {
      if (!user) {
        toast({ title: 'Not authenticated', description: 'Please login to play.', variant: 'destructive' });
        router.push('/auth/login');
        return;
      }
      try {
        const response = await fetch('/api/quiz', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ format, userId: user.uid }),
        });
        if (!response.ok) throw new Error('Failed to fetch quiz');
        const data = await response.json();
        setQuizData(data);
      } catch (error) {
        console.error("Quiz fetch error:", error);
        toast({ title: 'Error', description: 'Could not load the quiz. Please try again.', variant: 'destructive' });
        router.push('/home');
      }
    };
    fetchQuiz();
  }, [format, router, toast, user]);

  const handleNextQuestion = useCallback(() => {
    setIsAnswered(false);
    setSelectedOption(null);
    setTimeLeft(15);
    setTimePerQuestion(prev => [...prev, 15 - timeLeft]);
    setUserAnswers(prev => [...prev, selectedOption || '']);

    const nextQuestionIndex = currentQuestionIndex + 1;

    // Check for interstitial ad
    if (interstitialAds[currentQuestionIndex]) {
        setInterstitialAdConfig(interstitialAds[currentQuestionIndex]);
        setIsInterstitialVisible(true);
        // The onComplete of the ad will trigger the navigation to the next question
    } else {
        if (nextQuestionIndex < (quizData?.questions.length || 0)) {
            setCurrentQuestionIndex(nextQuestionIndex);
        } else {
            // This is the end of the quiz
        }
    }
  }, [currentQuestionIndex, quizData?.questions.length, selectedOption, timeLeft]);

  const proceedToNextQuestionOrEnd = useCallback(async () => {
      const nextQuestionIndex = currentQuestionIndex + 1;
      if (nextQuestionIndex < (quizData?.questions.length || 0)) {
          setCurrentQuestionIndex(nextQuestionIndex);
      } else {
          // Quiz finished, save results
          const finalAnswers = [...userAnswers, selectedOption || ''];
          const finalTimePerQuestion = [...timePerQuestion, 15 - timeLeft];
          let score = 0;
          quizData?.questions.forEach((q, i) => {
              if (finalAnswers[i] === q.correctAnswer) {
                  score++;
              }
          });

          const attempt = {
              userId: user!.uid,
              slotId: getQuizSlotId(),
              brand,
              format,
              questions: quizData!.questions,
              userAnswers: finalAnswers,
              score,
              totalQuestions: quizData!.questions.length,
              timestamp: Date.now(),
              timePerQuestion: finalTimePerQuestion,
          };
          
          await addQuizAttempt(attempt);

          const attemptDataString = btoa(JSON.stringify(attempt));
          router.push(`/quiz/results?attempt=${encodeURIComponent(attemptDataString)}`);
      }
  }, [currentQuestionIndex, quizData, userAnswers, selectedOption, timePerQuestion, timeLeft, addQuizAttempt, brand, format, router, user]);

  useEffect(() => {
    if (isInterstitialVisible) return; // Don't run timers if ad is showing

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleNextQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestionIndex, isInterstitialVisible, handleNextQuestion]);

  const handleOptionSelect = (value: string) => {
    if (isAnswered) return;
    setIsAnswered(true);
    setSelectedOption(value);
    // Automatically move to the next question after a short delay
    setTimeout(handleNextQuestion, 1000);
  };

  const getHint = async () => {
    if (!currentQuestion || hintedQuestions.has(currentQuestion.id)) return;
    setIsHintLoading(true);
    try {
        const hint = await getAIPoweredHint({
            question: currentQuestion.question,
            options: currentQuestion.options,
            correctAnswer: currentQuestion.correctAnswer,
        });
        toast({
            title: 'AI Hint ✨',
            description: hint,
        });
        setHintedQuestions(prev => new Set(prev).add(currentQuestion.id));
    } catch (error) {
        console.error("Hint error:", error);
        toast({ title: 'Error', description: 'Could not get a hint.', variant: 'destructive' });
    } finally {
        setIsHintLoading(false);
    }
  };
  
  const handleAdForHintFinished = () => {
    setShowAdForHint(false);
    getHint();
  };
  
  const handleInterstitialComplete = () => {
    setIsInterstitialVisible(false);
    setInterstitialAdConfig(null);
    proceedToNextQuestionOrEnd();
  };

  if (!quizData || !currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <CricketLoading />
      </div>
    );
  }

  if (isInterstitialVisible && interstitialAdConfig) {
      if (interstitialAdConfig.type === 'static' && interstitialAdConfig.logoUrl && interstitialAdConfig.durationMs) {
           return (
            <InterstitialLoader 
                logoUrl={interstitialAdConfig.logoUrl}
                logoHint={interstitialAdConfig.logoHint || 'brand logo'}
                duration={interstitialAdConfig.durationMs}
                onComplete={handleInterstitialComplete}
            />
           )
      } else if (interstitialAdConfig.type === 'video' && interstitialAdConfig.videoUrl) {
          return (
             <AdDialog
                open={true}
                onAdFinished={handleInterstitialComplete}
                duration={interstitialAdConfig.durationSec!}
                skippableAfter={interstitialAdConfig.skippableAfterSec!}
                adTitle={interstitialAdConfig.videoTitle!}
                adType="video"
                adUrl={interstitialAdConfig.videoUrl}
            />
          )
      }
  }


  const getOptionVariant = (option: string) => {
    if (!isAnswered) return 'outline';
    if (option === currentQuestion.correctAnswer) return 'default';
    if (option === selectedOption) return 'destructive';
    return 'outline';
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-secondary p-4">
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader>
          <div className="flex justify-between items-center mb-4">
            <CardTitle>Question {currentQuestionIndex + 1}/{quizData.questions.length}</CardTitle>
            <div className="text-lg font-bold bg-primary text-primary-foreground rounded-full h-10 w-10 flex items-center justify-center">
              {timeLeft}
            </div>
          </div>
          <Progress value={((currentQuestionIndex + 1) / quizData.questions.length) * 100} className="w-full" />
          <p className="text-center font-semibold text-lg mt-6">{currentQuestion.question}</p>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={selectedOption || undefined}
            onValueChange={handleOptionSelect}
            className="grid grid-cols-1 gap-3"
            disabled={isAnswered}
          >
            {currentQuestion.options.map((option, index) => (
              <Button
                key={index}
                variant={getOptionVariant(option)}
                size="lg"
                className="justify-start h-auto py-3 whitespace-normal text-left"
                onClick={() => handleOptionSelect(option)}
                disabled={isAnswered}
              >
                <RadioGroupItem value={option} id={`option-${index}`} className="mr-3" />
                <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">{option}</Label>
              </Button>
            ))}
          </RadioGroup>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button
            variant="ghost"
            onClick={() => setShowAdForHint(true)}
            disabled={isHintLoading || hintedQuestions.has(currentQuestion.id)}
          >
            {isHintLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Lightbulb className="mr-2 h-4 w-4" />
            )}
            {hintedQuestions.has(currentQuestion.id) ? 'Hint Used' : 'Get AI Hint'}
          </Button>
        </CardFooter>
      </Card>
      
      <AdDialog
          open={showAdForHint}
          onAdFinished={handleAdForHintFinished}
          duration={adLibrary.hintAds[currentQuestionIndex].duration}
          skippableAfter={adLibrary.hintAds[currentQuestionIndex].skippableAfter}
          adTitle={adLibrary.hintAds[currentQuestionIndex].title}
          adType={adLibrary.hintAds[currentQuestionIndex].type}
          adUrl={adLibrary.hintAds[currentQuestionIndex].url}
          adHint={adLibrary.hintAds[currentQuestionIndex].hint}
      />
    </div>
  );
}
