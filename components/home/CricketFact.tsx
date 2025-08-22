
'use client';

import { useState, useEffect, useCallback }
from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { generateCricketFact } from '@/ai/flows/generate-cricket-fact';
import { Loader2, RefreshCw, Lightbulb } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

export default function CricketFact({ format }: { format: string }) {
  const [fact, setFact] = useState('');
  const [seenFacts, setSeenFacts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const getFact = useCallback(async (currentSeen: string[]) => {
    setLoading(true);
    try {
      // Pass the current seenFacts to the flow
      const newFact = await generateCricketFact({ format, seenFacts: currentSeen });
      setFact(newFact);
      // Add the new fact to the list of seen facts for the current session
      setSeenFacts(prev => [...prev, newFact]);
    } catch (error) {
      console.error('Failed to fetch cricket fact:', error);
      // Provide a default fact on error
      setFact('Did you know? The first official international cricket match was played between Canada and the United States in 1844.');
    } finally {
      setLoading(false);
    }
  }, [format]);

  useEffect(() => {
    // This effect runs only when the component mounts or the format changes.
    // It resets the seen facts and fetches the first one.
    const initialSeen: string[] = [];
    setSeenFacts(initialSeen);
    
    setLoading(true);
    generateCricketFact({ format, seenFacts: initialSeen })
      .then(newFact => {
        setFact(newFact);
        setSeenFacts([newFact]); // Start the session with the first fact
      })
      .catch(error => {
        console.error('Failed to fetch initial cricket fact:', error);
        setFact('Did you know? The first official international cricket match was played between Canada and the United States in 1844.');
      })
      .finally(() => setLoading(false));
      
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format]); // Re-run only when format changes

  const handleAnotherFact = () => {
    // Pass the current state of seenFacts directly to the fetch function
    getFact(seenFacts);
  };

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
                    key={fact} // Use fact as key for animation to trigger on change
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                    className="text-sm text-muted-foreground"
                >
                    {loading && !fact ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : fact}
                </motion.p>
            </AnimatePresence>
        </div>
        <div className="flex justify-center mt-4">
          <Button variant="secondary" size="sm" onClick={handleAnotherFact} disabled={loading}>
            {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Next Update
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
