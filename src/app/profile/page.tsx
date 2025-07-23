
'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthProvider';
import ProfileSkeleton from '@/components/profile/ProfileSkeleton';
import ProfileContent from '@/components/profile/ProfileContent';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import SupportCard from '@/components/profile/SupportCard';
import { Settings, LogIn, Scale, WifiOff } from 'lucide-react';
import { db } from '@/lib/firebaseClient';
import { doc, getDoc } from 'firebase/firestore';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

function ProfilePageContent() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    // This effect handles fetching the user's profile data.
    // It will only run when the auth state is confirmed and a user is present.
    
    // Condition 1: Wait for the initial auth check to complete.
    if (authLoading) {
      return; // Still waiting for onAuthStateChanged
    }
    
    // Condition 2: If auth is done and there's no user, we can stop.
    if (!user) {
      setFetching(false);
      return;
    }
    
    // Condition 3: Ensure this only runs on the client where `db` is available.
    if (!db) {
        setError("Database connection is not available.");
        setFetching(false);
        return;
    }

    const fetchProfile = async () => {
      setFetching(true);
      setError("");
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        } else {
          // This is a valid state - user is authenticated but has no profile document.
          // This can happen if document creation failed during signup.
          setProfile(null); 
        }
      } catch (err: any) {
        if (err?.message?.includes("offline")) {
          setError("You appear to be offline. Please check your internet connection.");
        } else {
          console.error("Error fetching profile:", err);
          setError("A network error occurred while fetching your profile.");
        }
      } finally {
        setFetching(false);
      }
    };

    fetchProfile();
  }, [user, authLoading]); // Rerun this effect if the user or authLoading state changes.
  
  if (authLoading || fetching) {
    return (
      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        <ProfileSkeleton />
      </main>
    );
  }
  
  if (!user) {
    return (
      <main className="flex-1 p-4 space-y-6 pb-20">
          <div className="w-full">
            <div className="text-center mb-6">
                <h2 className="text-2xl font-bold">Your Profile</h2>
                <p className="text-muted-foreground mt-2">
                    Sign in to manage your profile, view stats, and access your rewards.
                </p>
            </div>
            <Button asChild size="lg" className="w-full justify-center text-base py-6">
                <Link href="/auth/login?from=/profile"><LogIn className="mr-4" /> Pad Up & Sign In</Link>
            </Button>
            <section className="space-y-3 pt-8">
                <h3 className="text-lg font-semibold mb-2">General</h3>
                <Button asChild size="lg" className="w-full justify-start text-base py-6" variant="secondary">
                    <Link href="/settings"><Settings className="mr-4" /> App Settings</Link>
                </Button>
                 <Button asChild size="lg" className="w-full justify-start text-base py-6" variant="secondary">
                    <Link href="/policies"><Scale className="mr-4" /> Legal & Policies</Link>
                </Button>
            </section>
             <div className="mt-8 w-full">
                <SupportCard />
             </div>
          </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        <Alert variant="destructive">
          <WifiOff className="h-4 w-4" />
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </main>
    )
  }

  if (!profile) {
      return (
        <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
            <Alert>
              <AlertTitle>Profile Not Found</AlertTitle>
              <AlertDescription>We couldn't find a profile for your account. Please complete your profile to continue.</AlertDescription>
              <Button asChild className="mt-4">
                <Link href="/complete-profile">Complete Profile</Link>
              </Button>
            </Alert>
        </main>
      );
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
      <ProfileContent userProfile={profile} />
    </main>
  );
}

export default function ProfilePageWrapper() {
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
      <ProfilePageContent />
    </motion.div>
  );
}
