
'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthProvider';
import ProfileSkeleton from '@/components/profile/ProfileSkeleton';
import ProfileContent from '@/components/profile/ProfileContent';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import SupportCard from '@/components/profile/SupportCard';
import { Settings, LogIn, Scale } from 'lucide-react';
import Policies from '@/components/profile/Policies';
import { db } from '@/lib/firebaseClient';
import { doc, getDoc } from 'firebase/firestore';

function ProfilePageContent() {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    // Wait for the initial auth check to complete
    if (authLoading) return;
    
    // If no user is logged in, we can stop fetching.
    if (!user) {
      setFetching(false);
      return;
    }

    // Auth is done and we have a user, now fetch the profile.
    const fetchProfile = async () => {
      setFetching(true);
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data());
        } else {
          console.warn("No profile document found for user:", user.uid);
        }
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setFetching(false);
      }
    };

    fetchProfile();
  }, [authLoading, user]);

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
