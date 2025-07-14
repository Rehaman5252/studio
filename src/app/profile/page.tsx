
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthProvider';
import ProfileSkeleton from '@/components/profile/ProfileSkeleton';
import ProfileContent from '@/components/profile/ProfileContent';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import SupportCard from '@/components/profile/SupportCard';
import { Settings, LogIn } from 'lucide-react';

function ProfilePage() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        <ProfileSkeleton />
      </main>
    );
  }
  
  if (!user) {
    return (
      <main className="flex flex-1 flex-col p-4 space-y-6 pb-20">
          <Button asChild size="lg" className="w-full justify-center text-base py-6">
              <Link href="/auth/login"><LogIn className="mr-4" /> Login / Sign Up</Link>
          </Button>
          <section className="space-y-3 pt-4">
              <Button asChild size="lg" className="w-full justify-start text-base py-6" variant="secondary">
                  <Link href="/settings"><Settings className="mr-4" /> App Settings</Link>
              </Button>
          </section>
          <SupportCard />
      </main>
    )
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
      <ProfileContent userProfile={userData} />
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
