
'use client';

import { memo } from 'react';
import { Progress } from '@/components/ui/progress';

const QuizHeaderComponent = ({ format, current, total }: { format: string, current: number, total: number }) => {
    const progressValue = ((current + 1) / total) * 100;
    return (
        <header className="w-full max-w-2xl mx-auto mb-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold">{format} Quiz</h1>
            <p className="font-semibold">{current + 1} / {total}</p>
          </div>
          <Progress value={progressValue} className="h-2 [&>div]:bg-primary" />
        </header>
    );
};
QuizHeaderComponent.displayName = 'QuizHeader';

export const QuizHeader = memo(QuizHeaderComponent);
