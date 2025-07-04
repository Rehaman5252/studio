'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { generateQuiz, type GenerateQuizOutput } from '@/ai/flows/generate-quiz-flow';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

const Timer = ({ timeLeft }: { timeLeft: number }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = (timeLeft / 20) * circumference;

  return (
    <div className="relative h-28 w-28">
      <svg className="h-full w-full" viewBox="0 0 100 100">
        <circle
          className="stroke-current text-white/20"
          strokeWidth="10"
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
        />
        <circle
          className="stroke-current text-accent transition-all duration-1000 linear"
          strokeWidth="10"
          strokeLinecap="round"
          cx="50"
          cy="50"
          r={radius}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - strokeDashoffset}
          transform="rotate(-90 50 50)"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-3xl font-bold text-white">{timeLeft}</span>
      </div>
    </div>
  );
};

function QuizComponent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const brand = searchParams.get('brand') || 'CricBlitz';
  const format = searchParams.get('format') || 'Cricket';

  const [questions, setQuestions] = useState<GenerateQuizOutput>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setLoading(true);
        const quizQuestions = await generateQuiz({ format, brand });
        if (!quizQuestions || quizQuestions.length < 5) {
            throw new Error('Failed to generate a complete quiz.');
        }
        setQuestions(quizQuestions);
      } catch (e) {
        setError('Could not fetch quiz questions. Please try again later.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchQuestions();
  }, [format, brand]);

  const goToNextQuestion = () => {
    setSelectedOption(null);
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setTimeLeft(20);
    } else {
      const finalAnswers = [...userAnswers, selectedOption || ''];
       const score = finalAnswers.reduce((acc, answer, index) => {
          if (index < questions.length && answer === questions[index].correctAnswer) {
            return acc + 1;
          }
          return acc;
      }, 0);
      router.replace(`/quiz/results?score=${score}&total=${questions.length}&brand=${brand}&format=${format}`);
    }
  };

  useEffect(() => {
    if (loading || questions.length === 0 || selectedOption) return;

    if (timeLeft > 0) {
      const timerId = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timerId);
    } else {
      setUserAnswers((prev) => [...prev, '']); // Timed out
      goToNextQuestion();
    }
  }, [timeLeft, loading, questions.length, selectedOption]);

  const handleAnswerSelect = (option: string) => {
    if (selectedOption) return;

    setSelectedOption(option);
    setUserAnswers((prev) => [...prev, option]);
    
    setTimeout(() => {
      goToNextQuestion();
    }, 500);
  };
  
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-primary to-green-400 text-white p-4">
        <Loader2 className="h-12 w-12 animate-spin mb-4" />
        <p className="text-xl">Generating your {format} quiz...</p>
        <p>This might take a moment.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-destructive text-destructive-foreground p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Oops! Something went wrong.</h1>
        <p>{error}</p>
        <Button onClick={() => router.push('/home')} className="mt-6">Go Home</Button>
      </div>
    );
  }

  if (questions.length === 0) {
    return null;
  }
  
  const currentQuestion = questions[currentQuestionIndex];
  const progressValue = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-primary to-green-400 text-white p-4">
      <header className="w-full max-w-2xl mx-auto mb-4">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-xl font-bold">{format} Quiz</h1>
          <p className="font-semibold">{currentQuestionIndex + 1} / {questions.length}</p>
        </div>
        <Progress value={progressValue} className="h-2 [&>div]:bg-accent" />
      </header>

      <main className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
        <div className="mb-8">
          <Timer timeLeft={timeLeft} />
        </div>

        <Card className="w-full bg-white/10 border-0">
          <CardHeader>
            <CardTitle className="text-xl md:text-2xl leading-tight">
              {currentQuestion.questionText}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentQuestion.options.map((option, index) => (
              <Button
                key={index}
                onClick={() => handleAnswerSelect(option)}
                disabled={!!selectedOption}
                className={`
                  w-full h-auto py-4 text-base whitespace-normal justify-start text-left
                  bg-white/20 hover:bg-white/30 text-white
                  ${selectedOption === option ? 'ring-4 ring-accent' : ''}
                  ${selectedOption && selectedOption !== option ? 'opacity-50' : ''}
                `}
              >
                <span className="font-bold mr-4">{String.fromCharCode(65 + index)}</span>
                <span>{option}</span>
              </Button>
            ))}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-primary to-green-400 text-white p-4">
            <Loader2 className="h-12 w-12 animate-spin" />
        </div>
    }>
      <QuizComponent />
    </Suspense>
  )
}
