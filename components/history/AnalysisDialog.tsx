
"use client";

import React, { useState, useEffect, memo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import type { QuizAttempt, QuizAnalysisOutput } from '@/ai/schemas';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  BarChart,
  Target,
  Zap,
  Lightbulb,
  Loader2,
  ServerCrash,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { sanitizeQuizAttempt } from "@/lib/sanitizeUserProfile";
import { Badge } from "@/components/ui/badge";

interface AnalysisDialogProps {
  attempt: QuizAttempt;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AnalysisDialogComponent = ({ attempt, open, onOpenChange }: AnalysisDialogProps) => {
  const [analysis, setAnalysis] = useState<QuizAnalysisOutput | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;

    const fetchAnalysis = async () => {
      setLoading(true);
      setError(null);
      setAnalysis(null);
      try {
        const res = await fetch("/api/analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attempt: sanitizeQuizAttempt(attempt) }),
        });
        
        if (!res.ok) {
           const errText = await res.text();
           throw new Error(errText || "Failed to fetch analysis from server.");
        }

        const data = await res.json();
        setAnalysis(data);

      } catch (err: any) {
        console.error("AnalysisDialog Error:", err);
        setError("Could not load AI analysis. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [open, attempt]);
  
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="animate-spin h-8 w-8 mb-4 text-primary" />
            <p className="font-semibold">Generating your analysis...</p>
            <p className="text-sm">The AI coach is reviewing the match footage.</p>
        </div>
      );
    }
    
    if (error) {
      return (
        <Alert variant="destructive" className="mt-4">
            <ServerCrash className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }

    if (analysis) {
      return (
          <div className="space-y-6">
              {analysis.source === "fallback" && (
                <p className="text-xs text-center p-2 bg-yellow-900/50 text-yellow-300 rounded-md">
                    ⚠️ AI analysis wasn’t available for this session. Showing fallback insights.
                </p>
              )}

              <Card className="bg-card/50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart className="text-primary" /> Overall Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{analysis.overallPerformance}</p>
                   <div className="grid grid-cols-2 gap-4 mt-4 text-center">
                        <div>
                            <p className="text-2xl font-bold">{analysis.accuracy.toFixed(1)}%</p>
                            <p className="text-xs text-muted-foreground">Accuracy</p>
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{analysis.averageTimePerQuestion.toFixed(1)}s</p>
                            <p className="text-xs text-muted-foreground">Avg. Time</p>
                        </div>
                    </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-500">
                      <Zap /> Key Strengths
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {analysis.keyStrengths.map((item, i) => <li key={i}>{item}</li>)}
                      {analysis.keyStrengths.length === 0 && <li className="text-muted-foreground">No specific strengths identified.</li>}
                    </ul>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-destructive">
                      <Target /> Areas for Improvement
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc pl-5 space-y-1 text-sm">
                      {analysis.areasForImprovement.map((item, i) => <li key={i}>{item}</li> )}
                      {analysis.areasForImprovement.length === 0 && <li className="text-muted-foreground">No specific weaknesses identified.</li>}
                    </ul>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-primary/10">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <Lightbulb /> Coach's Tip
                  </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm font-semibold">{analysis.coachTip}</p>
                </CardContent>
              </Card>
               <Card>
                  <CardHeader>
                      <CardTitle>Question Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                      {analysis.analyzedQuestions.map((q, i) => (
                          <div key={i} className="text-sm p-3 rounded-md bg-secondary/50 border border-border">
                              <p className="font-semibold flex items-start gap-2">
                                  {q.isCorrect 
                                      ? <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                                      : <XCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                                  }
                                  {q.question}
                              </p>
                              <div className="pl-7 text-xs text-muted-foreground mt-2 space-y-1">
                                  <p>You answered: <span className="font-semibold text-foreground">{q.userAnswer || "Not Answered"}</span></p>
                                  {!q.isCorrect && <p>Correct: <span className="font-semibold text-foreground">{q.correctAnswer}</span></p>}
                                  <div className="flex items-center gap-2 pt-1">
                                      <Badge variant="outline">{q.category}</Badge>
                                      <Badge variant="outline">{q.timeTaken.toFixed(1)}s</Badge>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </CardContent>
              </Card>
            </div>
      );
    }
    
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
          {renderContent()}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default memo(AnalysisDialogComponent);
