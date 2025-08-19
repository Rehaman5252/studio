
'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, BarChart } from 'lucide-react';

interface StartQuizButtonProps {
    brandFormat: string;
    onClick: () => void;
    isDisabled: boolean;
    hasPlayed: boolean;
}

const StartQuizButton = ({ brandFormat, onClick, isDisabled, hasPlayed }: StartQuizButtonProps) => {
    return (
        <div className="w-full">
             <Button 
                size="lg" 
                className="w-full h-16 rounded-full text-xl font-bold shadow-lg"
                onClick={onClick}
                disabled={isDisabled}
             >
                {hasPlayed ? (
                    <>
                        <BarChart className="mr-2" /> View Results
                    </>
                ) : (
                    <>
                        Start {brandFormat} Quiz <ArrowRight className="ml-2"/>
                    </>
                )}
            </Button>
        </div>
    );
};

export default memo(StartQuizButton);
