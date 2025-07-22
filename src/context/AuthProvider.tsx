
'use client';

import { createContext, useEffect, useState, useContext, ReactNode, useCallback } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth, db } from "@/lib/firebaseClient";
import { doc, getDoc, setDoc, Timestamp } from "firebase/firestore";
import { sanitizeUserProfile } from "@/lib/sanitizeUserProfile";
import type { QuizAttempt } from "@/lib/mockData";
import { createUserDocument } from "@/lib/authUtils";

interface AuthContextType {
  user: User | null;
  profile: Record<string, any> | null;
  loading: boolean;
  isProfileComplete: boolean;
  updateUserData: (data: Partial<Record<string, any>>) => Promise<void>;
  addQuizAttempt: (attempt: QuizAttempt) => Promise<void>;
  setLastAttempt: (attempt: QuizAttempt | null) => void;
  lastAttempt: QuizAttempt | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);

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
    if (!user) return;

    const fetchProfile = async () => {
      setLoading(true);
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
           if (data?.dob instanceof Timestamp) {
            data.dob = data.dob.toDate().toISOString().split('T')[0];
          }
          setProfile(data);
          setIsProfileComplete(!!data.profileCompleted);
        } else {
          // If doc doesn't exist, create it.
          await createUserDocument(user);
          const newUserDoc = await getDoc(docRef);
          if(newUserDoc.exists()){
            const data = newUserDoc.data();
            setProfile(data);
            setIsProfileComplete(!!data.profileCompleted);
          }
        }
      } catch (error) {
        console.error("Error fetching/creating user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const updateUserData = useCallback(async (data: Partial<Record<string, any>>) => {
    if (!user) throw new Error("User not authenticated.");
    const docRef = doc(db, "users", user.uid);
    await setDoc(docRef, sanitizeUserProfile(data), { merge: true });
    // Re-fetch profile to ensure local state is in sync
    const updatedDoc = await getDoc(docRef);
    if (updatedDoc.exists()) {
        const updatedData = updatedDoc.data();
        if (updatedData?.dob instanceof Timestamp) {
            updatedData.dob = updatedData.dob.toDate().toISOString().split('T')[0];
        }
        setProfile(updatedData);
        setIsProfileComplete(!!updatedData.profileCompleted);
    }
  }, [user]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    if (!user) throw new Error("User not authenticated.");
    const sanitizedAttempt = sanitizeUserProfile(attempt) as QuizAttempt;
    const attemptRef = doc(db, `users/${user.uid}/quizAttempts`, sanitizedAttempt.slotId);
    
    await setDoc(attemptRef, sanitizedAttempt, { merge: true });

    // Update stats in the profile
    if (updateUserData) {
        const isPerfect = sanitizedAttempt.score === sanitizedAttempt.totalQuestions && !sanitizedAttempt.reason;
        const currentProfile = profile || {};
        const newStats = {
          quizzesPlayed: (currentProfile.quizzesPlayed || 0) + 1,
          perfectScores: (currentProfile.perfectScores || 0) + (isPerfect ? 1 : 0),
          totalRewards: (currentProfile.totalRewards || 0) + (isPerfect ? 100 : 0),
        };
        await updateUserData(newStats);
    }
  }, [user, profile, updateUserData]);

  const value = { user, loading, profile, isProfileComplete, updateUserData, addQuizAttempt, lastAttempt, setLastAttempt };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
