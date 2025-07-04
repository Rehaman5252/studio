
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, KeyRound, ArrowRight, UserPlus, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '@/context/AuthProvider';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginView, setIsLoginView] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user) {
      router.replace('/home');
    }
  }, [user, authLoading, router]);

  const handleAuthAction = async () => {
    if (!email || !password) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Please enter both email and password.',
      });
      return;
    }
    setLoading(true);
    try {
      if (isLoginView) {
        // Handle Login
        await signInWithEmailAndPassword(auth, email, password);
        toast({
          title: 'Success',
          description: 'Logged in successfully!',
        });
        router.replace('/home');
      } else {
        // Handle Sign Up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;

        // Create a user document in Firestore
        await setDoc(doc(db, 'users', newUser.uid), {
          uid: newUser.uid,
          email: newUser.email,
          name: email.split('@')[0] || 'New User',
          phone: '',
          age: '',
          gender: '',
          occupation: 'Player',
          totalRewards: 0,
          highestStreak: 0,
          referralEarnings: 0,
          certificatesEarned: 0,
          quizzesPlayed: 0,
          upi: '',
          referralCode: `indcric.com/ref/${newUser.uid.substring(0, 7)}`,
          createdAt: new Date().toISOString(),
        });

        toast({
          title: 'Account Created',
          description: "You're all set! Welcome to Indcric.",
        });
        router.replace('/walkthrough');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Authentication Failed',
        description: error.code ? error.code.replace('auth/', '').replace(/-/g, ' ') : 'An unexpected error occurred.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-primary via-green-800 to-green-900 p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8 text-white">
          <div className="inline-block bg-white/20 p-4 rounded-full shadow-lg">
            <span className="text-6xl">🏏</span>
          </div>
          <h1 className="text-4xl font-extrabold mt-4">Indcric</h1>
          <p className="text-lg opacity-90">Win ₹100 for 100 Seconds</p>
        </div>

        <Card className="bg-background/80 backdrop-blur-sm border-white/20 shadow-xl">
          <CardHeader>
            <CardTitle>{isLoginView ? 'Welcome Back!' : 'Create an Account'}</CardTitle>
            <CardDescription>
              {isLoginView ? 'Enter your credentials to log in.' : 'Sign up to start playing.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoCapitalize="none"
                />
              </div>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  className="pl-10"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                />
              </div>
              <Button
                className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                onClick={handleAuthAction}
                disabled={loading}
              >
                {loading ? 'Processing...' : isLoginView ? 'Log In' : 'Sign Up'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="link"
                className="w-full text-white/80 hover:text-white"
                onClick={() => setIsLoginView(!isLoginView)}
              >
                {isLoginView ? (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Don't have an account? Sign Up
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Already have an account? Log In
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
