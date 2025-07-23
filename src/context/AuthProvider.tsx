// AuthProvider.tsx
"use client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signOut } from "firebase/auth";
import { doc, onSnapshot, writeBatch, increment, Timestamp, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebaseClient";
import { sanitizeUserProfile } from "@/lib/sanitizeUserProfile";
import type { QuizAttempt } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import { createUserDocument } from "@/lib/authUtils";
import { Loader2 } from "lucide-react";

interface AuthContextType {
  user: User | null;
  profile: Record<string, any> | null;
  loading: boolean;
  updateUserData?: (data: Partial<Record<string, any>>) => Promise<void>;
  addQuizAttempt?: (attempt: QuizAttempt) => Promise<void>;
  lastAttempt: QuizAttempt | null;
  setLastAttempt: (attempt: QuizAttempt | null) => void;
  isProfileComplete: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      if (!firebaseUser) {
        setProfile(null);
        setIsProfileComplete(false);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const userDocRef = doc(db, "users", user.uid);
    const unsubProfile = onSnapshot(userDocRef, async (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data?.dob instanceof Timestamp) {
          data.dob = data.dob.toDate().toISOString().split('T')[0];
        }
        setProfile(data);
        setIsProfileComplete(!!data.profileCompleted);
      } else {
        try {
          await createUserDocument(user);
        } catch (error) {
          console.error("Failed to create user document:", error);
        }
      }
      setLoading(false);
    }, (error) => {
      console.error("Profile snapshot error:", error);
      setLoading(false);
    });
    return () => unsubProfile();
  }, [user]);

  const updateUserData = useCallback(async (newData: Partial<Record<string, any>>) => {
    if (!user) throw new Error("User not authenticated.");
    const userDocRef = doc(db, "users", user.uid);
    await setDoc(userDocRef, sanitizeUserProfile(newData), { merge: true });
  }, [user]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    if (!user || !profile) throw new Error("User or profile not available.");
    const batch = writeBatch(db);
    const userRef = doc(db, 'users', user.uid);
    const attemptRef = doc(db, `users/${user.uid}/quizAttempts`, attempt.slotId);
    batch.set(attemptRef, sanitizeUserProfile(attempt));
    const isPerfect = attempt.score === attempt.totalQuestions && !attempt.reason;
    const statsUpdate: { [key: string]: any } = { quizzesPlayed: increment(1) };
    if (isPerfect) {
      statsUpdate.perfectScores = increment(1);
      statsUpdate.totalRewards = increment(100);
    }
    batch.update(userRef, statsUpdate);
    await batch.commit();
  }, [user, profile]);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
      toast({
        title: "Signed Out",
        description: "You have been logged out successfully.",
      });
    } catch (error) {
      toast({
        title: "Logout Failed",
        description: "Could not log you out.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const value = useMemo(() => ({
    user, profile, loading, updateUserData, addQuizAttempt,
    lastAttempt, setLastAttempt, isProfileComplete, logout, isOffline: false // isOffline is no longer managed here
  }), [user, profile, loading, updateUserData, addQuizAttempt, lastAttempt, isProfileComplete, logout]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
