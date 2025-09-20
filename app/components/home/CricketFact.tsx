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

const getRobustFallbackFacts = (format: string): string[] => {
    // 1. Try format-specific questions from the main fallback quiz file.
    const key = format.toLowerCase();
    let questionsForFormat = allFallbackQuestions.filter(q => q.format === key);

    if (questionsForFormat.length > 0) {
        return shuffleArray(questionsForFormat).map(q => q.explanation).slice(0, 10);
    }
    
    // 2. If none, try 'mixed' format questions.
    questionsForFormat = allFallbackQuestions.filter(q => q.format === 'mixed');
    if (questionsForFormat.length > 0) {
        return shuffleArray(questionsForFormat).map(q => q.explanation).slice(0, 10);
    }

    // 3. If still none, use the new global list of funny facts.
    if (fallbackFacts.length > 0) {
        return shuffleArray([...fallbackFacts]).slice(0, 10);
    }

    // 4. Absolute last resort hardcoded fact.
    return ["The first official international cricket match was held in 1844 between USA and Canada."];
}

export default function CricketFact({ format }: { format: string }) {
    const [facts, setFacts] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [currentFormat, setCurrentFormat] = useState(format);
    const isMounted = useRef(true);

    useEffect(() => {
        isMounted.current = true;
        return () => {
            isMounted.current = false;
        };
    }, []);

    // Sync internal state with parent prop
    useEffect(() => {
        if (format !== currentFormat) {
            setCurrentFormat(format);
            // This will trigger the next effect to fetch new facts
        }
    }, [format, currentFormat]);

    const fetchFacts = useCallback(async (fetchFormat: string, isInitial = false) => {
        if (isFetching) return;
        
        setIsFetching(true);
        if (isInitial) {
             setIsLoading(true);
        }

        try {
            const seen = isInitial ? [] : await new Promise<string[]>(resolve => setFacts(prev => { resolve(prev); return prev; }));
            let newFacts = await generateCricketFacts({ format: fetchFormat, count: 10, seenFacts: seen });
            
            if (!newFacts || newFacts.length === 0) {
                logger.warn('AI returned no facts, using robust fallback.', { format: fetchFormat });
                newFacts = getRobustFallbackFacts(fetchFormat);
            }
            
            if (isMounted.current) {
                const uniqueNewFacts = newFacts.filter(f => !facts.includes(f));
                setFacts(isInitial ? uniqueNewFacts : [...facts, ...uniqueNewFacts]);
            }

        } catch (error) {
            logger.error('Failed to fetch cricket facts, using robust fallback.', { error, format: fetchFormat });
            if (isMounted.current) {
                const fallback = getRobustFallbackFacts(fetchFormat);
                const uniqueFallback = fallback.filter(f => !facts.includes(f));
                setFacts(isInitial ? uniqueFallback : [...facts, ...uniqueFallback]);
            }
        } finally {
            if (isMounted.current) {
                setIsFetching(false);
                if (isInitial) {
                    setIsLoading(false);
                    setCurrentIndex(0);
                }
            }
        }
    }, [isFetching, facts]);

    // Effect to fetch facts when the format changes
    useEffect(() => {
        fetchFacts(currentFormat, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentFormat]);


    const handleAnotherFact = () => {
        const nextIndex = currentIndex + 1;
        
        // If we have facts and are at the end, loop back to the start.
        if (facts && nextIndex >= facts.length) {
            // If we're out of facts and not already fetching, get more.
            if (!isFetching) {
                fetchFacts(currentFormat);
            }
            setCurrentIndex(0);
        } else {
            setCurrentIndex(nextIndex);
        }
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
                        {isLoading && facts.length === 0 ? (
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
                    <Button variant="default" size="sm" onClick={handleAnotherFact} disabled={isLoading || (isFetching && currentIndex >= facts.length -1) }>
                        {(isFetching && currentIndex >= facts.length -1) ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <RefreshCw className="mr-2 h-4 w-4" />
                        )}
                        Next Delivery
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
