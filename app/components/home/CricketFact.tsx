'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateCricketFacts } from '@/ai/flows/generate-cricket-fact';
import { Loader2, RefreshCw, Lightbulb } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { allFallbackQuestions, shuffleArray } from '@/lib/fallback-quiz';
import { logger } from '@/app/lib/logger';
import { fallbackFacts } from '@/app/lib/fallback-facts';
import { cn } from '@/lib/utils';

const getRobustFallbackFacts = (format: string): string[] => {
    const key = format.toLowerCase();
    let questionsForFormat = allFallbackQuestions.filter(q => q.format === key);

    if (questionsForFormat.length > 0) {
        return shuffleArray(questionsForFormat).map(q => q.explanation).slice(0, 10);
    }
    
    questionsForFormat = allFallbackQuestions.filter(q => q.format === 'mixed');
    if (questionsForFormat.length > 0) {
        return shuffleArray(questionsForFormat).map(q => q.explanation).slice(0, 10);
    }

    if (fallbackFacts.length > 0) {
        return shuffleArray([...fallbackFacts]).slice(0, 10);
    }

    return ["The first official international cricket match was held in 1844 between USA and Canada."];
}

export default function CricketFact({ format }: { format: string }) {
    const [facts, setFacts] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [currentFormat, setCurrentFormat] = useState(format);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    useEffect(() => {
        if (format !== currentFormat) {
            setCurrentFormat(format);
        }
    }, [format, currentFormat]);

    const fetchFacts = useCallback(async (fetchFormat: string) => {
        if (!isMounted.current) return;
        setIsLoading(true);

        try {
            let newFacts = await generateCricketFacts({ format: fetchFormat, count: 5, seenFacts: [] });
            
            if (!newFacts || newFacts.length === 0) {
                logger.warn('AI returned no facts, using robust fallback.', { format: fetchFormat });
                newFacts = getRobustFallbackFacts(fetchFormat);
            }
            
            if (isMounted.current) {
                setFacts(newFacts);
            }

        } catch (error) {
            logger.error('Failed to fetch cricket facts, using robust fallback.', { error, format: fetchFormat });
            if (isMounted.current) {
                setFacts(getRobustFallbackFacts(fetchFormat));
            }
        } finally {
            if (isMounted.current) {
                setIsLoading(false);
                setCurrentIndex(0);
            }
        }
    }, []);

    useEffect(() => {
        fetchFacts(currentFormat);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentFormat]);


    const handleAnotherFact = () => {
        if (facts.length === 0) return;
        setCurrentIndex(prevIndex => (prevIndex + 1) % facts.length);
    };
    
    const factToDisplay =
      !isLoading && facts?.length > 0
        ? facts[currentIndex] ?? "Here’s a quirky cricket fact coming up next!"
        : "Fetching a fun cricket fact...";

    return (
        <Card className="bg-card/80 shadow-lg border border-primary">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="text-primary"/>
                    Dressing Room Banter
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="min-h-[60px] flex items-center justify-center text-center px-2">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div
                                key="loader"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center justify-center h-full"
                            >
                                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                            </motion.div>
                        ) : (
                            <motion.p
                                key={factToDisplay}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                transition={{ duration: 0.3 }}
                                className="text-sm text-muted-foreground"
                            >
                                {factToDisplay}
                            </motion.p>
                        )}
                    </AnimatePresence>
                </div>
                <div className="flex justify-center mt-4">
                    <Button 
                        variant="default" 
                        size="sm" 
                        onClick={handleAnotherFact} 
                        disabled={isLoading}
                    >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Next Delivery
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
