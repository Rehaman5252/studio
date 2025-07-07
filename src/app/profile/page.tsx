
'use client';

import React from 'react';
import ProfileContent from '@/components/profile/ProfileContent';
import useRequireAuth from '@/hooks/useRequireAuth';
import { useAuth } from '@/context/AuthProvider';


export default function ProfilePage() {
    useRequireAuth();
    const { userData, loading: isAuthLoading, isUserDataLoading } = useAuth();
    
    // The main loading state for the profile page should depend on auth being ready
    // and the user document fetch being complete.
    const isLoading = isAuthLoading || isUserDataLoading;

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
