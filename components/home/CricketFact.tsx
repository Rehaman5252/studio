
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
  const [key, setKey] = useState(0); // Add a key to force re-render

  const getFact = useCallback(async (currentSeenFacts: string[]) => {
    setLoading(true);
    try {
      const newFact = await generateCricketFact({ format, seenFacts: currentSeenFacts });
      setFact(newFact);
      setSeenFacts(prev => [...prev, newFact]);
    } catch (error) {
      console.error('Failed to fetch cricket fact:', error);
      setFact('Did you know? The first official international cricket match was played between Canada and the United States in 1844.');
    } finally {
      setLoading(false);
    }
  }, [format]);

  useEffect(() => {
    // Reset seen facts when format changes
    const initialSeen: string[] = [];
    setSeenFacts(initialSeen);
    getFact(initialSeen);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format]); // Only run when format changes

  const handleAnotherFact = () => {
    // We pass the current list of seen facts directly
    getFact(seenFacts);
  };

  return (
    <Card className="bg-card/80 border-primary/10 shadow-lg">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
            <Lightbulb className="text-primary"/>
            Did you know?
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="min-h-[60px] flex items-center justify-center text-center">
            <AnimatePresence mode="wait">
                <motion.p
                    key={fact} // Use fact as key for animation
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
            Another Fact
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
