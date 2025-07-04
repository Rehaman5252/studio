'use client';

import { useQuizStatus } from '@/context/QuizStatusProvider';
import { formatTime } from '@/lib/utils';

export default function LiveInfo() {
  const { timeLeft, playersPlaying } = useQuizStatus();
  return (
    <>
      Quiz ends in: {formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)} • Players: {playersPlaying.toLocaleString()}
    </>
  );
}
