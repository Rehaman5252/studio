// src/components/leaderboard/leaderboardTypes.ts
export interface Player {
    rank?: number;
    name: string;
    avatar?: string;
    uid: string;
}

export interface LivePlayer extends Player {
    score: number;
    time: number;
    disqualified?: boolean;
}

export interface AllTimePlayer extends Player {
    perfectScores: number;
    totalPlayed: number;
}
