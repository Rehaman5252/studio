
import React from 'react';
import { motion } from 'framer-motion';
import LeaderboardContent from '@/components/leaderboard/LeaderboardContent';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { getFirebaseFirestore } from '@/lib/firebaseClient';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

async function getLeaderboardData() {
    try {
        const db = getFirebaseFirestore();
        if (!db) {
            // This will be caught by the try-catch block
            throw new Error("Firestore is not available on the server.");
        }
        
        // This is a placeholder for fetching top players.
        // In a real app, you would query an aggregated collection of top users.
        const mockTopPlayers = [
            { uid: 'mock-player-1', name: 'Ravi Ashwin', perfectScores: 25, totalPlayed: 150, photoURL: 'https://placehold.co/40x40.png' },
            { uid: 'mock-player-2', name: 'Jasprit Bumrah', perfectScores: 22, totalPlayed: 130, photoURL: 'https://placehold.co/40x40.png' },
            { uid: 'mock-player-3', name: 'Shikhar Dhawan', perfectScores: 20, totalPlayed: 180, photoURL: 'https://placehold.co/40x40.png' },
        ];
        return mockTopPlayers;
    } catch (error) {
        console.error("Failed to fetch leaderboard data:", error);
        return [];
    }
}

export default async function LeaderboardPage() {
    const { user, profile } = await getAuthenticatedUser();
    const leaderboardData = await getLeaderboardData();
    
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col h-screen bg-background"
        >
            <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b">
                <h1 className="text-2xl font-bold text-center text-foreground">Leaderboard</h1>
            </header>

            <main className="flex-1 overflow-y-auto p-4 pb-24">
                <LeaderboardContent initialUser={user} initialProfile={profile} initialLeaderboard={leaderboardData} />
            </main>
        </motion.div>
    );
}
