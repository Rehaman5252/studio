
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateCricketFacts } from '@/ai/flows/generate-cricket-fact';
import { Loader2, RefreshCw, Lightbulb } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function CricketFact({ format }: { format: string }) {
  const [currentFacts, setCurrentFacts] = useState<string[]>(['Did you know? The first official international cricket match was played between Canada and the United States in 1844.']);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const getFacts = async (currentFormat: string) => {
      setIsLoading(true);
      try {
        const newFacts = await generateCricketFacts({ format: currentFormat, seenFacts: [] });
        if (newFacts && newFacts.length > 0) {
          setCurrentFacts(newFacts);
          setCurrentFactIndex(0);
        }
      } catch (error) {
        console.error('Failed to fetch cricket facts:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    getFacts(format);
  }, [format]);

  const handleAnotherFact = () => {
    if (currentFacts.length > 0) {
      setCurrentFactIndex((prevIndex) => (prevIndex + 1) % currentFacts.length);
    }
  };
  
  const factToDisplay = currentFacts[currentFactIndex] || '';

  return (
    <Card className="bg-card/80 border-primary/10 shadow-lg">
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
          <Button variant="secondary" size="sm" onClick={handleAnotherFact} disabled={isLoading || currentFacts.length < 2}>
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
