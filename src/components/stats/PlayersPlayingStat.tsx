'use client';

import { useQuizStatus } from '@/context/QuizStatusProvider';

export default function PlayersPlayingStat() {
  const { playersPlaying } = useQuizStatus();
  return <p className="text-2xl font-bold">{playersPlaying.toLocaleString()}</p>;
}
