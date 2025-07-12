
'use client';

import React, { useEffect, useState } from 'react';
import { doc, onSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import ProfileContent from '@/components/profile/ProfileContent';
import { useAuth } from '@/context/AuthProvider';
import ProfileSkeleton from '@/components/profile/ProfileSkeleton';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

function ProfilePageContentWrapper() {
  const user = useAuth();
  const router = useRouter();
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [isUserDataLoading, setIsUserDataLoading] = useState(true);

  useEffect(() => {
    if (user === null) {
      router.replace('/auth/login');
    }
  }, [user, router]);

  useEffect(() => {
    if (user) {
      const unsub = onSnapshot(doc(db, 'users', user.uid), (doc) => {
        setUserData(doc.data() ?? null);
        setIsUserDataLoading(false);
      });
      return () => unsub();
    } else {
      setIsUserDataLoading(false);
    }
  }, [user]);

  if (!user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
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
      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        {isUserDataLoading ? (
          <ProfileSkeleton />
        ) : (
          <ProfileContent userProfile={userData} />
        )}
      </main>
    </motion.div>
  );
}

export default function ProfilePage() {
  return <ProfilePageContentWrapper />;
}
