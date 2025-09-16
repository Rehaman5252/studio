'use client';

import React, { useMemo } from 'react';
import { Award } from 'lucide-react';
import { useAuth } from '@/context/AuthProvider';
import { HistoryItem, HistoryItemSkeleton, ErrorStateDisplay } from './QuizHistoryContent';
import { EmptyState } from '../EmptyState';

export default function PerfectScoresHistory() {
  const { quizHistory } = useAuth();

  const perfectScores = useMemo(() => {
    return quizHistory.data.filter(attempt => attempt.score === attempt.totalQuestions && !attempt.reason);
  }, [quizHistory.data]);

  if (quizHistory.loading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => <HistoryItemSkeleton key={i} />)}
      </div>
    );
  }
  
  if (quizHistory.error) {
    return <ErrorStateDisplay message={quizHistory.error} />;
  }

  if (perfectScores.length === 0) {
    return (
        <EmptyState 
            Icon={Award}
            title="The Honours Board is Empty"
            description="No centuries on the board yet! Score a perfect 5/5 to etch your name in history."
        />
    );
  }

  return (
    <div className="space-y-4">
      {perfectScores.map((attempt) => (
        <HistoryItem key={`${attempt.slotId}-${attempt.format}`} attempt={attempt} />
      ))}
    </div>
  );
}
