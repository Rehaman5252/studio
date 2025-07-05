'use client';

import { useQuizStatus } from '@/context/QuizStatusProvider';
import { formatTime } from '@/lib/utils';

export default function TimerStat() {
  const { timeLeft } = useQuizStatus();
  return (
    <span className="text-2xl font-bold text-primary">
      {formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
    </span>
  );
}
