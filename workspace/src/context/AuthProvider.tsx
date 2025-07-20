
'use client';

import type { User } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, Timestamp, onSnapshot, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { getFirebaseAuth, getFirebaseFirestore, isFirebaseOnline } from '@/lib/firebaseClient';
import { sanitizeUserProfile } from '@/lib/sanitizeUserProfile';
import type { QuizAttempt } from '@/lib/mockData';
import { createUserDocument } from '@/lib/authUtils';

interface AuthContextType {
  user: User | null;
  profile: Record<string, any> | null;
  loading: boolean;
  isOffline: boolean;
  updateUserData?: (data: Partial<Record<string, any>>) => Promise<void>;
  addQuizAttempt?: (attempt: QuizAttempt) => Promise<void>;
  quizHistory: QuizAttempt[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Record<string, any> | null>(null);
  const [quizHistory, setQuizHistory] = useState<QuizAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const auth = getFirebaseAuth();
    if (!auth) { setLoading(false); return; }
    const unsub = onAuthStateChanged(auth, setUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setQuizHistory([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const db = getFirebaseFirestore();
    if (!db) {
        setLoading(false);
        return;
    }

    // Listener for user profile
    const profileRef = doc(db, "users", user.uid);
    const unsubProfile = onSnapshot(profileRef, async (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        if (data?.dob && data.dob instanceof Timestamp) {
            data.dob = data.dob.toDate().toISOString().split("T")[0];
        }
        setProfile(data);
      } else {
        await createUserDocument(user);
        // Snapshot will re-trigger with new doc, so no need to setProfile here
      }
      setLoading(false); // Set loading to false once profile is processed
    }, (error) => {
        console.error("Profile fetch error:", error);
        setLoading(false);
    });

    // One-time fetch for initial quiz history
    const historyQuery = query(
        collection(db, "quizHistory", user.uid, "attempts"),
        orderBy("timestamp", "desc"),
        limit(20)
    );
    getDocs(historyQuery).then(snap => {
        const history = snap.docs.map(d => d.data() as QuizAttempt);
        setQuizHistory(history);
    }).catch(err => console.error("Initial history fetch failed:", err));


    // Listener for recent additions to quiz history
    const recentHistoryQuery = query(
        collection(db, "quizHistory", user.uid, "attempts"),
        orderBy("timestamp", "desc"),
        limit(1)
    );
    const unsubHistory = onSnapshot(recentHistoryQuery, (snap) => {
        snap.docChanges().forEach((change) => {
            if (change.type === "added") {
                const newAttempt = change.doc.data() as QuizAttempt;
                setQuizHistory(prev => {
                    if (prev.find(p => p.slotId === newAttempt.slotId)) {
                        return prev;
                    }
                    return [newAttempt, ...prev].sort((a,b) => b.timestamp - a.timestamp);
                });
            }
        });
    });

    return () => {
      unsubProfile();
      unsubHistory();
    };
  }, [user]);

  const updateUserData = useCallback(async (newData: Partial<Record<string, any>>) => {
    const db = getFirebaseFirestore();
    if (!user || !db) throw new Error("User or DB not available");
    setProfile(prev => ({ ...prev, ...newData })); // Optimistic
    await setDoc(doc(db, "users", user.uid), sanitizeUserProfile(newData), { merge: true });
  }, [user]);
  
  const addQuizAttempt = useCallback(async (attempt: QuizAttempt) => {
    const db = getFirebaseFirestore();
    if (!user || !db) throw new Error("User not authenticated or DB not available.");

    const sanitizedAttempt = sanitizeUserProfile(attempt) as QuizAttempt;

    // Use a unique ID for the document, e.g., the slotId
    const attemptRef = doc(db, "quizHistory", user.uid, "attempts", sanitizedAttempt.slotId);
    
    // Update user stats optimistically
    const isPerfect = sanitizedAttempt.score === sanitizedAttempt.totalQuestions && !sanitizedAttempt.reason;
    const newStats = {
      quizzesPlayed: (profile?.quizzesPlayed || 0) + 1,
      perfectScores: (profile?.perfectScores || 0) + (isPerfect ? 1 : 0),
      totalRewards: (profile?.totalRewards || 0) + (isPerfect ? 100 : 0),
    };
    updateUserData(newStats);

    // Write to Firestore
    await setDoc(attemptRef, sanitizedAttempt, { merge: true });

  }, [user, profile, updateUserData]);

  const value = useMemo(() => ({
    user,
    profile,
    loading,
    isOffline,
    updateUserData,
    quizHistory,
    addQuizAttempt,
  }), [user, profile, loading, isOffline, updateUserData, quizHistory, addQuizAttempt]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
