'use client';

import React from 'react';
import ProfileContent from '@/components/profile/ProfileContent';
import useRequireAuth from '@/hooks/useRequireAuth';
import { Loader2 } from 'lucide-react';


export default function ProfilePage() {
    const { user, userData, loading, isUserDataLoading } = useRequireAuth();
    
    // While the auth state is resolving, OR if there's no user (and redirect is in progress), show a full-page loader.
    // The useRequireAuth hook will handle redirection if the user is not logged in.
    if (loading || !user) {
        return (
            <div className="flex flex-col h-screen bg-background items-center justify-center">
                 <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        );
    }
    
    // Pass the specific data loading state to the content component
    // so it can show its own skeleton UI while the user document is fetching.
    return (
        <div className="flex flex-col h-screen bg-background">
            <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b flex items-center justify-between">
                <h1 className="text-2xl font-bold text-center text-foreground">My Profile</h1>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
                <ProfileContent userProfile={userData} isLoading={isUserDataLoading} />
            </main>
        </div>
    );
}
