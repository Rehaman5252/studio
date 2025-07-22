// src/app/leaderboard/page.tsx - Server Component
import React from 'react';
import LeaderboardContent from '@/components/leaderboard/LeaderboardContent';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { getFirebaseFirestore } from '@/lib/firebaseClient';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import type { AllTimePlayer } from '@/components/leaderboard/leaderboardTypes';
import LoginPrompt from '@/components/auth/LoginPrompt';
import { Trophy } from 'lucide-react';

async function getLeaderboardData(): Promise<AllTimePlayer[]> {
    try {
        const db = getFirebaseFirestore();
        if (!db) {
            throw new Error("Firestore is not available on the server.");
        }
        
        // This is a placeholder for fetching top players.
        // In a real app, you would query an aggregated collection of top users.
        const mockTopPlayers: AllTimePlayer[] = [
            { uid: 'mock-player-1', name: 'Ravi Ashwin', perfectScores: 25, totalPlayed: 150, avatar: 'https://placehold.co/40x40.png' },
            { uid: 'mock-player-2', name: 'Jasprit Bumrah', perfectScores: 22, totalPlayed: 130, avatar: 'https://placehold.co/40x40.png' },
            { uid: 'mock-player-3', name: 'Shikhar Dhawan', perfectScores: 20, totalPlayed: 180, avatar: 'https://placehold.co/40x40.png' },
        ];
        return mockTopPlayers;
    } catch (error) {
        console.error("Failed to fetch leaderboard data:", error);
        return [];
    }
}

export default async function LeaderboardPage() {
    const { user, profile } = await getAuthenticatedUser();
    
    // Fetch data on the server
    const leaderboardData = await getLeaderboardData();

    return (
        <div className="flex flex-col h-screen bg-background">
            <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b">
                <h1 className="text-2xl font-bold text-center text-foreground">Leaderboard</h1>
            </header>

            <main className="flex-1 overflow-y-auto p-4 pb-24">
                 {user ? (
                    <LeaderboardContent initialUser={user} initialProfile={profile} initialLeaderboard={leaderboardData} />
                 ) : (
                    <div className="flex items-center justify-center h-full">
                        <LoginPrompt
                            icon={Trophy}
                            title="View the Rankings"
                            description="Log in or sign up to see where you stand on the leaderboard."
                        />
                    </div>
                 )}
            </main>
        </div>
    );
}
