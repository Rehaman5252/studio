

export interface LivePlayer {
    rank?: number;
    name: string;
    avatar?: string;
    uid: string;
    score: number;
    time: number;
    disqualified?: boolean;
}

export interface AllTimePlayer {
    rank?: number;
    name: string;
    avatar?: string;
    uid: string;
    perfectScores: number;
    totalPlayed: number;
}

export interface MyNetworkPlayer {
    rank?: number;
    name: string;
    avatar?: string;
    uid: string;
    perfectScores: number;
    isReferrer: boolean;
}

export interface CurrentQuizLeaderboardDoc {
    players: LivePlayer[];
    lastUpdated: any; // Firestore Timestamp
    quizId: string;
    status: "in-progress" | "finished" | "idle";
}
