'use client';

import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, DocumentData, onSnapshot } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { Loader2, AlertTriangle } from 'lucide-react';

const FirebaseNotConfigured = () => (
    <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground p-8">
      <div className="max-w-2xl w-full text-center p-8 border-2 border-dashed border-destructive rounded-lg bg-destructive/10">
          <AlertTriangle className="mx-auto h-12 w-12 text-destructive mb-4" />
          <h1 className="text-2xl font-bold text-destructive-foreground mb-2">Firebase Not Configured</h1>
          <p className="text-muted-foreground mb-4">
              The application cannot connect to Firebase because the required credentials are missing or invalid.
          </p>
          <p className="mb-6">
              Please copy your Firebase project's web app configuration into the <code className="bg-muted text-muted-foreground p-1 rounded-sm">.env</code> file at the root of this project.
          </p>
          <div className="text-left bg-muted p-4 rounded-md text-sm font-mono text-muted-foreground overflow-x-auto">
              <p>NEXT_PUBLIC_FIREBASE_API_KEY="YOUR_API_KEY"</p>
              <p>NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="YOUR_AUTH_DOMAIN"</p>
              <p>NEXT_PUBLIC_FIREBASE_PROJECT_ID="YOUR_PROJECT_ID"</p>
              <p>NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="YOUR_STORAGE_BUCKET"</p>
              <p>NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="YOUR_SENDER_ID"</p>
              <p>NEXT_PUBLIC_FIREBASE_APP_ID="YOUR_APP_ID"</p>
          </div>
          <p className="mt-4 text-xs text-muted-foreground">After updating the <code className="bg-muted text-muted-foreground p-1 rounded-sm">.env</code> file, you may need to restart the development server.</p>
      </div>
    </div>
  );

interface AuthContextType {
  user: User | null;
  userData: DocumentData | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<DocumentData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
        setLoading(false);
        return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (!user) {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (user && isFirebaseConfigured && db) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribeSnapshot = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          setUserData(doc.data());
        } else {
          setUserData(null);
        }
        setLoading(false);
      }, (error) => {
        console.error("Error fetching user data:", error);
        setUserData(null);
        setLoading(false);
      });

      return () => unsubscribeSnapshot();
    }
  }, [user]);

  if (!isFirebaseConfigured) {
    return <FirebaseNotConfigured />;
  }

  const value = { user, userData, loading };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="flex items-center justify-center h-screen bg-background">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};