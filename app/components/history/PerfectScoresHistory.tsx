
'use client';

import React, { useMemo } from 'react';
import { Award } from 'lucide-react';
import { useAuth } from '@/context/AuthProvider';
import { HistoryItem, HistoryItemSkeleton, ErrorState } from './QuizHistoryContent';
import { Card, CardContent } from '@/components/ui/card';

export default function PerfectScoresHistory() {
  const { quizHistory } = useAuth();

  const perfectScores = useMemo(() => {
    return quizHistory.data.filter(attempt => attempt.score === attempt.totalQuestions && !attempt.reason);
  }, [quizHistory.data]);

  if (quizHistory.loading) {
    return (
        <div className="space-y-4">
            {[...Array(3)].map((_, i) => <HistoryItemSkeleton key={i} />)}
        </div>
    );
  }

  if (quizHistory.error) {
    return <ErrorState message={quizHistory.error} />;
  }
  
  if (perfectScores.length === 0) {
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
  
  return (
      <div className="space-y-4">
        {perfectScores.map((attempt) => (
          <HistoryItem key={attempt.slotId} attempt={attempt} />
        ))}
      </div>
  );
}
