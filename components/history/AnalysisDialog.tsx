"use client";

import React, { useState, useEffect, ReactNode } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import type { QuizAttempt } from '@/ai/schemas';
import {
  generateQuizAnalysis,
  QuizAnalysisOutput,
} from '@/ai/flows/generate-quiz-analysis';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertTriangle,
  BarChart,
  Target,
  Zap,
  Lightbulb,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CricketLoading } from '../CricketLoading';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

const AnalysisSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="text-center text-sm text-muted-foreground">
      <p>Analyzing your performance...</p>
    </div>
    <CricketLoading />
    <div className="grid grid-cols-3 gap-4">
      <div className="h-24 w-full bg-muted rounded-lg" />
      <div className="h-24 w-full bg-muted rounded-lg" />
      <div className="h-24 w-full bg-muted rounded-lg" />
    </div>
    <div className="h-24 w-full bg-muted rounded-lg" />
    <div className="grid md:grid-cols-2 gap-4">
      <div className="h-32 w-full bg-muted rounded-lg" />
      <div className="h-32 w-full bg-muted rounded-lg" />
    </div>
    <div className="h-20 w-full bg-muted rounded-lg" />
  </div>
);

const StatCard = ({
  title,
  value,
  unit,
}: {
  title: string;
  value: string | number;
  unit?: string;
}) => (
  <Card className="text-center">
    <CardHeader className="pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent>
      <p className="text-3xl font-bold">
        {value}
        {unit && <span className="text-lg font-normal">{unit}</span>}
      </p>
    </CardContent>
  </Card>
);

interface AnalysisDialogProps {
  attempt: QuizAttempt;
  children: ReactNode;
}

// Simple in-memory cache for the session to avoid re-generating on re-open.
const analysisCache = new Map<string, QuizAnalysisOutput>();

export default function AnalysisDialog({ attempt, children }: AnalysisDialogProps) {
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<QuizAnalysisOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const getAnalysis = useCallback(async () => {
    const attemptId = attempt.slotId || attempt.timestamp.toString();

    if (analysisCache.has(attemptId)) {
      const cached = analysisCache.get(attemptId)!;
      setAnalysis(cached);
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const result = await generateQuizAnalysis(attempt);

      if (!result) {
        throw new Error('Analysis returned an empty or invalid response.');
      }

      analysisCache.set(attemptId, result);
      setAnalysis(result);
    } catch (e: any) {
      console.error('Error generating quiz analysis:', e);
      setError('Could not generate AI analysis at this time. Please try again later.');
      toast({
        title: 'Error',
        description: 'An unexpected error occurred while generating the analysis.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [attempt, toast]);

  useEffect(() => {
    if (isOpen && !analysis && !loading) {
      getAnalysis();
    }
  }, [isOpen, analysis, loading, getAnalysis]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Third Umpire Review
          </DialogTitle>
          <DialogDescription className="text-center">
            A detailed debrief of your {attempt.format} innings.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-4 -mr-4 space-y-6 py-4">
          {loading ? (
            <AnalysisSkeleton />
          ) : error ? (
            <Alert variant="destructive" className="my-4">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Review Unavailable</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : (
            analysis && (
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <StatCard
                    title="Final Score"
                    value={`${attempt.score}/${attempt.totalQuestions}`}
                  />
                  <StatCard title="Accuracy" value={analysis.accuracy} unit="%" />
                  <StatCard
                    title="Strike Rate"
                    value={analysis.averageTimePerQuestion.toFixed(1)}
                    unit="s/q"
                  />
                </div>

                <Card className="bg-card/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart className="text-primary" /> Match Report
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{analysis.overallPerformance}</p>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-500">
                        <Zap /> Power Plays
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {analysis.keyStrengths.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-destructive">
                        <Target /> Net Practice
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {analysis.areasForImprovement.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-primary/10">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-primary">
                      <Lightbulb /> Coach's Corner
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{analysis.coachTip}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Ball-by-Ball</CardTitle>
                    <CardDescription>
                      A detailed look at each delivery.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[10px]">Ball</TableHead>
                            <TableHead>Your Shot</TableHead>
                            <TableHead>Time</TableHead>
                            <TableHead>Line & Length</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {analysis.analyzedQuestions.map((q, i) => (
                            <TableRow
                              key={i}
                              className={cn(
                                q.isCorrect ? 'bg-green-500/10' : 'bg-destructive/10'
                              )}
                            >
                              <TableCell className="font-medium">{i + 1}</TableCell>
                              <TableCell>
                                <div className="flex items-center gap-2">
                                  {q.isCorrect ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                                  ) : (
                                    <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                                  )}
                                  <div className="flex flex-col text-xs">
                                    <span
                                      className={cn(
                                        'break-all',
                                        q.isCorrect ? '' : 'line-through text-muted-foreground'
                                      )}
                                    >
                                      {q.userAnswer || 'Skipped'}
                                    </span>
                                    {!q.isCorrect && (
                                      <span className="break-all">
                                        Correct: {q.correctAnswer}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>{q.timeTaken.toFixed(1)}s</TableCell>
                              <TableCell>
                                <Badge variant="secondary">{q.category}</Badge>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
