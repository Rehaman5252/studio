'use client';

import React, { useMemo } from 'react';
import { Award, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthProvider';
import { HistoryItem, HistoryItemSkeleton, ErrorStateDisplay } from './QuizHistoryContent';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { EmptyState } from '../EmptyState';

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
    return <ErrorStateDisplay message={quizHistory.error} />;
  }
  
  if (recentAttempts.length === 0) {
     return (
        <EmptyState 
            Icon={Award}
            title="No Recent History!"
            description="Your most recent quizzes will appear here once you've played."
        />
    );
  }

  return (
    <div className="space-y-4">
      {recentAttempts.map((attempt) => (
        <HistoryItem key={`${attempt.slotId}-${attempt.format}`} attempt={attempt} />
      ))}
    </div>
  );
}
