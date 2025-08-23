
'use client';

import { useState, useEffect } from 'react';
import { generateCricketFacts } from '@/ai/flows/generate-cricket-fact';
import { fallbackQuizData } from '@/lib/fallback-quiz';
import { CricketLoading } from '../CricketLoading';
import { Progress } from '../ui/progress';
import { AnimatePresence, motion } from 'framer-motion';

const DURATION = 5000; // 5 seconds
const FACT_INTERVAL = DURATION / 5; // Show 5 facts in total

const getFallbackFacts = (format: string): string[] => {
    const key = format.toLowerCase();
    const quiz = fallbackQuizData[key] || fallbackQuizData.mixed;
    return quiz.questions.map(q => q.explanation);
}

interface PreQuizLoaderProps {
    format: string;
    onFinish: () => void;
}

export default function PreQuizLoader({ format, onFinish }: PreQuizLoaderProps) {
    const [facts, setFacts] = useState<string[]>([]);
    const [currentFactIndex, setCurrentFactIndex] = useState(0);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        const fetchFacts = async () => {
            try {
                const newFacts = await generateCricketFacts({ format, seenFacts: [] });
                setFacts(newFacts && newFacts.length > 0 ? newFacts : getFallbackFacts(format));
            } catch (error) {
                console.error('Failed to fetch facts for pre-loader:', error);
                setFacts(getFallbackFacts(format));
            }
        };
        fetchFacts();
    }, [format]);

    useEffect(() => {
        if (facts.length === 0) return;

        const factTimer = setInterval(() => {
            setCurrentFactIndex(prev => (prev + 1) % facts.length);
        }, FACT_INTERVAL);

        const progressTimer = setInterval(() => {
            setProgress(p => p + 100 / (DURATION / 50));
        }, 50);

        const mainTimer = setTimeout(() => {
            onFinish();
        }, DURATION);

        return () => {
            clearInterval(factTimer);
            clearInterval(progressTimer);
            clearTimeout(mainTimer);
        };
    }, [facts, onFinish]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8 text-center">
            <CricketLoading />
            <h2 className="text-2xl font-bold text-primary mt-4">Getting the Pitch Ready...</h2>
            <p className="text-muted-foreground mt-2 mb-8">Here are some facts that might help you in the quiz!</p>
            
            <div className="h-20 w-full max-w-lg flex items-center justify-center">
                <AnimatePresence mode="wait">
                    {facts.length > 0 && (
                         <motion.p
                            key={currentFactIndex}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.5 }}
                            className="text-lg italic text-foreground"
                        >
                           "{facts[currentFactIndex]}"
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
            
            <Progress value={progress} className="w-full max-w-sm mt-8 h-2" />
        </div>
    );
}
