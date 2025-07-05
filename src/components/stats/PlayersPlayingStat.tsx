
'use client';
import { memo } from 'react';

const PlayersPlayingStat = ({ players }: { players: number }) => {
  return <p className="text-2xl font-bold">{players.toLocaleString()}</p>;
}

export default memo(PlayersPlayingStat);
