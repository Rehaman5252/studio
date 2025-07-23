
"use client";
import { useEffect, useState } from "react";
import { motion } from 'framer-motion';
import ProfileSkeleton from '@/components/profile/ProfileSkeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LogIn, ServerCrash, WifiOff, Loader2 } from 'lucide-react';
import ProfileContent from "@/components/profile/ProfileContent";
import { useAuth } from "@/context/AuthProvider";

export default function ProfilePage() {
  const { user, profile, loading, isOffline } = useAuth();
  
  const renderContent = () => {
    if (loading) {
      return (
        <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
            <ProfileSkeleton />
        </main>
      );
    }

    if (!user) {
       return (
         <main className="flex-1 p-4 space-y-6 pb-20 flex items-center justify-center">
            <Alert variant="destructive" className="max-w-md">
                <LogIn className="h-4 w-4" />
                <AlertTitle>Not Signed In</AlertTitle>
                <AlertDescription>
                    Please sign in to view your profile.
                    <Button asChild className="mt-4 w-full">
                        <Link href="/auth/login?from=/profile"><LogIn className="mr-2"/> Sign In</Link>
                    </Button>
                </AlertDescription>
            </Alert>
         </main>
       );
    }

    if (isOffline && !profile) {
        return (
            <main className="flex-1 p-4 space-y-6 pb-20 flex items-center justify-center">
                <Alert variant="destructive" className="max-w-md">
                    <WifiOff className="h-4 w-4" />
                    <AlertTitle>Could Not Load Profile</AlertTitle>
                    <AlertDescription>
                        You appear to be offline. Please check your connection to view your profile.
                    </AlertDescription>
                </Alert>
            </main>
        )
    }
    
    if (!profile) {
        return (
            <main className="flex-1 p-4 space-y-6 pb-20 flex items-center justify-center">
                <Alert variant="destructive" className="max-w-md">
                    <ServerCrash className="h-4 w-4" />
                    <AlertTitle>Profile Not Found</AlertTitle>
                    <AlertDescription>
                        No profile data was found. Please complete your profile to continue.
                        <Button asChild className="mt-4 w-full">
                            <Link href="/complete-profile">Complete Profile</Link>
                        </Button>
                    </AlertDescription>
                </Alert>
            </main>
        )
    }
    
    return (
    <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        <ProfileContent userProfile={profile} />
    </main>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col h-screen bg-background"
    >
      <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b flex items-center justify-between">
        <h1 className="text-2xl font-bold text-center text-foreground">My Profile</h1>
      </header>
      {renderContent()}
    </motion.div>
  );
}
