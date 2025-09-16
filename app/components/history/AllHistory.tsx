
'use client';

import React from 'react';
import { Award } from 'lucide-react';
import { useAuth } from '@/context/AuthProvider';
import { HistoryItem, HistoryItemSkeleton, ErrorStateDisplay } from './QuizHistoryContent';
import { EmptyState } from '../EmptyState';

export default function AllHistory() {
  const { quizHistory } = useAuth();

  if (quizHistory.loading && quizHistory.data.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => <HistoryItemSkeleton key={i} />)}
      </div>
    );
  }

  if (quizHistory.error) {
    return <ErrorStateDisplay message={quizHistory.error} />;
  }

  if (quizHistory.data.length === 0) {
    return (
        <EmptyState 
            Icon={Award}
            title="No History Yet!"
            description="Your past quizzes will appear here once you've played a game."
        />
    );
  }

  return (
    <div className="space-y-4">
      {quizHistory.data.map((attempt) => (
        <HistoryItem key={`${attempt.slotId}-${attempt.format}`} attempt={attempt} />
      ))}
    </div>
  );
}
