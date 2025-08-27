
"use client";

import React, { useState, useEffect, ReactNode } from "react";
import {
  Dialog,
  DialogTrigger,
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
} from 'lucide-react';
import { Loader2 } from 'lucide-react';

const AnalysisSkeleton = () => (
    <div className="space-y-4">
        <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="animate-spin h-8 w-8 mb-4" />
            <p className="font-semibold">Generating your analysis...</p>
            <p className="text-sm">The AI coach is reviewing the match footage.</p>
        </div>
    </div>
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

  useEffect(() => {
    if (!isOpen) return;

    const fetchAnalysis = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ attempt }),
        });
        
        if (!res.ok) {
          throw new Error("Failed to fetch analysis from server.");
        }

        const data = await res.json();
        setAnalysis(data);

      } catch (err: any) {
        console.error("AnalysisDialog Error:", err);
        setError("Could not load analysis. Please try again later.");
        // Set a fallback analysis to display in case of error
        setAnalysis({
          summary: "Analysis unavailable. Please try again later.",
          strengths: [],
          weaknesses: [],
          recommendations: [],
          source: "fallback",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalysis();
  }, [isOpen, attempt]);

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
             <div className="text-red-500 text-center py-10">{error}</div>
          ) : (
            analysis && (
              <div className="space-y-6">
                 {analysis.source === "fallback" && (
                    <p className="text-xs text-center p-2 bg-yellow-900/50 text-yellow-300 rounded-md">
                        ⚠️ AI analysis was unavailable for this session, showing fallback insights.
                    </p>
                )}

                <Card className="bg-card/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart className="text-primary" /> Match Report
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p>{analysis.summary}</p>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-500">
                        <Zap /> Strengths
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {analysis.strengths.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                         {analysis.strengths.length === 0 && <li className="text-muted-foreground">No specific strengths identified.</li>}
                      </ul>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-destructive">
                        <Target /> Weaknesses
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc pl-5 space-y-1 text-sm">
                        {analysis.weaknesses.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                        {analysis.weaknesses.length === 0 && <li className="text-muted-foreground">No specific weaknesses identified.</li>}
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
                        {analysis.recommendations.map((item, i) => (
                            <li key={i}>{item}</li>
                        ))}
                         {analysis.recommendations.length === 0 && <li className="text-muted-foreground">Keep practicing!</li>}
                     </ul>
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
