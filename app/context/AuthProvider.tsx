
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
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { sanitizeUserProfile, sanitizeQuizAttempt } from '@/lib/sanitizeUserProfile';
import type { QuizAttempt } from '@/ai/schemas';
import { useToast } from '@/hooks/use-toast';
import { useFirebase } from '@/providers/FirebaseProvider';
import { getQuizSlotId, mapFirestoreError } from '@/lib/utils';
import { isProfileConsideredComplete } from '@/lib/profile-utils';
import type { AllTimePlayer, LivePlayer } from '@/components/leaderboard/leaderboardTypes';


/* -------------------------------- Types ------------------------------- */

interface UserProfile {
  uid: string;
  name: string;
  photoURL?: string;
  currentStreak: number;
  lastStreakTimestamp?: Timestamp;
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

  // Attempt data
  lastAttemptInSlot: QuizAttempt | null;
  quizHistory: {
    data: QuizAttempt[];
    loading: boolean;
    error: string | null;
  };

  // Leaderboards
  leaderboardLive: {
    slotId: string;
    rows: LivePlayer[];
    loading: boolean;
    error: string | null;
  };
  leaderboardAllTime: {
    rows: AllTimePlayer[];
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
  addQuizAttempt: (attempt: QuizAttempt) => Promise<{ success: boolean; error?: string; queued?: boolean }>;
  updateUserData: (data: Partial<UserProfile>) => Promise<void>;
  handleMalpractice: () => Promise<number>;
  markAttemptAsReviewed: (attemptId: string) => Promise<{ success: boolean }>;

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

  // Leaderboards
  const [leaderboardLive, setLeaderboardLive] = useState<{
    slotId: string;
    rows: LivePlayer[];
    loading: boolean;
    error: string | null;
  }>({
    slotId: getQuizSlotId(),
    rows: [],
    loading: true,
    error: null,
  });

  const [leaderboardAllTime, setLeaderboardAllTime] = useState<{
    rows: AllTimePlayer[];
    loading: boolean;
    error: string | null;
  }>({ rows: [], loading: true, error: null });

  const slotIdRef = useRef<string>(getQuizSlotId());

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
    let unsubs: Array<() => void> = [];

    if (firebaseLoading) {
      setProfileLoading(true);
      return;
    }

    if (!user) {
      setProfile(null);
      setProfileLoading(false);
      setLastAttemptInSlot(null);
      setQuizHistory({ data: [], loading: false, error: null });
      setLeaderboardLive((prev) => ({ ...prev, rows: [], loading: false, error: null }));
      setLeaderboardAllTime({ rows: [], loading: false, error: null });
      return;
    }

    if (!isFirebaseConfigured || !db) {
      console.error('Firestore (db) is not available, possibly due to SSR or missing config.');
      setProfileLoading(false);
      return;
    }

    // Profile
    setProfileLoading(true);
    const userRef = doc(db, 'users', user.uid);
    const unsubscribeProfile = onSnapshot(
      userRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setProfile(docSnap.data() as UserProfile);
        } else {
          handleUserDocument(user).catch(console.error);
          setProfile(null);
        }
        setProfileLoading(false);
        setIsOffline(false);
      },
      (error) => {
        console.error('Error fetching profile with onSnapshot:', error);
        setProfile(null);
        setProfileLoading(false);
        setIsOffline(true);
      }
    );
    unsubs.push(unsubscribeProfile);

    // Last attempt within current slot
    const currentSlotId = getQuizSlotId();
    const attemptDocRef = doc(collection(db, 'users', user.uid, 'quizAttempts'), currentSlotId);
    const unsubscribeAttempt = onSnapshot(
      attemptDocRef,
      (docSnap) => {
        setLastAttemptInSlot(docSnap.exists() ? (docSnap.data() as QuizAttempt) : null);
      },
      (error) => {
        console.warn('Could not listen to slot attempt:', error.message);
        setLastAttemptInSlot(null);
        setIsOffline(true);
      }
    );
    unsubs.push(unsubscribeAttempt);

    // Full history
    setQuizHistory((prev) => ({ ...prev, loading: true }));
    const historyQuery = query(
      collection(db, 'users', user.uid, 'quizAttempts'),
      orderBy('timestamp', 'desc')
    );
    const unsubscribeHistory = onSnapshot(
      historyQuery,
      (querySnapshot) => {
        const historyData = querySnapshot.docs.map((d) => d.data() as QuizAttempt);
        setQuizHistory({ data: historyData, loading: false, error: null });
        setIsOffline(false);
      },
      (error) => {
        console.error('Error fetching quiz history:', error);
        setQuizHistory({ data: [], loading: false, error: mapFirestoreError(error) });
        setIsOffline(true);
      }
    );
    unsubs.push(unsubscribeHistory);

    // Live leaderboard (current slot)
    const startLiveLeaderboardListener = (slotId: string) => {
      setLeaderboardLive({ slotId, rows: [], loading: true, error: null });
      const liveQ = query(
        collection(db, 'leaderboard_live', slotId, 'entries'),
        orderBy('score', 'desc'),
        orderBy('time', 'asc'),
        limit(100)
      );
      const unsub = onSnapshot(
        liveQ,
        (qs) => {
          const rows = qs.docs.map((d) => d.data() as LivePlayer);
          setLeaderboardLive({ slotId, rows, loading: false, error: null });
          setIsOffline(false);
        },
        (err) => {
          console.error('Live leaderboard error:', err);
          setLeaderboardLive((prev) => ({ ...prev, loading: false, error: mapFirestoreError(err) }));
          setIsOffline(true);
        }
      );
      return unsub;
    };

    let liveUnsub = startLiveLeaderboardListener(currentSlotId);
    unsubs.push(() => liveUnsub && liveUnsub());

    // Rotate listener when slot changes (every ~10s check)
    const slotTicker = setInterval(() => {
      const newSlot = getQuizSlotId();
      if (newSlot !== slotIdRef.current) {
        slotIdRef.current = newSlot;
        liveUnsub && liveUnsub();
        liveUnsub = startLiveLeaderboardListener(newSlot);
      }
    }, 10_000);
    unsubs.push(() => clearInterval(slotTicker));

    // All-time leaderboard (from users collection)
    setLeaderboardAllTime((prev) => ({ ...prev, loading: true }));

    const buildAllTimeListener = () => {
      try {
        const allTimeQ = query(
          collection(db, 'users'),
          orderBy('totalScore', 'desc'),
          orderBy('perfectScores', 'desc'),
          orderBy('quizzesPlayed', 'asc'),
          limit(100)
        );

        const unsubscribe = onSnapshot(
          allTimeQ,
          (qs) => {
            const rows: AllTimePlayer[] = qs.docs.map((d) => {
              const u = d.data() as UserProfile;
              return {
                uid: u.uid,
                name: u.name,
                avatar: u.photoURL,
                totalScore: u.totalScore ?? 0,
                perfectScores: u.perfectScores ?? 0,
                quizzesPlayed: u.quizzesPlayed ?? 0,
                isCurrentUser: user?.uid === u.uid,
              };
            });
            setLeaderboardAllTime({ rows, loading: false, error: null });
          },
          (err) => {
            console.error('All-time leaderboard snapshot error:', err);
            // If Firestore says index missing (failed-precondition), fall back to safe query
            const code = err?.code || '';
            if (code === 'failed-precondition' || (err?.message && err.message.includes('requires an index'))) {
              console.warn('All-time leaderboard: missing composite index. Falling back to single-field query + client-side sort.');
              // console prints link if present in message
              const match = err?.message?.match(/https:\\/\\/console\\.firebase\\.google\\.com\\/[^\\s]+/);
              if (match && match[0]) console.info('Create index link:', match[0]);
    
              // fallback: query only by totalScore and perform the remaining ordering in-memory
              query(
                collection(db, 'users'),
                orderBy('totalScore', 'desc'),
                limit(500)
              )
                .with_converter(null as any) // noop to satisfy typing; not mandatory
              // use getDocs for the fallback (one-shot)
              .then(async () => {
                // getDocs approach:
                const { getDocs } = await import('firebase/firestore');
                const snap = await getDocs(query(collection(db, 'users'), orderBy('totalScore', 'desc'), limit(500)));
                const arr = snap.docs.map(d => d.data() as UserProfile);
                // client-side stable sort using tie-breaks: perfectScores desc, quizzesPlayed asc
                arr.sort((a, b) => {
                  const s = (b.totalScore ?? 0) - (a.totalScore ?? 0);
                  if (s !== 0) return s;
                  const p = (b.perfectScores ?? 0) - (a.perfectScores ?? 0);
                  if (p !== 0) return p;
                  return (a.quizzesPlayed ?? 0) - (b.quizzesPlayed ?? 0);
                });
                const rows: AllTimePlayer[] = arr.slice(0, 100).map(u => ({
                  uid: u.uid,
                  name: u.name,
                  avatar: u.photoURL,
                  totalScore: u.totalScore ?? 0,
                  perfectScores: u.perfectScores ?? 0,
                  quizzesPlayed: u.quizzesPlayed ?? 0,
                  isCurrentUser: user?.uid === u.uid,
                }));
                setLeaderboardAllTime({ rows, loading: false, error: 'Partial results: composite index missing; showing best-effort ranking.' });
              }).catch(fbErr => {
                console.error('Fallback all-time query failed:', fbErr);
                setLeaderboardAllTime({ rows: [], loading: false, error: mapFirestoreError(fbErr) });
              });
            } else {
              setLeaderboardAllTime({ rows: [], loading: false, error: mapFirestoreError(err) });
            }
          }
        );
        return unsubscribe;
      } catch (err: any) {
        console.error('Failed to start All-time leaderboard listener:', err);
        setLeaderboardAllTime({ rows: [], loading: false, error: mapFirestoreError(err) });
        return () => {};
      }
    };
    
    const unsubscribeAllTime = buildAllTimeListener();
    unsubs.push(unsubscribeAllTime);

    return () => {
      unsubs.forEach((u) => u && u());
    };
  }, [user, firebaseLoading, handleUserDocument]);

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
    async (newData: Partial<UserProfile>) => {
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
      const filteredData: Partial<UserProfile> = Object.keys(newData).reduce((acc: any, key) => {
        if (allowedFields.includes(key)) acc[key] = (newData as any)[key];
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
      if (!user || !profile || !db) throw new Error('Missing user/profile/db');
  
      const sanitizedAttempt = sanitizeQuizAttempt(attempt) as QuizAttempt;
  
      const batch = writeBatch(db);
      const userDocRef = doc(db, 'users', user.uid);
      const statsDocRef = doc(db, 'globals', 'stats');
  
      // Use set with merge:true for user and global stats to create doc if non-existent
      const userStatsUpdate: Record<string, any> = {
        quizzesPlayed: increment(1),
        totalScore: increment(sanitizedAttempt.score),
        updatedAt: serverTimestamp(),
      };
  
      const globalStatsUpdate: Record<string, any> = {
        totalQuizzesPlayed: increment(1),
      };
  
      const isPerfectScore =
        sanitizedAttempt.score === sanitizedAttempt.totalQuestions && !sanitizedAttempt.reason;
      if (isPerfectScore) {
        userStatsUpdate.perfectScores = increment(1);
        userStatsUpdate.totalRewards = increment(100);
        globalStatsUpdate.totalPerfectScores = increment(1);
      }
  
      const todayUTC = new Date();
      todayUTC.setUTCHours(0, 0, 0, 0);
      const lastStreakDate = profile.lastStreakTimestamp
        ? (profile.lastStreakTimestamp as Timestamp).toDate()
        : null;
  
      if (!lastStreakDate) {
        userStatsUpdate.currentStreak = 1;
        userStatsUpdate.lastStreakTimestamp = serverTimestamp();
      } else {
        const lastUTC = new Date(lastStreakDate);
        lastUTC.setUTCHours(0, 0, 0, 0);
  
        if (todayUTC.getTime() === lastUTC.getTime()) {
          // No change to streak
        } else if (todayUTC.getTime() - lastUTC.getTime() === 86_400_000) {
          userStatsUpdate.currentStreak = increment(1);
          userStatsUpdate.lastStreakTimestamp = serverTimestamp();
        } else {
          userStatsUpdate.currentStreak = 1;
          userStatsUpdate.lastStreakTimestamp = serverTimestamp();
        }
      }
  
      batch.set(userDocRef, userStatsUpdate, { merge: true });
      batch.set(statsDocRef, globalStatsUpdate, { merge: true });
  
      // Attempt doc in subcollection
      const attemptRef = doc(db, 'users', user.uid, 'quizAttempts', sanitizedAttempt.slotId);
      batch.set(attemptRef, { ...sanitizedAttempt, timestamp: serverTimestamp() }, { merge: true });
  
      // Live leaderboard entry
      const liveEntryRef = doc(db, 'leaderboard_live', sanitizedAttempt.slotId, 'entries', user.uid);
      const totalTime = sanitizedAttempt.timePerQuestion?.reduce((a: number, b: number) => a + b, 0) || 0;
      batch.set(
        liveEntryRef,
        {
          userId: user.uid,
          name: profile.name || "Anonymous Player",
          avatar: profile.photoURL || `https://placehold.co/40x40.png`,
          score: sanitizedAttempt.score,
          time: totalTime,
          disqualified: !!sanitizedAttempt.reason,
        },
        { merge: true }
      );
  
      try {
        await batch.commit();
      } catch (err: any) {
        console.error('Batch commit failed:', err);
        const code = err?.code || 'unknown';
        const message = err?.message || String(err);
        throw new Error(`firestore_commit_failed:${code}:${message}`);
      }
    },
    [user, profile]
  );

  // Public API
  const addQuizAttempt = useCallback(
    async (attempt: QuizAttempt): Promise<{ success: boolean; error?: string; queued?: boolean }> => {
      if (!user || !profile || !db) {
        const msg = 'User not authenticated or database unavailable.';
        toast({ title: 'Save Failed', description: msg, variant: 'destructive' });
        pushPending(attempt);
        return { success: false, error: msg, queued: true };
      }

      try {
        await persistAttemptBatch(attempt);
        popPending(attempt.slotId);
        setIsOffline(false);
        return { success: true };
      } catch (e: any) {
        console.error('addQuizAttempt failed:', e);
        const errMsg = String(e?.message || e);
        toast({
          title: 'Sync Error',
          description: `Could not save your quiz result now. (${errMsg}) It will auto-sync when you are back online.`,
          variant: 'destructive',
          duration: 10000,
        });
        pushPending(attempt);
        setIsOffline(true);
        return { success: false, error: e.message, queued: true };
      }
    },
    [persistAttemptBatch, toast, user, profile]
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
    async (attemptId: string): Promise<{ success: boolean }> => {
      if (!user || !db) return { success: false };

      setQuizHistory((prev) => ({
        ...prev,
        data: prev.data.map((a) => (a.slotId === attemptId ? { ...a, reviewed: true } : a)),
      }));

      try {
        const attemptRef = doc(db, 'users', user.uid, 'quizAttempts', attemptId);
        await updateDoc(attemptRef, { reviewed: true });
        return { success: true };
      } catch (error) {
        console.error('Failed to mark attempt as reviewed:', error);
        setQuizHistory((prev) => ({
          ...prev,
          data: prev.data.map((a) => (a.slotId === attemptId ? { ...a, reviewed: false } : a)),
        }));
        return { success: false };
      }
    },
    [user, db]
  );

  /* ------------------------------ Context val ---------------------------- */

  const value: UserDataContextType = {
    user,
    loading: firebaseLoading || profileLoading,
    profile,
    isProfileComplete: isProfileConsideredComplete(profile),
    quizHistory,
    lastAttemptInSlot,

    leaderboardLive,
    leaderboardAllTime,

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
