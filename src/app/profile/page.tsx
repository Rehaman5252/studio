
'use client';

import React from 'react';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import ProfileSkeleton from '@/components/profile/ProfileSkeleton';
import ProfileContent from '@/components/profile/ProfileContent';
import LoginPrompt from '@/components/auth/LoginPrompt';
import { User } from 'lucide-react';
import { Button } from '@/components/ui/button';

function ProfilePage() {
  const { user, userData, isProfileComplete, loading } = useAuth();
  const router = useRouter();

  const renderUnauthenticated = () => (
    <main className="flex-1 flex items-center justify-center p-4 pb-20">
      <LoginPrompt 
        icon={User}
        title="View Your Profile"
        description="Log in to see your stats, manage rewards, and view quiz history."
      />
    </main>
  );

  const renderAuthenticated = () => {
    // This check is important. If loading is done and there's still no user,
    // it might be a brief state before redirect effect kicks in.
    if (!user) {
        return <ProfileSkeleton />;
    }

    if (!isProfileComplete) {
      return (
        <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20 text-center">
            <div className="bg-destructive/10 border border-destructive/50 text-destructive p-4 rounded-lg">
                <h3 className="font-bold">Profile Incomplete</h3>
                <p>Please complete your profile to view your stats and rewards.</p>
                <Button
                    onClick={() => router.push('/complete-profile')}
                    className="mt-2 bg-destructive text-destructive-foreground font-bold py-2 px-4 rounded hover:bg-destructive/90"
                >
                    Complete Profile
                </Button>
            </div>
            {userData && <ProfileContent userProfile={userData} /> }
        </main>
      );
    }

    return (
      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        <ProfileContent userProfile={userData} />
      </main>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
          <ProfileSkeleton />
        </main>
      );
    }

    if (!user) {
      return renderUnauthenticated();
    }
    
    return renderAuthenticated();
  };

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

export default ProfilePage;
