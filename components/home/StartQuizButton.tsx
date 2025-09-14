
'use client';

import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { BarChart, Play } from 'lucide-react';
import { motion } from 'framer-motion';

interface StartQuizButtonProps {
    brandFormat: string;
    onClick: () => void;
    isDisabled: boolean;
    hasPlayed: boolean;
}

const StartQuizButtonComponent = ({ brandFormat, onClick, isDisabled, hasPlayed }: StartQuizButtonProps) => {
    return (
        <motion.div 
            className="w-full"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
        >
             <Button 
                size="lg" 
                variant="default"
                className="w-full h-14 rounded-full text-xl font-bold shadow-lg shadow-primary/20 transition-all duration-300 ease-in-out animate-glow"
                onClick={onClick}
                disabled={isDisabled}
             >
                {hasPlayed ? (
                    <>
                        <BarChart className="mr-2" /> View Results
                    </>
                ) : (
                    <>
                       <Play className="mr-2 fill-current" /> Start {brandFormat} Quiz
                    </>
                )}
            </Button>
        </motion.div>
    );
};

export default memo(StartQuizButtonComponent);
