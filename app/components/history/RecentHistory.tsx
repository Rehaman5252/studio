
'use client';

import React, { useMemo } from 'react';
import { Award } from 'lucide-react';
import { useAuth } from '@/context/AuthProvider';
import { HistoryItem, HistoryItemSkeleton, ErrorState } from './QuizHistoryContent';
import { Card, CardContent } from '@/components/ui/card';

export default function RecentHistory() {
  const { quizHistory } = useAuth();
  
  const recentAttempts = useMemo(() => {
    return quizHistory.data.slice(0, 5);
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
  
  if (recentAttempts.length === 0) {
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
  
  return (
      <div className="space-y-4">
        {recentAttempts.map((attempt) => (
          <HistoryItem key={attempt.slotId} attempt={attempt} />
        ))}
      </div>
  );
}
