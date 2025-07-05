
'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clock, Users, TrendingUp, Trophy } from 'lucide-react';
import TimerStat from '@/components/stats/TimerStat';
import PlayersPlayingStat from '@/components/stats/PlayersPlayingStat';
import PlayersPlayedStat from '@/components/stats/PlayersPlayedStat';
import TotalWinnersStat from '@/components/stats/TotalWinnersStat';
import { useQuizStatus } from '@/context/QuizStatusProvider';

const GlobalStats = memo(() => {
    const { timeLeft, playersPlaying, playersPlayed, totalWinners } = useQuizStatus();

    return (
        <div 
            className="grid grid-cols-2 gap-4"
        >
            <div>
            <Card className="bg-card border-border/50 shadow-lg">
                <CardContent className="p-4 text-center">
                <Clock className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground mb-1">Quiz Ends In</p>
                <TimerStat timeLeft={timeLeft} />
                </CardContent>
            </Card>
            </div>
            <div>
            <Card className="bg-card border-border/50 shadow-lg">
                <CardContent className="p-4 text-center">
                <Users className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground mb-1">Players Playing</p>
                <PlayersPlayingStat players={playersPlaying} />
                </CardContent>
            </Card>
            </div>
            <div>
            <Card className="bg-card border-border/50 shadow-lg">
                <CardContent className="p-4 text-center">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground mb-1">Players Played</p>
                <PlayersPlayedStat players={playersPlayed} />
                </CardContent>
            </Card>
            </div>
            <div>
            <Card className="bg-card border-border/50 shadow-lg">
                <CardContent className="p-4 text-center">
                <Trophy className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm text-muted-foreground mb-1">Total Winners</p>
                <TotalWinnersStat winners={totalWinners} />
                </CardContent>
            </Card>
            </div>
        </div>
    );
});
GlobalStats.displayName = 'GlobalStats';

export default GlobalStats;
