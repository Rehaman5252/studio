
'use client';

import { memo } from 'react';
import { formatTime } from '@/lib/utils';

interface TimerStatProps {
  timeLeft: {
    minutes: number;
    seconds: number;
  };
}

const TimerStat = ({ timeLeft }: TimerStatProps) => {
  return (
    <span className="text-2xl font-bold">
      {formatTime(timeLeft.minutes)}:{formatTime(timeLeft.seconds)}
    </span>
  );
}

export default memo(TimerStat);
