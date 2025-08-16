
'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';

interface PlayersPlayingStatProps {
  count: number;
}

const PlayersPlayingStat = ({ count }: PlayersPlayingStatProps) => {
  return (
    <motion.span
      key={count}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="text-2xl font-bold text-foreground"
    >
      {count.toLocaleString()}
    </motion.span>
  );
};

export default memo(PlayersPlayingStat);
