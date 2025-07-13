
'use client';

import React, { useEffect } from 'react';
import ProfileContent from '@/components/profile/ProfileContent';
import { useAuth } from '@/context/AuthProvider';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function ProfilePageContentWrapper() {
  const { user, userData, isUserDataLoading, isAuthLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.replace('/auth/login');
    }
  }, [user, isAuthLoading, router]);

  if (isUserDataLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!userData) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
         <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
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
      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        <ProfileContent userProfile={userData} />
      </main>
    </motion.div>
  );
}

export default function ProfilePage() {
  return <ProfilePageContentWrapper />;
}
