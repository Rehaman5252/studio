
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { createUserDocument } from '@/lib/authUtils';
import type { QuizAttempt } from '@/lib/mockData';
import type { DocumentData } from 'firebase/firestore';
import { 
  doc, 
  onSnapshot, 
  setDoc,
  Timestamp,
  getDoc,
} from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore, isFirebaseOnline } from '@/lib/firebaseClient';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';

interface AuthContextType {
  user: User | null;
  userData: DocumentData | null; // Kept for backwards compatibility if needed, but profile is preferred
  profile: DocumentData | null; // New primary state for user data
  lastAttempt: QuizAttempt | null;
  setLastAttempt: (attempt: QuizAttempt | null) => void;
  isProfileComplete: boolean;
  loading: boolean;
  isUserDataLoading: boolean; // Kept for backwards compatibility
  isOffline: boolean;
  updateUserData?: (newData: Partial<DocumentData>) => Promise<void>;
  addQuizAttempt?: (attempt: QuizAttempt) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MANDATORY_PROFILE_FIELDS = [
  'name', 'phone', 'dob', 'gender', 'occupation',
  'upi', 'favoriteFormat', 'favoriteTeam', 'favoriteCricketer'
];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<DocumentData | null>(null);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const auth = getFirebaseAuth();
    if (!auth) {
        setIsLoading(false);
        console.error("Firebase Auth not initialized.");
        return;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (!user) {
        setProfile(null);
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    const firestore = getFirebaseFirestore();
    if (!firestore) {
        setIsLoading(false);
        console.error("Firestore not initialized.");
        setIsOffline(true);
        return;
    }
    
    // ERROR: This onSnapshot fetches the ENTIRE user document on every app start.
    // If the document contains a large `quizHistory` array, this is the primary cause of the app's slow load time.
    // This data should be removed from the main user document and loaded on-demand in the specific pages that need it.
    const userDocRef = doc(firestore, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userDocRef, 
      (docSnap) => {
        setIsOffline(false);
        if (!docSnap.exists()) {
          createUserDocument(user).catch(err => {
            console.error("Failed to create user document on-the-fly:", err);
          });
        } else {
          const data = docSnap.data();
          if (data?.dob && data.dob instanceof Timestamp) {
            data.dob = data.dob.toDate().toISOString().split('T')[0];
          }
          setProfile(data || null);
        }
        setIsLoading(false);
      }, 
      (error) => {
        console.error("🔥 Firestore listener setup failed:", error);
        if (error.code === 'unavailable') {
            setIsOffline(true);
        }
        setIsLoading(false);
      }
    );

    return () => unsubscribeUser();
  }, [user]);


  // ERROR: This function lacks an "optimistic update".
  // The UI has to wait for the database write to complete before it sees the change, making it feel slow.
  // The local `profile` state should be updated immediately before the `setDoc` call.
  const updateUserData = useCallback(async (newData: Partial<DocumentData>) => {
    const firestore = getFirebaseFirestore();
    if (!user || !firestore) {
      console.error("❌ updateUserData: No user or DB not available.");
      throw new Error("Could not save profile. Please check your connection and try again.");
    }
    
    // Optimistic update
    setProfile(prev => ({ ...prev, ...newData }));
    
    const sanitizedData = sanitizeUserProfile(newData);
  
    try {
      const ref = doc(firestore, 'users', user.uid);
      await setDoc(ref, sanitizedData, { merge: true });
    } catch (err) {
      console.error("🔥 updateUserData error:", err);
      // Optional: Rollback optimistic update on failure
      // setProfile(prev => ({ ...prev, ...originalData })); 
      throw new Error("Could not save profile. Please try again.");
    }
  }, [user]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    const firestore = getFirebaseFirestore();
    if (!user || !firestore) throw new Error("User not authenticated or DB not available.");
    
    const currentUserProfile = profile ? { ...profile } : {};
    
    const isPerfect = attempt.score === attempt.totalQuestions && !attempt.reason;
    const newQuizzesPlayed = (currentUserProfile.quizzesPlayed || 0) + 1;
    const newPerfectScores = (currentUserProfile.perfectScores || 0) + (isPerfect ? 1 : 0);
    const newTotalRewards = (currentUserProfile.totalRewards || 0) + (isPerfect ? 100 : 0);

    const userUpdatePayload = {
        quizzesPlayed: newQuizzesPlayed,
        perfectScores: newPerfectScores,
        totalRewards: newTotalRewards
    };
    
    // Optimistic update for user stats
    setProfile(prev => ({ ...prev, ...userUpdatePayload }));
    
    try {
        const userDocRef = doc(firestore, 'users', user.uid);
        await setDoc(userDocRef, sanitizeUserProfile(userUpdatePayload), { merge: true });
        
        const historyDocRef = doc(firestore, 'quizHistory', user.uid);
        const historySnap = await getDoc(historyDocRef);
        const currentHistory = historySnap.exists() ? historySnap.data().attempts : [];
        const newHistory = [sanitizeUserProfile(attempt), ...currentHistory];
        await setDoc(historyDocRef, { attempts: newHistory }, { merge: true });

    } catch (error) {
        console.error("Error adding quiz attempt:", error);
        throw error;
    }
  }, [user, profile]);

  const isProfileComplete = useMemo(() => {
    if (!profile) return false;
    return profile.profileCompleted || MANDATORY_PROFILE_FIELDS.every(field => !!profile[field]);
  }, [profile]);


  const value = useMemo(() => ({
    user,
    userData: profile, // Map userData to profile for some backward compatibility
    profile,
    lastAttempt,
    setLastAttempt,
    isProfileComplete,
    loading: isLoading,
    isUserDataLoading: isLoading, // Map for backward compatibility
    isOffline,
    updateUserData,
    addQuizAttempt,
  }), [user, profile, lastAttempt, isProfileComplete, isLoading, isOffline, updateUserData, addQuizAttempt]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
