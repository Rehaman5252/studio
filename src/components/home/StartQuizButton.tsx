
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, Loader2, Eye } from 'lucide-react';

interface StartQuizButtonProps {
    brandFormat: string;
    onClick: () => void;
    isDisabled?: boolean;
    hasPlayed?: boolean;
}

const StartQuizButton = ({ brandFormat, onClick, isDisabled = false, hasPlayed = false }: StartQuizButtonProps) => {
    
    const text = hasPlayed ? "View Your Scorecard" : `Start ${brandFormat} Quiz`;
    const Icon = hasPlayed ? Eye : ChevronRight;
    
    return (
        <div
            className="transition-transform hover:scale-105 active:scale-95"
        >
            <Button
                size="lg"
                variant={hasPlayed ? "secondary" : "default"}
                className="w-full mt-8 text-lg font-bold py-7 rounded-full shadow-lg hover:shadow-primary/40 transition-all duration-300"
                onClick={onClick}
                disabled={isDisabled}
            >
                {isDisabled ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Checking Status...
                    </>
                ) : (
                    <>
                        {text}
                        <Icon className="ml-2 h-5 w-5" />
                    </>
                )}
            </Button>
        </div>
    );
};

export default React.memo(StartQuizButton);
