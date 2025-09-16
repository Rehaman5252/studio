
'use client';

import type { User } from 'firebase/auth';
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useRef,
} from 'react';
import {
  signOut,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signInWithEmailAndPassword as firebaseSignInWithEmail,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
  onSnapshot,
  writeBatch,
  arrayUnion,
  Timestamp,
  collection,
  query,
  where,
  limit,
  getDocs,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { sanitizeUserProfile, sanitizeQuizAttempt } from '@/lib/sanitizeUserProfile';
import type { QuizAttempt } from '@/ai/schemas';
import { QuizAttempt as QuizAttemptSchema } from '@/ai/schemas';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/providers/FirebaseProvider';
import { getQuizSlotId, mapFirestoreError } from '@/lib/utils';
import { isProfileConsideredComplete } from '@/lib/profile-utils';
import { z } from 'zod';

/* -------------------------------- Types ------------------------------- */

export interface UserProfile {
  uid: string;
  name: string;
  photoURL?: string;
  currentStreak: number;
  longestStreak: number;
  lastPlayedAt?: Timestamp;
  referredBy?: string;
  noBallCount: number;
  lastNoBallTimestamp?: Timestamp;
  quizzesPlayed?: number;
  perfectScores?: number;
  totalRewards?: number;
  totalScore?: number;
  [key: string]: any;
}


interface UserDataContextType {
  user: User | null;
  profile: UserProfile | null;
  isProfileComplete: boolean;
  loading: boolean;
  firebaseAppReady: boolean; // Expose firebase readiness

  // Attempt data
  lastAttemptInSlot: QuizAttempt | null;
  quizHistory: {
    data: QuizAttempt[];
    loading: boolean;
    error: string | null;
  };

  // Auth & actions
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<User | null>;
  registerWithEmail: (
    name: string,
    email: string,
    phone: string,
    password: string,
    referralCode?: string
  ) => Promise<User | null>;
  loginWithEmail: (email: string, password: string) => Promise<User | null>;

  // Writes
  addQuizAttempt: (attempt: QuizAttempt) => Promise<{ success: boolean; attemptId?: string; error?: string; queued?: boolean }>;
  updateUserData: (data: Partial<UserProfile>) => Promise<void>;
  handleMalpractice: () => Promise<number>;
  markAttemptAsReviewed: (attemptId: string) => Promise<{ success: boolean, reason?: string }>;

  // Connectivity
  isOffline: boolean;
}

/* --------------------------- Context bootstrap -------------------------- */

const AuthContext = createContext<UserDataContextType | undefined>(undefined);

/* --------------------------- Offline queue utils ------------------------ */

const PENDING_KEY = 'quiz-pending-attempts';

function readPending(): QuizAttempt[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PENDING_KEY);
    return raw ? (JSON.parse(raw) as QuizAttempt[]) : [];
  } catch {
    return [];
  }
}

function writePending(list: QuizAttempt[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }
}

function pushPending(attempt: QuizAttempt) {
  const list = readPending();
  const next = [attempt, ...list.filter((a) => a.slotId !== attempt.slotId)];
  writePending(next);
}

function popPending(slotId: string) {
  const list = readPending().filter((a) => a.slotId !== slotId);
  writePending(list);
}

/* ------------------------------- Provider ------------------------------- */

