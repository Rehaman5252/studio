
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateCricketFacts } from '@/ai/flows/generate-cricket-fact';
import { Loader2, RefreshCw, Lightbulb } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function CricketFact({ format }: { format: string }) {
  const [facts, setFacts] = useState<string[]>([]);
  const [currentFactIndex, setCurrentFactIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getFacts = async (currentFormat: string) => {
      setLoading(true);
      try {
        const newFacts = await generateCricketFacts({ format: currentFormat, seenFacts: [] });
        setFacts(newFacts && newFacts.length > 0 ? newFacts : ['Did you know? The first official international cricket match was played between Canada and the United States in 1844.']);
        setCurrentFactIndex(0);
      } catch (error) {
        console.error('Failed to fetch cricket facts:', error);
        setFacts(['Did you know? The first official international cricket match was played between Canada and the United States in 1844.']);
        setCurrentFactIndex(0);
      } finally {
        setLoading(false);
      }
    };
    
    getFacts(format);
  }, [format]);

  const handleAnotherFact = () => {
    if (facts && facts.length > 0) {
      setCurrentFactIndex((prevIndex) => (prevIndex + 1) % facts.length);
    }
  };
  
  const currentFact = (facts && facts.length > 0) ? facts[currentFactIndex] : '';

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
                    key={currentFact}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-sm text-muted-foreground"
                >
                    {loading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : currentFact}
                </motion.p>
            </AnimatePresence>
        </div>
        <div className="flex justify-center mt-4">
          <Button variant="secondary" size="sm" onClick={handleAnotherFact} disabled={loading || !facts || facts.length < 2}>
            {loading ? (
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
