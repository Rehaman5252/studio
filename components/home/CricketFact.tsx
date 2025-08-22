
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateCricketFacts } from '@/ai/flows/generate-cricket-fact';
import { Loader2, RefreshCw, Lightbulb } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function CricketFact({ format }: { format: string }) {
  const [facts, setFacts] = useState<string[]>(['Did you know? The first official international cricket match was played between Canada and the United States in 1844.']);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const formatRef = useRef(format);

  const getFacts = useCallback(async (currentFormat: string) => {
    // Only set loading true if we are fetching for the very first time.
    if (facts.length <= 1 && facts[0].includes('Canada')) {
        setIsLoading(true);
    }
    
    try {
      const newFacts = await generateCricketFacts({ format: currentFormat, seenFacts: facts });
      if (newFacts && newFacts.length > 0) {
        setFacts(newFacts);
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Failed to fetch cricket facts:', error);
    } finally {
      setIsLoading(false);
    }
  }, [facts]);


  useEffect(() => {
    // Fetch facts only when the format actually changes or on initial load.
    if (format !== formatRef.current || (isLoading && facts[0].includes('Canada'))) {
        formatRef.current = format;
        getFacts(format);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format]);

  const handleAnotherFact = () => {
    if (facts.length > 0) {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % facts.length);
    }
  };
  
  const factToDisplay = facts[currentIndex] || '';

  return (
    <Card className="bg-card/80 shadow-lg border border-primary">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="text-primary"/>
            Dressing Room Banter
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="min-h-[60px] flex items-center justify-center text-center">
            <AnimatePresence mode="wait">
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
            </AnimatePresence>
        </div>
        <div className="flex justify-center mt-4">
          <Button variant="default" size="sm" onClick={handleAnotherFact} disabled={isLoading && facts.length <= 1}>
            {isLoading && facts.length <=1 ? (
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
