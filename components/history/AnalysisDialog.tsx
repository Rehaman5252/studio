
"use client";

import React, { useState, useEffect, ReactNode, useCallback } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { QuizAttempt } from '@/ai/schemas';
import { QuizAnalysisOutput } from '@/ai/flows/generate-quiz-analysis';
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
  Info,
  Loader2
} from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { CricketLoading } from '../CricketLoading';
import { cn } from '@/lib/utils';

const AnalysisSkeleton = () => (
    <div className="space-y-4">
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="animate-spin h-8 w-8 mb-4" />
            <p className="font-semibold">Generating your analysis...</p>
            <p className="text-sm">The AI coach is reviewing the match footage.</p>
        </div>
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

export default function AnalysisDialog({ attempt, children }: AnalysisDialogProps) {
  const [analysis, setAnalysis] = useState<QuizAnalysisOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const getAnalysis = useCallback(async () => {
    if (!isOpen) return;
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempt }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch analysis from server.');
      }
      
      setAnalysis(result);
    } catch (e: any) {
      console.error('Error generating quiz analysis:', e);
      setError('Could not generate AI analysis at this time. Please try again later.');
      setAnalysis({
          overallPerformance: "Analysis service is temporarily unavailable.",
          accuracy: 0,
          averageTimePerQuestion: 0,
          keyStrengths: [],
          areasForImprovement: [],
          coachTip: "Please try again in a few moments.",
          analyzedQuestions: [],
          source: "fallback",
      });
    } finally {
      setLoading(false);
    }
  }, [attempt, isOpen]);

  useEffect(() => {
    if (isOpen && !analysis && !loading && !error) {
      getAnalysis();
    }
  }, [isOpen, analysis, loading, error, getAnalysis]);

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
          ) : (
            analysis && (
              <div className="space-y-6">
                {analysis.source === 'fallback' && (
                  <Alert variant="default" className="bg-blue-950/50 border-blue-500/30">
                    <Info className="h-4 w-4 text-blue-400" />
                    <AlertTitle className="text-blue-300">Standard Analysis</AlertTitle>
                    <AlertDescription className="text-blue-400/80">
                       This is a fallback analysis. The AI coach was unavailable, but here is a standard performance review.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="grid grid-cols-3 gap-4">
                  <StatCard
                    title="Final Score"
                    value={`${attempt.score}/${attempt.totalQuestions}`}
                  />
                  <StatCard title="Accuracy" value={analysis.accuracy} unit="%" />
                  <StatCard
                    title="Avg Time"
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
