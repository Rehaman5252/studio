'use client';

import { useQuizStatus } from '@/context/QuizStatusProvider';

export default function TotalWinnersStat() {
  const { totalWinners } = useQuizStatus();
  return <p className="text-2xl font-bold">{totalWinners.toLocaleString()}</p>;
}
