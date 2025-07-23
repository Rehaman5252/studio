
"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getUserProfile } from "@/lib/getUserProfile";
import { motion } from 'framer-motion';
import ProfileSkeleton from '@/components/profile/ProfileSkeleton';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LogIn, ServerCrash, WifiOff } from 'lucide-react';
import ProfileContent from "@/components/profile/ProfileContent";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const data = await getUserProfile(user.uid);
          if (data) {
            setProfile(data);
          } else {
            setError("No profile data found. Please complete your profile.");
          }
        } catch (err: any) {
            if (err.message?.includes("offline")) {
                setError("You appear to be offline. Please check your connection to view your profile.");
            } else {
                setError("An error occurred while loading your profile.");
            }
            console.error("Profile fetch error:", err);
        }
      } else {
        setError("Please sign in to view your profile.");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const renderContent = () => {
    if (loading) {
      return (
        <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
            <ProfileSkeleton />
        </main>
      );
    }

    if (error) {
       return (
         <main className="flex-1 p-4 space-y-6 pb-20 flex items-center justify-center">
            <Alert variant="destructive" className="max-w-md">
                {error.includes("offline") ? <WifiOff className="h-4 w-4" /> : <ServerCrash className="h-4 w-4" />}
                <AlertTitle>Could Not Load Profile</AlertTitle>
                <AlertDescription>
                    {error}
                     {error.includes("sign in") && (
                        <Button asChild className="mt-4">
                            <Link href="/auth/login?from=/profile"><LogIn className="mr-2"/> Sign In</Link>
                        </Button>
                    )}
                    {error.includes("complete your profile") && (
                        <Button asChild className="mt-4">
                            <Link href="/complete-profile">Complete Profile</Link>
                        </Button>
                    )}
                </AlertDescription>
            </Alert>
         </main>
       );
    }
    
    if (profile) {
       return (
        <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
            <ProfileContent userProfile={profile} />
        </main>
       );
    }

    return null;
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
