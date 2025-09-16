'use client';

import React from 'react';
import { Award, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthProvider';
import { HistoryItem, HistoryItemSkeleton, ErrorState } from './QuizHistoryContent';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

export default function AllHistory() {
  const { quizHistory } = useAuth();

  if (quizHistory.loading && quizHistory.data.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => <HistoryItemSkeleton key={i} />)}
      </div>
    );
  }

  if (!quizHistory.error && quizHistory.data.length === 0) {
    return (
      <Card className="bg-card/80">
        <CardContent className="p-8 text-center text-muted-foreground">
          <Award className="h-12 w-12 mx-auto mb-4 text-primary/50" />
          <p className="font-semibold text-lg text-foreground">No History Yet!</p>
          <p>Your past quizzes will appear here once you've played a game.</p>
        </CardContent>
      </Card>
    );
  }

  // Handle case where there's an error but no cached data
  if (quizHistory.error && quizHistory.data.length === 0) {
    return <ErrorState message={quizHistory.error} />;
  }

  return (
    <div className="space-y-4">
      {quizHistory.error && (
         <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Sync Issue</AlertTitle>
            <AlertDescription>{quizHistory.error}</AlertDescription>
        </Alert>
      )}
      {quizHistory.data.map((attempt) => (
        <HistoryItem key={`${attempt.slotId}-${attempt.format}`} attempt={attempt} />
      ))}
    </div>
  );
}
