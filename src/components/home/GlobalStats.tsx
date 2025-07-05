
'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Users, TrendingUp, Trophy } from 'lucide-react';
import TimerStat from '@/components/stats/TimerStat';
import PlayersPlayingStat from '@/components/stats/PlayersPlayingStat';
import PlayersPlayedStat from '@/components/stats/PlayersPlayedStat';
import TotalWinnersStat from '@/components/stats/TotalWinnersStat';
import { motion } from 'framer-motion';
import { useQuizStatus } from '@/context/QuizStatusProvider';

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

const GlobalStats = memo(() => {
    const { timeLeft, playersPlaying, playersPlayed, totalWinners } = useQuizStatus();

    return (
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
                <TimerStat timeLeft={timeLeft} />
                </CardContent>
            </Card>
            </motion.div>
            <motion.div variants={cardVariants}>
            <Card className="bg-card border-border/50 shadow-lg">
                <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground mb-1">Players Playing</p>
                <PlayersPlayingStat players={playersPlaying} />
                </CardContent>
            </Card>
            </motion.div>
            <motion.div variants={cardVariants}>
            <Card className="bg-card border-border/50 shadow-lg">
                <CardContent className="p-4 text-center">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground mb-1">Players Played</p>
                <PlayersPlayedStat players={playersPlayed} />
                </CardContent>
            </Card>
            </motion.div>
            <motion.div variants={cardVariants}>
            <Card className="bg-card border-border/50 shadow-lg">
                <CardContent className="p-4 text-center">
                <Trophy className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground mb-1">Total Winners</p>
                <TotalWinnersStat winners={totalWinners} />
                </CardContent>
            </Card>
            </motion.div>
        </motion.div>
    );
});
GlobalStats.displayName = 'GlobalStats';

export default GlobalStats;
