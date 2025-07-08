
'use client';

import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';
import type { SlotAttempt } from '@/context/QuizStatusProvider';

interface StartQuizButtonProps {
    brandFormat: string;
    onClick: () => void;
    isSlotPlayed: boolean;
    lastAttempt: SlotAttempt | null;
}

const StartQuizButton = ({ brandFormat, onClick, isSlotPlayed, lastAttempt }: StartQuizButtonProps) => {
    if (isSlotPlayed) {
        const isMalpractice = lastAttempt?.reason === 'malpractice';
        const message = isMalpractice 
            ? "Malpractice was detected during this attempt." 
            : "You can play again in the next slot.";
        
        return (
            <div className="text-center mt-8 p-4 bg-muted rounded-lg border">
                <h3 className="font-bold text-lg">{isMalpractice ? 'Slot Locked' : 'Quiz Already Attempted'}</h3>
                <p className="text-muted-foreground">{message}</p>
                <Button onClick={onClick} className="mt-4" variant="secondary">
                    {isMalpractice ? 'View Details' : 'View My Scorecard'}
                </Button>
            </div>
        );
    }

    return (
        <div
            className="transition-transform hover:scale-105 active:scale-95"
        >
            <Button
                size="lg"
                variant="default"
                className="w-full mt-8 text-lg font-bold py-7 rounded-full shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all duration-300"
                onClick={onClick}
            >
                {`Start ${brandFormat} Quiz`}
                <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
        </div>
    );
};

export default memo(StartQuizButton);