export const UserDataProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: firebaseLoading } = useFirebase();
  const { toast } = useToast();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);

  const [lastAttemptInSlot, setLastAttemptInSlot] = useState<QuizAttempt | null>(null);
  const [quizHistory, setQuizHistory] = useState<{ data: QuizAttempt[]; loading: boolean; error: string | null }>({
    data: [],
    loading: true,
    error: null,
  });
  const quizHistoryCache = useRef<QuizAttempt[]>([]);
  
  const [firebaseAppReady, setFirebaseAppReady] = useState(false);
  useEffect(() => {
    setFirebaseAppReady(isFirebaseConfigured);
  }, []);


  /* ---------------------------- Online/offline ---------------------------- */

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    setIsOffline(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  /* ----------------------- Create/maintain user doc ----------------------- */

  const handleUserDocument = useCallback(
    async (u: User, additionalData: Record<string, any> = {}) => {
      if (!db) {
        toast({
          title: 'Connection Error',
          description: 'Database not available. You might be offline.',
          variant: 'destructive',
        });
        throw new Error('Database not available');
      }
      const userRef = doc(db, 'users', u.uid);
      let referredBy = '';

      if (additionalData.referralCode) {
        const usersCol = collection(db, 'users');
        const q = query(usersCol, where('referralCode', '==', additionalData.referralCode), limit(1));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          referredBy = querySnapshot.docs[0].id;
        } else {
          console.warn(`Referral code "${additionalData.referralCode}" not found.`);
        }
      }

      const docSnap = await getDoc(userRef);

      if (!docSnap.exists()) {
        const name = additionalData.name || u.displayName || 'New User';
        const newUserProfile: UserProfile = {
          uid: u.uid,
          name,
          email: u.email,
          phone: additionalData.phone || '',
          photoURL: u.photoURL || `https://placehold.co/100x100.png`,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          lastPlayedAt: null,
          emailVerified: u.emailVerified,
          referredBy,
          referralBonusPaid: false,
          quizzesPlayed: 0,
          perfectScores: 0,
          totalRewards: 0,
          totalScore: 0,
          profileCompleted: false,
          guidedTourCompleted: false,
          phoneVerified: false,
          referralCode: `ref${u.uid.substring(0, 4)}`,
          referralEarnings: 0,
          noBallCount: 0,
          lastNoBallTimestamp: null,
          currentStreak: 0,
          longestStreak: 0,
          lastStreakTimestamp: null,
        } as any;

        await setDoc(userRef, sanitizeUserProfile(newUserProfile));

        if (referredBy) {
          const referrerRef = doc(db, 'users', referredBy);
          await updateDoc(referrerRef, {
            referrals: arrayUnion(u.uid),
          });
        }

        return newUserProfile;
      } else {
        const existingData = docSnap.data() as UserProfile;
        const updates: Record<string, any> = {};
        if (u.photoURL && u.photoURL !== existingData.photoURL) {
          updates.photoURL = u.photoURL;
        }
        if (Object.keys(updates).length > 0) {
          await updateDoc(userRef, updates);
        }
        return { ...existingData, ...updates };
      }
    },
    [toast]
  );

  /* ------------------------- Primary subscriptions ------------------------ */

  useEffect(() => {
    let isMounted = true;
    let unsubs: Unsubscribe[] = [];

    if (firebaseLoading || !firebaseAppReady || !db) {
      if (isMounted) setProfileLoading(true);
      return;
    }

    if (!user) {
      if (isMounted) {
        setProfile(null);
        setProfileLoading(false);
        setLastAttemptInSlot(null);
        setQuizHistory({ data: [], loading: false, error: null });
        quizHistoryCache.current = [];
      }
      return;
    }

    // Profile
    if (isMounted) setProfileLoading(true);
    const userRef = doc(db, 'users', user.uid);
    unsubs.push(onSnapshot(
      userRef,
      (docSnap) => {
        if (!isMounted) return;
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          handleUserDocument(user).catch(console.error);
          setProfile(null);
        }
        setProfileLoading(false);
      },
      (error) => {
        if (!isMounted) return;
        console.error('Error fetching profile with onSnapshot:', error);
        setProfile(null);
        setProfileLoading(false);
      }
    ));

    // Last attempt within current slot
    const currentSlotId = getQuizSlotId();
    const attemptDocRef = doc(collection(db, 'users', user.uid, 'quizAttempts'), currentSlotId);
    unsubs.push(onSnapshot(
      attemptDocRef,
      (docSnap) => {
        if (!isMounted) return;
        setLastAttemptInSlot(docSnap.exists() ? (docSnap.data() as QuizAttempt) : null);
      },
      (error) => {
        if (!isMounted) return;
        console.warn('Could not listen to slot attempt:', error.message);
        setLastAttemptInSlot(null);
      }
    ));

    // Full history
    if (isMounted) setQuizHistory((prev) => ({ ...prev, loading: true, error: null }));
    const historyQuery = query(
      collection(db, 'users', user.uid, 'quizAttempts'),
      orderBy('timestamp', 'desc')
    );
    unsubs.push(
      onSnapshot(
        historyQuery,
        (querySnapshot) => {
          if (!isMounted) return;

          const historyData: QuizAttempt[] = [];
          querySnapshot.forEach((docSnap) => {
            const raw = docSnap.data();
            const sanitized = sanitizeQuizAttempt(raw);
            const parsed = QuizAttemptSchema.safeParse(sanitized);

            if (parsed.success) {
              historyData.push(parsed.data);
            } else {
              console.warn(
                `⚠️ Skipped invalid quiz attempt [${docSnap.id}] from Firestore:`,
                parsed.error.flatten()
              );
            }
          });

          quizHistoryCache.current = historyData;
          setQuizHistory({ data: historyData, loading: false, error: null });
        },
        (error) => {
          if (!isMounted) return;
          console.error('Error fetching quiz history:', error);
          const mappedError = mapFirestoreError(error);
          // On error, serve from cache but still surface the error message
          setQuizHistory({
            data: quizHistoryCache.current,
            loading: false,
            error: mappedError.userMessage,
          });
        }
      )
    );

    return () => {
      isMounted = false;
      unsubs.forEach((unsub) => {
        try {
          unsub();
        } catch (e) {
          console.warn("Failed to unsubscribe from listener in AuthProvider", e);
        }
      });
      unsubs = [];
    };
  }, [user, firebaseLoading, handleUserDocument, firebaseAppReady]);
  

  /* -------------------------- Auth convenience --------------------------- */

  const signInWithGoogle = useCallback(async (): Promise<User | null> => {
    if (!auth) return null;
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      await handleUserDocument(result.user);
      toast({ title: 'Signed In', description: 'Welcome back!' });
      return result.user;
    } catch (error: any) {
      if (error.code !== 'auth/popup-closed-by-user') {
        console.error('Google Sign-In Error:', error);
        toast({ title: 'Sign-in Error', description: 'Could not sign in with Google.', variant: 'destructive' });
      }
      return null;
    }
  }, [toast, handleUserDocument]);

  const registerWithEmail = useCallback(
    async (
      name: string,
      email: string,
      phone: string,
      password: string,
      referralCode?: string
    ): Promise<User | null> => {
      if (!auth) return null;
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const { user: userCredentialUser } = userCredential;
        await updateProfile(userCredentialUser, { displayName: name });
        await handleUserDocument(userCredentialUser, { name, phone, referralCode });
        await sendEmailVerification(userCredentialUser);
        toast({ title: 'Account created', description: 'Verification email sent.' });
        return userCredentialUser;
      } catch (error: any) {
        let description = 'An unexpected error occurred. Please try again.';
        if (error.code === 'auth/email-already-in-use') {
          description = 'This email is already registered. Please log in instead.';
        } else if (error.code === 'auth/weak-password') {
          description = 'The password is too weak. Please use at least 8 characters.';
        }
        console.error('Registration Error: ', error);
        toast({ title: 'Sign Up Failed', description, variant: 'destructive' });
        return null;
      }
    },
    [toast, handleUserDocument]
  );

  const loginWithEmail = useCallback(
    async (email: string, password: string): Promise<User | null> => {
      if (!auth) return null;
      try {
        const userCredential = await firebaseSignInWithEmail(auth, email, password);
        toast({ title: 'Signed In', description: 'Welcome back!' });
        return userCredential.user;
      } catch (error: any) {
        let description = 'An unexpected error occurred.';
        if (
          error.code === 'auth/invalid-credential' ||
          error.code === 'auth/user-not-found' ||
          error.code === 'auth/wrong-password'
        ) {
          description = 'Invalid credentials. Please check your email and password.';
        }
        toast({ title: 'Login Failed', description, variant: 'destructive' });
        return null;
      }
    },
    [toast]
  );

  const logout = useCallback(async () => {
    if (!auth) return;
    await signOut(auth);
    toast({ title: 'Signed Out', description: 'You have been logged out successfully.' });
  }, [toast]);

  /* ------------------------------ Profile edit --------------------------- */

  const updateUserData = useCallback(
    async (data: Partial<UserProfile>) => {
      if (!user || !db) return;
      const allowedFields = [
        'name',
        'phone',
        'photoURL',
        'profileCompleted',
        'guidedTourCompleted',
        'dob',
        'gender',
        'occupation',
        'upi',
        'favoriteFormat',
        'favoriteTeam',
        'favoriteCricketer',
        'phoneVerified',
      ];
      const filteredData: Partial<UserProfile> = Object.keys(data).reduce((acc: any, key) => {
        if (allowedFields.includes(key)) acc[key] = (data as any)[key];
        return acc;
      }, {});

      if (Object.keys(filteredData).length === 0) return;

      try {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { ...sanitizeUserProfile(filteredData), updatedAt: serverTimestamp() });
        setIsOffline(false);
      } catch (e) {
        console.error('updateUserData failed:', e);
        toast({
          title: 'Update Failed',
          description: 'Your changes could not be saved. You might be offline.',
          variant: 'destructive',
        });
        setIsOffline(true);
        throw e;
      }
    },
    [user, toast]
  );

  /* --------------------------- Attempt persistence ----------------------- */

