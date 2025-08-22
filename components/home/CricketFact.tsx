
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

  const getFacts = useCallback(async (currentFormat: string) => {
    setLoading(true);
    try {
      // Pass the current list of facts to avoid repetition if AI is called again.
      const newFacts = await generateCricketFacts({ format: currentFormat, seenFacts: facts });
      setFacts(newFacts);
      setCurrentFactIndex(0);
    } catch (error) {
      console.error('Failed to fetch cricket facts:', error);
      // Set a default fact in case of an error, to prevent a blank state.
      setFacts(['Did you know? The first official international cricket match was played between Canada and the United States in 1844.']);
      setCurrentFactIndex(0);
    } finally {
      setLoading(false);
    }
  }, [facts]); // Depend on 'facts' to pass them as seenFacts

  useEffect(() => {
    getFacts(format);
    // The disabled eslint rule is to ensure this effect runs ONLY when the format changes.
    // We do not want to re-run it when getFacts function reference changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format]);

  const handleAnotherFact = () => {
    if (facts.length > 0) {
      setCurrentFactIndex((prevIndex) => (prevIndex + 1) % facts.length);
    }
  };
  
  // This ensures that even if the index is somehow out of bounds, it doesn't crash.
  const currentFact = facts.length > 0 ? facts[currentFactIndex] : '';

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
          <Button variant="secondary" size="sm" onClick={handleAnotherFact} disabled={loading || facts.length === 0}>
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
