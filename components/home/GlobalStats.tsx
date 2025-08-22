
'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Timer, Users, Users2, Trophy } from 'lucide-react';
import TimerStat from '@/components/stats/TimerStat';
import PlayersPlayingStat from '@/components/stats/PlayersPlayingStat';
import PlayersPlayedStat from '@/components/stats/PlayersPlayedStat';
import TotalWinnersStat from '@/components/stats/TotalWinnersStat';
import { useQuizStatus } from '@/context/QuizStatusProvider';

const StatCard = memo(({ icon, title, children }: { icon: React.ReactNode, title: string, children: React.ReactNode }) => (
  <Card className="border-0 bg-card/80 shadow-md transition-all duration-300 ease-in-out transform hover:-translate-y-1 hover:shadow-primary/40">
    <CardContent className="p-3 text-center flex flex-col items-center justify-center h-full">
      <div>{icon}</div>
      <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mt-1">{title}</p>
      <div className="mt-1 text-foreground">{children}</div>
    </CardContent>
  </Card>
));
StatCard.displayName = 'StatCard';

const GlobalStatsComponent = () => {
    const { timeLeft, playersPlaying, playersPlayed, totalWinners } = useQuizStatus();
    return (
        <div className="grid grid-cols-2 gap-3">
            <StatCard icon={<Timer className="text-primary"/>} title="Quiz Ends">
                <TimerStat timeLeft={timeLeft} />
            </StatCard>
            <StatCard icon={<Users className="text-primary"/>} title="Players Playing">
                <PlayersPlayingStat count={playersPlaying} />
            </StatCard>
            <StatCard icon={<Users2 className="text-primary"/>} title="Players Played">
                <PlayersPlayedStat count={playersPlayed} />
            </StatCard>
            <StatCard icon={<Trophy className="text-primary"/>} title="Total Winners">
                <TotalWinnersStat count={totalWinners} />
            </StatCard>
        </div>
    )
}

export default memo(GlobalStatsComponent);
