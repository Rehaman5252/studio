
'use client';

import { memo } from 'react';

const TotalWinnersStat = ({ winners }: { winners: number }) => {
  return <p className="text-2xl font-bold">{winners.toLocaleString()}</p>;
}

export default memo(TotalWinnersStat);
