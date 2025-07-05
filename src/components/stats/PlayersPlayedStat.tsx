
'use client';
import { memo } from 'react';

const PlayersPlayedStat = ({ players }: { players: number }) => {
  return <p className="text-2xl font-bold">{players.toLocaleString()}</p>;
}

export default memo(PlayersPlayedStat);