const persistAttemptBatch = useCallback(
    async (attempt: QuizAttempt) => {
        if (!user || !db) throw new Error('Missing user/db');
        
        const validatedAttempt = QuizAttemptSchema.parse(sanitizeQuizAttempt(attempt));

        const batch = writeBatch(db);
        const userDocRef = doc(db, 'users', user.uid);
        const statsDocRef = doc(db, 'globals', 'stats');

        // 1. Get current user stats for streak calculation
        const userSnap = await getDoc(userDocRef);
        if (!userSnap.exists()) {
            throw new Error("User document does not exist, cannot update stats.");
        }
        const userData = userSnap.data() as UserProfile;

        // 2. Base User & Global Stats Update
        const isPerfectScore = validatedAttempt.score === validatedAttempt.totalQuestions && !validatedAttempt.reason;
        const userStatsUpdate: Record<string, any> = {
            quizzesPlayed: increment(1),
            totalScore: increment(validatedAttempt.score || 0),
            perfectScores: increment(isPerfectScore ? 1 : 0),
            lastPlayedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        };

        const globalStatsUpdate: Record<string, any> = {
             totalQuizzesPlayed: increment(1) 
        };
        if (isPerfectScore) {
            globalStatsUpdate.totalPerfectScores = increment(1);
        }

        // 3. Streak Logic
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastPlayed = userData.lastPlayedAt ? userData.lastPlayedAt.toDate() : null;
        if (!lastPlayed) {
            // First quiz ever
            userStatsUpdate.currentStreak = 1;
            userStatsUpdate.longestStreak = 1;
        } else {
            const lastPlayedDay = new Date(lastPlayed);
            lastPlayedDay.setHours(0, 0, 0, 0);
            
            const daysDiff = (today.getTime() - lastPlayedDay.getTime()) / (1000 * 60 * 60 * 24);

            if (daysDiff === 1) { // Continued streak
                const newStreak = (userData.currentStreak || 0) + 1;
                userStatsUpdate.currentStreak = newStreak;
                if (newStreak > (userData.longestStreak || 0)) {
                    userStatsUpdate.longestStreak = newStreak;
                }
            } else if (daysDiff > 1) { // Reset streak
                userStatsUpdate.currentStreak = 1;
            }
            // If daysDiff is 0, do nothing (already played today).
        }
        

        // 4. Add updates to batch
        batch.update(userDocRef, userStatsUpdate);
        batch.set(statsDocRef, globalStatsUpdate, { merge: true });

        // 5. Quiz Attempt Document. Use serverTimestamp for the 'timestamp' field.
        const attemptRef = doc(db, 'users', user.uid, 'quizAttempts', validatedAttempt.slotId!);
        batch.set(attemptRef, { ...validatedAttempt, timestamp: serverTimestamp() });

        // 6. Live Leaderboard Entry
        const liveEntryRef = doc(db, 'leaderboard_live', validatedAttempt.slotId!, 'entries', user.uid);
        const totalTime = validatedAttempt.timePerQuestion?.reduce((a: number, b: number) => a + b, 0) || 0;
        batch.set(
            liveEntryRef,
            {
                userId: user.uid,
                name: userData.name || "Anonymous",
                avatar: userData.photoURL || '',
                score: validatedAttempt.score,
                time: totalTime,
                disqualified: !!validatedAttempt.reason,
            },
            { merge: true }
        );
        
        await batch.commit();
    },
    [user]
);


  // Public API
  const addQuizAttempt = useCallback(
    async (attempt: QuizAttempt): Promise<{ success: boolean; attemptId?: string; error?: string; queued?: boolean }> => {
      if (!user || !db) {
        const msg = 'User not authenticated or database unavailable.';
        toast({ title: 'Save Failed', description: msg, variant: 'destructive' });
        pushPending(attempt);
        return { success: false, error: msg, queued: true };
      }

      try {
        await persistAttemptBatch(attempt);
        popPending(attempt.slotId);
        setIsOffline(false);
        return { success: true, attemptId: attempt.slotId };
      } catch (e: any) {
        console.error('addQuizAttempt failed:', e);
        let errMsg = "An unexpected error occurred during submission.";
        if (e instanceof z.ZodError) {
          errMsg = "Your quiz data was invalid. Please try again.";
          console.error("Zod validation failed:", e.format());
        } else if (e.message) {
          errMsg = `Could not save your quiz result now. (${e.message}) It will auto-sync when you are back online.`;
        }
        
        toast({
          title: 'Sync Error',
          description: errMsg,
          variant: 'destructive',
          duration: 10000,
        });
        pushPending(attempt);
        setIsOffline(true);
        return { success: false, error: e.message, queued: true, attemptId: attempt.slotId };
      }
    },
    [persistAttemptBatch, toast, user]
  );

  // Auto-retry queued attempts when user/db/online becomes available
  useEffect(() => {
    const tryFlush = async () => {
      if (!user || !db || isOffline) return;
      const list = readPending();
      if (!list.length) return;

      toast({
        title: 'Reconnecting...',
        description: `Syncing ${list.length} pending quiz attempt(s).`,
      });

      for (const a of list) {
        try {
          await persistAttemptBatch(a);
          popPending(a.slotId);
        } catch (e) {
          console.warn('Retry persist failed for', a.slotId, e);
          break;
        }
      }
    };
    tryFlush();
  }, [user, db, isOffline, persistAttemptBatch, toast]);

  /* ------------------------------ Malpractice ---------------------------- */

  const handleMalpractice = useCallback(async (): Promise<number> => {
    if (!user || !profile || !db) return profile?.noBallCount ?? 0;

    let newNoBallCount = profile.noBallCount || 0;

    try {
      const userDocRef = doc(db, 'users', user.uid);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const lastNoBallDay = profile.lastNoBallTimestamp
        ? new Date((profile.lastNoBallTimestamp as Timestamp).toMillis())
        : null;
      if (lastNoBallDay) lastNoBallDay.setHours(0, 0, 0, 0);

      if (!lastNoBallDay || lastNoBallDay.getTime() !== today.getTime()) {
        newNoBallCount = 1;
      } else {
        newNoBallCount++;
      }

      await updateDoc(userDocRef, {
        noBallCount: newNoBallCount,
        lastNoBallTimestamp: serverTimestamp(),
      });
      setIsOffline(false);
      return newNoBallCount;
    } catch (e) {
      console.error('handleMalpractice failed:', e);
      setIsOffline(true);
      return newNoBallCount;
    }
  }, [user, profile]);

  /* ------------------------------- Reviewed ------------------------------ */

  const markAttemptAsReviewed = useCallback(
    async (attemptId: string): Promise<{ success: boolean; reason?: string }> => {
      if (!user || !db) {
        console.warn('markAttemptAsReviewed blocked: missing user or db', { user, db });
        return { success: false, reason: 'User not authenticated or database unavailable' };
      }
  
      try {
        const attemptRef = doc(db, 'users', user.uid, 'quizAttempts', attemptId);
  
        // Check if the attempt exists
        const snap = await getDoc(attemptRef);
        if (!snap.exists()) {
          console.warn('Attempt document does not exist', { attemptId });
          return { success: false, reason: 'Attempt document not found' };
        }
  
        // Update the reviewed flag
        await updateDoc(attemptRef, { reviewed: true });
  
        // Update local state immediately
        setQuizHistory((prev) => ({
          ...prev,
          data: prev.data.map((a) =>
            a.slotId === attemptId ? { ...a, reviewed: true } : a
          ),
        }));
  
        return { success: true };
      } catch (error: any) {
        console.error('Failed to mark attempt as reviewed:', error);
  
        let reason = 'Unknown error';
        if (error.code === 'permission-denied') reason = 'Insufficient permissions';
        else if (error.code === 'unavailable') reason = 'Network or Firestore unavailable';
        else if (error.message) reason = error.message;
  
        return { success: false, reason };
      }
    },
    [user]
  );

  /* ------------------------------ Context val ---------------------------- */

  const value: UserDataContextType = {
    user,
    loading: firebaseLoading || profileLoading,
    profile,
    isProfileComplete: isProfileConsideredComplete(profile),
    firebaseAppReady,
    quizHistory,
    lastAttemptInSlot,
    logout,
    signInWithGoogle,
    registerWithEmail,
    loginWithEmail,
    updateUserData,
    addQuizAttempt,
    handleMalpractice,
    markAttemptAsReviewed,
    isOffline,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/* ---------------------------------- Hook --------------------------------- */

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a UserDataProvider');
  }
  return context;
}
