
export interface LivePlayer {
    userId: string;
    name: string;
    avatar?: string;
    score: number;
    time: number;
    disqualified: boolean;
    rank?: number;
    isCurrentUser?: boolean;
}

export interface AllTimePlayer {
    uid: string;
    name: string;
    avatar?: string;
    perfectScores: number;
    totalScore: number;
    quizzesPlayed: number;
    rank?: number;
    isCurrentUser?: boolean;
}

export interface MyNetworkPlayer {
    uid: string;
    name: string;
    avatar: string;
    perfectScores: number;
    isReferrer: boolean;
    rank?: number;
}

export interface StreakPlayer {
    uid: string;
    name: string;
    avatar: string;
    currentStreak: number;
    rank?: number;
    isCurrentUser?: boolean;
}
