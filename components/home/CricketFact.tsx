
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateCricketFacts } from '@/ai/flows/generate-cricket-fact';
import { Loader2, RefreshCw, Lightbulb } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { fallbackQuizData } from '@/lib/fallback-quiz';

const getFallbackFacts = (format: string) => {
    const key = format.toLowerCase();
    const quiz = fallbackQuizData[key] || fallbackQuizData.mixed;
    return quiz.questions.map(q => q.explanation);
}

export default function CricketFact({ format }: { format: string }) {
    const [facts, setFacts] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isFetching, setIsFetching] = useState(false);
    const [currentFormat, setCurrentFormat] = useState(format);

    const fetchFacts = useCallback(async (fetchFormat: string) => {
        if (isFetching) return;
        setIsFetching(true);
        try {
            const newFacts = await generateCricketFacts({ format: fetchFormat, seenFacts: facts });
            setFacts(prev => [...prev, ...newFacts]);
        } catch (error) {
            console.error('Failed to fetch cricket facts:', error);
            // Add fallback facts if AI fails to prevent running out
            setFacts(prev => [...prev, ...getFallbackFacts(fetchFormat)]);
        } finally {
            setIsFetching(false);
        }
    }, [facts, isFetching]);

    // Initial load and format change effect
    useEffect(() => {
        const loadInitialFacts = async () => {
            setIsLoading(true);
            setCurrentFormat(format);
            try {
                const initialFacts = await generateCricketFacts({ format, seenFacts: [] });
                setFacts(initialFacts);
            } catch (e) {
                console.error("Initial fact fetch failed, using fallback", e);
                setFacts(getFallbackFacts(format));
            } finally {
                setIsLoading(false);
                setCurrentIndex(0);
            }
        };
        loadInitialFacts();
    }, [format]);

    const handleAnotherFact = () => {
        const nextIndex = currentIndex + 1;
        
        // If we are about to run out of facts, fetch more in the background
        if (facts.length > 0 && nextIndex >= facts.length - 3) {
            fetchFacts(currentFormat);
        }

        if (nextIndex < facts.length) {
            setCurrentIndex(nextIndex);
        } else {
            // If we are completely out, show loader and wait for fetch
            setIsLoading(true);
            fetchFacts(currentFormat).then(() => {
                // After fetching, if we have new facts, update index.
                // This logic might need adjustment if fetchFacts updates state async.
                // For now, we assume the facts state will be updated.
                // The useEffect watching `facts` will handle the index reset.
            });
        }
    };
    
    // Effect to handle switching index when facts list updates
    useEffect(() => {
        if (facts.length > 0 && isLoading) {
            setIsLoading(false);
        }
        if (facts.length > 0 && currentIndex >= facts.length) {
             setCurrentIndex(0);
        }
    }, [facts, currentIndex, isLoading]);

    const factToDisplay = !isLoading && facts.length > 0 ? facts[currentIndex] : '';

    return (
        <Card className="bg-card/80 shadow-lg border border-primary">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="text-primary"/>
                    Dressing Room Banter
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="min-h-[40px] flex items-center justify-center text-center">
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
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
                    <Button variant="default" size="sm" onClick={handleAnotherFact} disabled={isLoading}>
                        {isLoading ? (
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
