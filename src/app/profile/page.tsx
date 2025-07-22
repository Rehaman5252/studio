'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthProvider';
import ProfileSkeleton from '@/components/profile/ProfileSkeleton';
import ProfileContent from '@/components/profile/ProfileContent';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import SupportCard from '@/components/profile/SupportCard';
import { Settings, LogIn, Scale } from 'lucide-react';
import Policies from '@/components/profile/Policies';

function ProfilePageContent() {
  const { user, profile, loading } = useAuth();

  if (loading) {
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
