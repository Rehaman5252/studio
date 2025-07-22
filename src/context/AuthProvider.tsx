
'use client';

import { createContext, useEffect, useState, useContext, ReactNode } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebaseClient";
import { sanitizeUserProfile } from "@/lib/sanitizeUserProfile";

interface AuthContextType {
  user: User | null;
  profile: Record<string, any> | null;
  loading: boolean;
  isProfileComplete: boolean;
  updateUserData: (data: Partial<Record<string, any>>) => Promise<void>;
  addQuizAttempt: (attempt: any) => Promise<void>; // Simplified for this fix
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);
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
    if (!user) return;

    const fetchProfile = async () => {
      try {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProfile(data);
          setIsProfileComplete(!!data.profileCompleted);
        } else {
          // Create the document if it doesn't exist
          const newUserProfile = {
            uid: user.uid,
            email: user.email,
            name: user.displayName || 'New User',
            photoURL: user.photoURL || `https://placehold.co/100x100.png`,
            createdAt: new Date(),
            profileCompleted: false,
          };
          await setDoc(docRef, sanitizeUserProfile(newUserProfile));
          setProfile(newUserProfile);
          setIsProfileComplete(false);
        }
      } catch (error) {
        console.error("Error fetching/creating user profile:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const updateUserData = async (data: Partial<Record<string, any>>) => {
    if (!user) return;
    const docRef = doc(db, "users", user.uid);
    await setDoc(docRef, sanitizeUserProfile(data), { merge: true });
    // Re-fetch profile to ensure local state is in sync
    const updatedDoc = await getDoc(docRef);
    if (updatedDoc.exists()) {
        const updatedData = updatedDoc.data();
        setProfile(updatedData);
        setIsProfileComplete(!!updatedData.profileCompleted);
    }
  };

  const addQuizAttempt = async (attempt: any) => {
    if (!user) return;
    const attemptRef = doc(db, `users/${user.uid}/quizAttempts`, attempt.slotId);
    await setDoc(attemptRef, sanitizeUserProfile(attempt), { merge: true });
  }

  const value = { user, loading, profile, isProfileComplete, updateUserData, addQuizAttempt };

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
