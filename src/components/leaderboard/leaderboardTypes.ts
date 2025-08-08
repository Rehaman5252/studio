
export interface LivePlayer {
    uid: string;
    name: string;
    avatar: string;
    score: number;
    time: number;
    disqualified: boolean;
    rank?: number;
}

export interface AllTimePlayer {
    uid: string;
    name: string;
    avatar: string;
    perfectScores: number;
    rank?: number;
}

export interface MyNetworkPlayer {
    uid: string;
    name: string;
    avatar: string;
    perfectScores: number;
    isReferrer: boolean;
    rank?: number;
}
