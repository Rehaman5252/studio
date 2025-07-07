
'use client';

import React from 'react';
import ProfileContent from '@/components/profile/ProfileContent';
import useRequireAuth from '@/hooks/useRequireAuth';
import { useAuth } from '@/context/AuthProvider';


export default function ProfilePage() {
    useRequireAuth();
    const { userData, loading: isAuthLoading, isHistoryLoading } = useAuth();
    
    // Determine the loading state for the skeleton.
    // We show the skeleton if auth is still resolving OR if history is still loading,
    // as some stats might depend on it.
    const isLoading = isAuthLoading || isHistoryLoading;

    return (
        <div className="flex flex-col h-screen bg-background">
            <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b flex items-center justify-between">
                <h1 className="text-2xl font-bold text-center text-foreground">My Profile</h1>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
                <ProfileContent userProfile={userData} isLoading={isLoading} />
            </main>
        </div>
    );
}
