
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateCricketFacts } from '@/ai/flows/generate-cricket-fact';
import { Loader2, RefreshCw, Lightbulb } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function CricketFact({ format }: { format: string }) {
  const [facts, setFacts] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFormat, setCurrentFormat] = useState(format);
  const initialLoadDone = useRef(false);

  const getFacts = useCallback(async (fetchFormat: string, isButtonPress: boolean = false) => {
    setIsLoading(true);
    try {
      // Use previously fetched facts for the seenFacts list to ensure variety
      const seenFacts = isButtonPress ? facts : [];
      const newFacts = await generateCricketFacts({ format: fetchFormat, seenFacts });
      if (newFacts && newFacts.length > 0) {
        setFacts(newFacts);
        setCurrentIndex(0);
      } else if (!isButtonPress) {
        // Fallback for initial load failure
        setFacts(['Did you know? The first official international cricket match was played between Canada and the United States in 1844.']);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Failed to fetch cricket facts:', error);
      if (!isButtonPress) {
        setFacts(['Failed to load a fact. Please try refreshing!']);
        setCurrentIndex(0);
      }
    } finally {
      setIsLoading(false);
    }
  }, [facts]);


  useEffect(() => {
    if (!initialLoadDone.current) {
        getFacts(format);
        initialLoadDone.current = true;
    } else if (format !== currentFormat) {
      setCurrentFormat(format);
      getFacts(format);
    }
  }, [format, currentFormat, getFacts]);

  const handleAnotherFact = () => {
    const nextIndex = (currentIndex + 1);
    if (nextIndex < facts.length) {
      setCurrentIndex(nextIndex);
    } else {
      // If we've shown all the facts from the current batch, fetch a new one.
      getFacts(format, true);
    }
  };
  
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
