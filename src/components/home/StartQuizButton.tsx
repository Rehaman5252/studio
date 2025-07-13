
'use client';

import React, { memo } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronRight, Loader2 } from 'lucide-react';

interface StartQuizButtonProps {
    brandFormat: string;
    onClick: () => void;
    isDisabled?: boolean;
}

const StartQuizButton = ({ brandFormat, onClick, isDisabled = false }: StartQuizButtonProps) => {
    return (
        <div
            className="transition-transform hover:scale-105 active:scale-95"
        >
            <Button
                size="lg"
                variant="default"
                className="w-full mt-8 text-lg font-bold py-7 rounded-full shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all duration-300"
                onClick={onClick}
                disabled={isDisabled}
            >
                {isDisabled ? (
                    <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        <span>Deciding Fate...</span>
                    </>
                ) : (
                    <>
                        {`Start ${brandFormat} Quiz`}
                        <ChevronRight className="ml-2 h-5 w-5" />
                    </>
                )}
            </Button>
        </div>
    );
};

export default memo(StartQuizButton);
