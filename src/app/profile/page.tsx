
'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthProvider';
import ProfileSkeleton from '@/components/profile/ProfileSkeleton';
import ProfileContent from '@/components/profile/ProfileContent';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import SupportCard from '@/components/profile/SupportCard';
import { Settings } from 'lucide-react';
import LoginPrompt from '@/components/auth/LoginPrompt';
import { User as UserIcon } from 'lucide-react';

function ProfilePage() {
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
      <main className="flex flex-1 flex-col items-center p-4 space-y-6 pb-20 text-center">
          <div className="max-w-md w-full">
            <LoginPrompt
              icon={UserIcon}
              title="View Your Profile"
              description="Sign in to view your profile, track your stats, and manage your account."
            />
          </div>
          <div className="w-full space-y-3 pt-8">
            <Button asChild size="lg" className="w-full justify-start text-base py-6" variant="secondary">
                <Link href="/settings"><Settings className="mr-4" /> App Settings</Link>
            </Button>
            <SupportCard />
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
      <ProfilePage />
    </motion.div>
  );
}
