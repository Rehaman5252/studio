
'use client';

import React, { useMemo } from 'react';
import { Award, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthProvider';
import { HistoryItem, HistoryItemSkeleton, ErrorState } from './QuizHistoryContent';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function PerfectScoresHistory() {
  const { quizHistory } = useAuth();
  const { toast } = useToast();

  React.useEffect(() => {
    if (quizHistory.error) {
      toast({
        title: 'Network Issue',
        description: `Could not refresh history. Showing last available data.`,
        variant: 'destructive',
      });
    }
  }, [quizHistory.error, toast]);

  const perfectScores = useMemo(() => {
    return quizHistory.data.filter(attempt => attempt.score === attempt.totalQuestions && !attempt.reason);
  }, [quizHistory.data]);

  if (quizHistory.loading && perfectScores.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => <HistoryItemSkeleton key={i} />)}
      </div>
    );
  }
  
  if (!quizHistory.error && perfectScores.length === 0) {
    return (
      <Card className="bg-card/80">
        <CardContent className="p-8 text-center text-muted-foreground">
          <Award className="h-12 w-12 mx-auto mb-4 text-primary/50" />
          <p className="font-semibold text-lg text-foreground">The Honours Board is Empty</p>
          <p>No centuries on the board yet! Score a perfect 5/5 to etch your name in history and earn a certificate.</p>
        </CardContent>
      </Card>
    );
  }
  
  if (quizHistory.error && perfectScores.length === 0) {
    return <ErrorState message={quizHistory.error} />;
  }

  return (
    <div className="space-y-4">
      {quizHistory.error && (
         <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Sync Issue</AlertTitle>
            <AlertDescription>Could not refresh history. Displaying cached data.</AlertDescription>
        </Alert>
      )}
      {perfectScores.map((attempt) => (
        <HistoryItem key={attempt.slotId} attempt={attempt} />
      ))}
    </div>
  );
}
