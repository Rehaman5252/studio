
'use client';

import React, { useState, useCallback, useMemo, memo } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  Users,
  TrendingUp,
  Trophy,
  ChevronRight,
  Loader2,
  Clock,
} from 'lucide-react';
import Cube, { type CubeBrand } from '@/components/Cube';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import TimerStat from '@/components/stats/TimerStat';
import PlayersPlayingStat from '@/components/stats/PlayersPlayingStat';
import PlayersPlayedStat from '@/components/stats/PlayersPlayedStat';
import TotalWinnersStat from '@/components/stats/TotalWinnersStat';
import useRequireAuth from '@/hooks/useRequireAuth';
import { useQuizStatus } from '@/context/QuizStatusProvider';
import { getQuizSlotId } from '@/lib/utils';
import { motion } from 'framer-motion';

const brands: CubeBrand[] = [
  { id: 1, brand: 'Apple', format: 'T20', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/480px-Apple_logo_black.svg.png', logoWidth: 40, logoHeight: 48 },
  { id: 2, brand: 'Gucci', format: 'WPL', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Gucci_logo.svg/1200px-Gucci_logo.svg.png', logoWidth: 90, logoHeight: 25 },
  { id: 3, brand: 'SBI', format: 'Test', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cc/SBI-logo.svg/1024px-SBI-logo.svg.png', logoWidth: 60, logoHeight: 60 },
  { id: 4, brand: 'Nike', format: 'ODI', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Logo_NIKE.svg/1200px-Logo_NIKE.svg.png', logoWidth: 80, logoHeight: 30 },
  { id: 5, brand: 'Amazon', format: 'Mixed', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Amazon_logo.svg/1024px-Amazon_logo.svg.png', logoWidth: 70, logoHeight: 25 },
  { id: 6, brand: 'Corona', format: 'IPL', logoUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/07/Corona_logo_2017.svg/1024px-Corona_logo_2017.svg.png', logoWidth: 90, logoHeight: 45 },
];

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

const statCardContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const GlobalStats = memo(() => (
    <motion.div 
        className="grid grid-cols-2 gap-4"
        initial="hidden"
        animate="visible"
        variants={statCardContainer}
    >
        <motion.div variants={cardVariants}>
        <Card className="bg-card border-border/50 shadow-lg">
            <CardContent className="p-4 text-center">
            <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground mb-1">Quiz Ends In</p>
            <TimerStat />
            </CardContent>
        </Card>
        </motion.div>
        <motion.div variants={cardVariants}>
        <Card className="bg-card border-border/50 shadow-lg">
            <CardContent className="p-4 text-center">
            <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground mb-1">Players Playing</p>
            <PlayersPlayingStat />
            </CardContent>
        </Card>
        </motion.div>
        <motion.div variants={cardVariants}>
        <Card className="bg-card border-border/50 shadow-lg">
            <CardContent className="p-4 text-center">
            <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground mb-1">Players Played</p>
            <PlayersPlayedStat />
            </CardContent>
        </Card>
        </motion.div>
        <motion.div variants={cardVariants}>
        <Card className="bg-card border-border/50 shadow-lg">
            <CardContent className="p-4 text-center">
            <Trophy className="h-6 w-6 mx-auto mb-2 text-primary" />
            <p className="text-sm text-muted-foreground mb-1">Total Winners</p>
            <TotalWinnersStat />
            </CardContent>
        </Card>
        </motion.div>
    </motion.div>
));
GlobalStats.displayName = 'GlobalStats';


export default function HomeScreen() {
  const { loading: authLoading } = useRequireAuth();
  const { lastAttemptInSlot, isLoading: isQuizStatusLoading } = useQuizStatus();
  const [selectedBrandIndex, setSelectedBrandIndex] = useState(0);
  const router = useRouter();

  const loading = authLoading || isQuizStatusLoading;

  const hasPlayedInCurrentSlot = useMemo(() => {
    if (loading || !lastAttemptInSlot) return false;
    return lastAttemptInSlot.slotId === getQuizSlotId();
  }, [lastAttemptInSlot, loading]);

  const handleBrandSelect = useCallback((index: number) => {
    setSelectedBrandIndex(index);
  }, []);

  const handleStartQuiz = useCallback((brand: string, format: string) => {
    if (hasPlayedInCurrentSlot) {
      router.push(`/quiz/results`);
    } else {
      router.push(`/quiz?brand=${encodeURIComponent(brand)}&format=${encodeURIComponent(format)}`);
    }
  }, [router, hasPlayedInCurrentSlot]);
  
  const selectedBrand = brands[selectedBrandIndex];

  if (loading) {
      return (
        <div className="flex flex-col h-screen bg-background items-center justify-center">
             <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <header className="p-4 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">
            Indcric
          </h1>
          <p className="text-sm text-muted-foreground">Win ₹100 for every 100 seconds</p>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-24">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold">Select Your Cricket Format</h2>
            <p className="text-sm text-muted-foreground">Click a face on the cube to start!</p>
          </div>

          <Cube 
            brands={brands} 
            onSelect={handleBrandSelect}
            onFaceClick={(brand) => {
              handleStartQuiz(brand.brand, brand.format);
            }}
          />

            <motion.div
              key={selectedBrand.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              onClick={() => handleStartQuiz(selectedBrand.brand, selectedBrand.format)}
              className="cursor-pointer"
            >
              <Card 
                className="w-full mt-8 rounded-2xl shadow-xl bg-card border-2 border-primary/30 transition-colors hover:border-primary"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-2xl font-bold text-foreground">{selectedBrand.format} Cricket Quiz</h3>
                      <p className="text-muted-foreground mb-2">Sponsored by {selectedBrand.brand}</p>
                      <p className="text-lg font-semibold text-primary">Win Rewards!</p>
                    </div>
                    <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white p-2 shadow-inner">
                      <Image
                        src={selectedBrand.logoUrl}
                        alt={`${selectedBrand.brand} logo`}
                        width={selectedBrand.logoWidth < 50 ? selectedBrand.logoWidth * 1.2 : selectedBrand.logoWidth}
                        height={selectedBrand.logoHeight < 50 ? selectedBrand.logoHeight * 1.2 : selectedBrand.logoHeight}
                        className="object-contain"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          
          <Separator className="my-8 bg-border/50" />

          <GlobalStats />

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              size="lg"
              variant="default"
              className="w-full mt-8 text-lg font-bold py-7 rounded-full shadow-lg shadow-primary/30 hover:shadow-primary/40 transition-all duration-300"
              onClick={() => handleStartQuiz(selectedBrand.brand, selectedBrand.format)}
            >
              {`Start ${selectedBrand.format} Quiz`}
              <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
