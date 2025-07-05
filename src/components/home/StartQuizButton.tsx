
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { ChevronRight } from 'lucide-react';

interface StartQuizButtonProps {
    brandFormat: string;
    onClick: () => void;
}

const StartQuizButton = ({ brandFormat, onClick }: StartQuizButtonProps) => {
    return (
        <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
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
        </motion.div>
    );
};

export default StartQuizButton;
