
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateCricketFacts } from '@/ai/flows/generate-cricket-fact';
import { Loader2, RefreshCw, Lightbulb } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { allFallbackQuestions, shuffleArray } from '@/lib/fallback-quiz';
import { logger } from '@/app/lib/logger';

const getRobustFallbackFacts = (format: string): string[] => {
    if (!Array.isArray(allFallbackQuestions)) {
        logger.warn("allFallbackQuestions not available for getFallbackFacts");
        return ["Cricket is a bat-and-ball game played between two teams of eleven players."];
    }
    const key = format.toLowerCase();
    let questionsForFormat = allFallbackQuestions.filter(q => q.format === key);

    // If no specific facts, default to mixed, ensuring there's always a fallback
    if (questionsForFormat.length === 0) {
        questionsForFormat = allFallbackQuestions.filter(q => q.format === 'mixed');
    }

    // If still no facts, return a hardcoded default
    if (questionsForFormat.length === 0) {
        return ["The first official international cricket match was held in 1844 between USA and Canada."];
    }
    
    return shuffleArray(questionsForFormat).map(q => q.explanation).slice(0, 10);
}

export default function CricketFact({ format }: { format: string }) {
    const [facts, setFacts] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [currentFormat, setCurrentFormat] = useState(format);

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
            const seen = isInitial ? [] : facts;
            let newFacts = await generateCricketFacts({ format: fetchFormat, count: 5, seenFacts: seen });
            
            if (!newFacts || newFacts.length === 0) {
                logger.warn('AI returned no facts, using robust fallback.', { format: fetchFormat });
                newFacts = getRobustFallbackFacts(fetchFormat);
            }
            
            setFacts(prev => {
                const uniqueNewFacts = newFacts.filter(f => !prev.includes(f));
                return isInitial ? uniqueNewFacts : [...prev, ...uniqueNewFacts];
            });

        } catch (error) {
            logger.error('Failed to fetch cricket facts, using robust fallback.', { error, format: fetchFormat });
            setFacts(prev => {
                const fallbackFacts = getRobustFallbackFacts(fetchFormat);
                const uniqueFallbackFacts = fallbackFacts.filter(f => !prev.includes(f));
                return isInitial ? uniqueFallbackFacts : [...prev, ...uniqueFallbackFacts];
            });
        } finally {
            setIsFetching(false);
            if (isInitial) {
                setIsLoading(false);
                setCurrentIndex(0);
            }
        }
    }, [isFetching]);

    // Effect to fetch facts when the format changes
    useEffect(() => {
        fetchFacts(currentFormat, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentFormat]);


    const handleAnotherFact = () => {
        const nextIndex = currentIndex + 1;
        
        // If we are near the end of the list, fetch more facts in the background.
        if (facts && nextIndex >= facts.length - 2 && !isFetching) {
            fetchFacts(currentFormat);
        }
        
        // If we are at the end, loop back to the start. Otherwise, go to the next fact.
        if (facts && nextIndex >= facts.length) {
            setCurrentIndex(0);
        } else {
            setCurrentIndex(nextIndex);
        }
    };
    
    const factToDisplay = !isLoading && facts?.length > 0 ? facts[currentIndex] : '';

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
                    <Button variant="default" size="sm" onClick={handleAnotherFact} disabled={isLoading || (isFetching && currentIndex >= facts.length -1) }>
                        {(isLoading || (isFetching && currentIndex >= facts.length -1)) ? (
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
