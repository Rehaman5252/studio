
'use client';

import { Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Award, BarChart, Home, Sparkles, Cpu, BookOpen } from 'lucide-react';
import type { QuizAttempt } from '@/ai/schemas';
import ReportQuestionDialog from '@/components/quiz/ReportQuestionDialog';
import PageWrapper from '@/components/PageWrapper';
import AnalysisDialog from '@/components/history/AnalysisDialog';
import { Badge } from '@/components/ui/badge';

const ResultsContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const attemptData = searchParams.get('attempt');

  const attempt: QuizAttempt | null = useMemo(() => {
    if (!attemptData) return null;
    try {
      return JSON.parse(atob(attemptData));
    } catch (e) {
      console.error("Failed to parse attempt data:", e);
      return null;
    }
  }, [attemptData]);

  if (!attempt) {
    return (
        <PageWrapper title="Error">
            <div className="flex flex-col items-center justify-center text-center p-4">
                <h2 className="text-2xl font-bold text-destructive">Could Not Load Quiz Results</h2>
                <p className="text-muted-foreground">There was an error retrieving your scorecard.</p>
                <Button onClick={() => router.push('/home')} className="mt-4">
                Return to Home
                </Button>
            </div>
        </PageWrapper>
    );
  }

  const timeTaken = attempt.timePerQuestion?.reduce((a, b) => a + b, 0) || 0;
  const isPerfectScore = attempt.score === attempt.totalQuestions;
  const isDisqualified = !!attempt.reason;

  const pageTitle = isDisqualified ? "Disqualified" : isPerfectScore ? "Perfect Score!" : "Quiz Complete";

  return (
    <PageWrapper title={pageTitle} showBackButton>
      <Card className="text-center shadow-lg">
        <CardHeader>
          {isPerfectScore ? (
            <>
              <Award className="h-16 w-16 mx-auto text-yellow-400 animate-pulse" />
              <CardTitle className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">Perfect Score!</CardTitle>
            </>
          ) : (
            <CardTitle className="text-3xl font-bold">{isDisqualified ? 'Disqualified (No-Ball)' : 'Quiz Complete!'}</CardTitle>
          )}
          <CardDescription className="text-lg">{isDisqualified ? 'Malpractice was detected.' : 'You scored'}</CardDescription>
          {!isDisqualified && (
            <p className="text-5xl font-bold">{attempt.score}<span className="text-3xl text-muted-foreground">/{attempt.totalQuestions}</span></p>
          )}
           {attempt.source && (
            <div className="flex justify-center pt-2">
                <Badge variant="secondary" className="font-normal">
                    {attempt.source === 'ai' ? <Cpu className="h-3 w-3 mr-1.5"/> : <BookOpen className="h-3 w-3 mr-1.5"/>}
                    {attempt.source === 'ai' ? 'AI Generated Quiz' : 'Classic Quiz'}
                </Badge>
            </div>
           )}
        </CardHeader>
        <CardContent className="flex justify-center gap-4 text-sm text-muted-foreground">
            <div><strong>Format:</strong> {attempt.format}</div>
             {!isDisqualified && (<div><strong>Time:</strong> {timeTaken.toFixed(1)}s</div>)}
        </CardContent>
      </Card>
      
       {!isDisqualified && (
         <div className="space-y-4">
            <AnalysisDialog attempt={attempt}>
                <Button variant="secondary" size="lg" className="w-full">
                    <Sparkles className="mr-2 h-5 w-5" />
                    View AI Performance Analysis
                </Button>
            </AnalysisDialog>
        </div>
       )}


      <div className="space-y-4">
        <h3 className="text-xl font-bold text-center">Answer Review</h3>
        {attempt.questions.map((question, index) => (
          <Card key={question.id} className="bg-card/50">
            <CardHeader>
              <CardTitle className="text-base font-semibold">{index + 1}. {question.question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm space-y-2">
                <p className="flex items-center gap-2">
                  {attempt.userAnswers[index] === question.correctAnswer ? 
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" /> : 
                    <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                  }
                  <span>Your Answer: {attempt.userAnswers[index] || "Not Answered"}</span>
                </p>
                <p className="flex items-center gap-2">
                   <Award className="h-5 w-5 text-primary flex-shrink-0" />
                   <span>Correct Answer: {question.correctAnswer}</span>
                </p>
              </div>
              <Card className="bg-background/70 p-3">
                <p className="text-xs text-muted-foreground font-semibold">EXPLANATION</p>
                <p className="text-sm">{question.explanation}</p>
              </Card>
               <div className="pt-2 flex justify-center">
                <ReportQuestionDialog questionId={question.id} questionText={question.question} />
               </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 justify-center pt-4">
        <Button size="lg" onClick={() => router.push('/leaderboard')}>
            <BarChart className="mr-2" /> View Leaderboard
        </Button>
        <Button size="lg" variant="outline" onClick={() => router.push('/home')}>
           <Home className="mr-2" /> Play Again
        </Button>
      </div>
    </PageWrapper>
  );
};


export default function QuizResultsPage() {
    return (
        <Suspense fallback={<div>Loading results...</div>}>
            <ResultsContent />
        </Suspense>
    )
}
