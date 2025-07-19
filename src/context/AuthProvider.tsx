
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
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured, isReallyOnline } from '@/lib/firebaseClient';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';

interface AuthContextType {
  user: User | null;
  userData: DocumentData | null;
  lastAttempt: QuizAttempt | null;
  setLastAttempt: (attempt: QuizAttempt | null) => void;
  isProfileComplete: boolean;
  loading: boolean;
  isUserDataLoading: boolean;
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
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);
  
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isUserDataLoading, setIsUserDataLoading] = useState(true);
  
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      console.warn("Firebase not configured. Auth will not work.");
      setIsAuthLoading(false);
      setIsUserDataLoading(false);
      return;
    }

    const checkOnlineStatus = async () => {
      const online = await isReallyOnline();
      setIsOffline(!online);
    };
    
    checkOnlineStatus();
    const interval = setInterval(checkOnlineStatus, 30000); // Check every 30 seconds

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthLoading(false);
    });

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    if (!user) {
      setUserData(null);
      setIsUserDataLoading(false);
      return;
    }

    let unsubscribeUser: (() => void) | undefined;
    
    const setupFirestoreListeners = async () => {
        setIsUserDataLoading(true);

        const online = await isReallyOnline();
        setIsOffline(!online);
        if (!online) {
            console.warn("Client offline, skipping Firestore listeners setup.");
            setIsUserDataLoading(false);
            return;
        }

        try {
            await createUserDocument(user);
            
            const userDocRef = doc(db!, 'users', user.uid);
            
            unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
                const data = docSnap.data();
                if (data?.dob && data.dob instanceof Timestamp) {
                  data.dob = data.dob.toDate().toISOString().split('T')[0];
                }
                setUserData(data || null);
                setIsUserDataLoading(false);
            }, (error) => {
                console.error("Error listening to user document:", error);
                setIsUserDataLoading(false);
            });

        } catch (error) {
            console.error("🔥 Firestore listener setup failed:", error);
            setIsUserDataLoading(false);
        }
    };
    
    setupFirestoreListeners();

    return () => {
        if (unsubscribeUser) unsubscribeUser();
    };
  }, [user]);

  const loading = useMemo(() => {
    return isAuthLoading || (!!user && isUserDataLoading);
  }, [isAuthLoading, user, isUserDataLoading]);
  
  const updateUserData = useCallback(async (newData: Partial<DocumentData>) => {
    if (!user || !db) {
      console.error("❌ updateUserData: No user or DB not available.");
      throw new Error("Could not save profile. Please check your connection and try again.");
    }
    
    const online = await isReallyOnline();
    if (!online) {
        throw new Error("You are offline. Cannot save profile.");
    }
    
    const sanitizedData = sanitizeUserProfile(newData);
    
    // Optimistic update
    setUserData(prev => ({ ...prev, ...sanitizedData }));
  
    try {
      const ref = doc(db, 'users', user.uid);
      await setDoc(ref, sanitizedData, { merge: true });
    } catch (err) {
      console.error("🔥 updateUserData error:", err);
      // Optional: Rollback optimistic update on error
      // This is complex and depends on UX requirements.
      // For now, we just log the error.
      throw new Error("Could not save profile. Please try again.");
    }
  }, [user]);

  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    if (!user || !db || isOffline) throw new Error("User not authenticated, DB not available, or client is offline.");
    
    const historyDocRef = doc(db, 'quizHistory', user.uid);
    const userDocRef = doc(db, 'users', user.uid);
    
    // Create a temporary copy for calculation to avoid race condition with state
    const currentUserData = userData ? { ...userData } : {};
    
    const isPerfect = attempt.score === attempt.totalQuestions && !attempt.reason;
    const newQuizzesPlayed = (currentUserData.quizzesPlayed || 0) + 1;
    const newPerfectScores = (currentUserData.perfectScores || 0) + (isPerfect ? 1 : 0);
    const newTotalRewards = (currentUserData.totalRewards || 0) + (isPerfect ? 100 : 0);

    const userUpdatePayload = {
        quizzesPlayed: newQuizzesPlayed,
        perfectScores: newPerfectScores,
        totalRewards: newTotalRewards
    };
    
    // Optimistically update the user data in the UI
    setUserData(prev => ({ ...prev, ...userUpdatePayload }));
    
    try {
        await setDoc(userDocRef, sanitizeUserProfile(userUpdatePayload), { merge: true });
        
        const historySnap = await getDoc(historyDocRef);
        const currentHistory = historySnap.exists() ? historySnap.data().attempts : [];
        const newHistory = [sanitizeUserProfile(attempt), ...currentHistory];
        await setDoc(historyDocRef, { attempts: newHistory }, { merge: true });

    } catch (error) {
        console.error("Error adding quiz attempt:", error);
        // If the update fails, we might want to roll back the optimistic update
        // For simplicity, we are not doing that here, but it's a consideration for production apps.
        throw error;
    }
  }, [user, userData, isOffline]);

  const isProfileComplete = useMemo(() => {
    if (!userData) return false;
    return userData.profileCompleted || MANDATORY_PROFILE_FIELDS.every(field => !!userData[field]);
  }, [userData]);


  const value = useMemo(() => ({
    user,
    userData,
    lastAttempt,
    setLastAttempt,
    isProfileComplete,
    loading,
    isUserDataLoading,
    isOffline,
    updateUserData,
    addQuizAttempt,
  }), [user, userData, lastAttempt, isProfileComplete, loading, isUserDataLoading, isOffline, updateUserData, addQuizAttempt]);

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

    