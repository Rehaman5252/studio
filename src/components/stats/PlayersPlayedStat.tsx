'use client';

import { useQuizStatus } from '@/context/QuizStatusProvider';

export default function PlayersPlayedStat() {
  const { playersPlayed } = useQuizStatus();
  return <p className="text-2xl font-bold">{playersPlayed.toLocaleString()}</p>;
}
