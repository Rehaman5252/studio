
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
} from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { sanitizeQuizAttempt } from "@/lib/sanitizeUserProfile";

interface AnalysisDialogProps {
  attempt: QuizAttempt;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const AnalysisDialogComponent = ({
  attempt,
  open,
  onOpenChange,
}: AnalysisDialogProps) => {
  const [analysis, setAnalysis] = useState<Partial<QuizAnalysisOutput> | null>(null);
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
          const result = await res.json();
          const errText =
            result.analysis?.summary || "Failed to fetch analysis from server.";
          setAnalysis(result.analysis);
          setError(errText);
          return;
        }

        const data = await res.json();
        if (data.ok) {
            setAnalysis(data.analysis);
        } else {
            setError(data.analysis?.summary || "An unknown error occurred.");
            setAnalysis(data.analysis);
        }
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

    if (error && !analysis) {
      return (
        <Alert variant="destructive" className="mt-4">
          <ServerCrash className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      );
    }
    
    // Backwards compatibility: Handle both old and new schema shapes
    if (analysis) {
      const summary = analysis.summary ?? "No summary available.";
      const strengths = (analysis.strengths ?? []) as string[];
      const weaknesses = (analysis.weaknesses ?? []) as string[];
      const recommendations = (analysis.recommendations ?? []) as string[];
      const source = analysis.source;

      return (
        <div className="space-y-6">
          {source === 'fallback' && (
            <p className="text-xs text-center p-2 bg-yellow-900/50 text-yellow-300 rounded-md">
              ⚠️ AI analysis wasn’t available for this session. Showing fallback
              insights.
            </p>
          )}

          <Card className="bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart className="text-primary" /> Overall Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p>{summary}</p>
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
                  {strengths.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                  {strengths.length === 0 && (
                    <li className="text-muted-foreground">
                      No specific strengths identified.
                    </li>
                  )}
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
                  {weaknesses.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                  {weaknesses.length === 0 && (
                    <li className="text-muted-foreground">
                      No specific weaknesses identified.
                    </li>
                  )}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-primary/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-primary">
                <Lightbulb /> Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="list-disc pl-5 space-y-1 text-sm">
                {recommendations.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
                {recommendations.length === 0 && (
                  <li className="text-muted-foreground">Keep practicing!</li>
                )}
              </ul>
            </CardContent>
          </Card>
        </div>
      );
    }

    return null;
  };

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
};

export default memo(AnalysisDialogComponent);
    