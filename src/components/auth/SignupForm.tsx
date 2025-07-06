
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Info, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const signupSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type SignupFormValues = z.infer<typeof signupSchema>;


export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const handleLocalSignup = (data: SignupFormValues) => {
    try {
      const localUsers = JSON.parse(localStorage.getItem('local_users') || '{}');
      if (localUsers[data.email]) {
        toast({
          title: 'Account Exists (Demo Mode)',
          description: 'An account with this email already exists.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      const uid = `local_${Date.now()}`;
      const newUser = {
        uid: uid,
        name: data.name,
        email: data.email,
        password: data.password, // This is insecure and only for the local demo mode.
        createdAt: Date.now(),
        phone: '',
        age: '',
        gender: '',
        occupation: '',
        totalRewards: 0,
        highestStreak: 0,
        referralEarnings: 0,
        certificatesEarned: 0,
        quizzesPlayed: 0,
        upi: '',
        referralCode: `indcric.com/ref/${uid.slice(0, 8)}`,
        photoURL: '',
      };

      localUsers[data.email] = newUser;
      localStorage.setItem('local_users', JSON.stringify(localUsers));
      localStorage.setItem('local_currentUserEmail', data.email);
      
      toast({
        title: 'Account Created (Demo Mode)',
        description: 'You have been successfully signed up in local demo mode.',
      });
      
      window.dispatchEvent(new Event('local-auth-change'));
      router.push(from || '/home');

    } catch (e) {
      console.error(e);
      toast({
        title: 'Local Signup Failed',
        description: 'Could not create account in local storage.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: SignupFormValues) => {
    setIsLoading(true);
    
    if (!isFirebaseConfigured) {
      handleLocalSignup(data);
      return;
    }
    
    if (!auth || !db) {
        toast({
            title: "Firebase Service Unavailable",
            description: "The app cannot connect to the authentication service. Please check your configuration.",
            variant: 'destructive'
        });
        setIsLoading(false);
        return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: data.name });
      
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: data.name,
        email: data.email,
        phone: '',
        createdAt: serverTimestamp(),
        age: '',
        gender: '',
        occupation: '',
        totalRewards: 0,
        highestStreak: 0,
        referralEarnings: 0,
        certificatesEarned: 0,
        quizzesPlayed: 0,
        upi: '',
        referralCode: `indcric.com/ref/${user.uid.slice(0, 8)}`,
        photoURL: '',
      });
      
      router.push(from || '/home');

    } catch (error: any) {
      let friendlyMessage = error.message;
      if (error.code === 'auth/email-already-in-use') {
          friendlyMessage = "This email is already registered. Please log in instead."
      }
      toast({
        title: 'Sign Up Failed',
        description: friendlyMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Create an Account</CardTitle>
        <CardDescription>Join indcric to test your cricket knowledge</CardDescription>
      </CardHeader>
      <CardContent>
        {!isFirebaseConfigured && (
            <Alert variant="default" className="mb-4 border-primary/50 bg-primary/10">
                <Info className="h-4 w-4" />
                <AlertTitle>Demo Mode Active</AlertTitle>
                <AlertDescription className="text-foreground/80">
                    Firebase is not configured. Accounts will be saved in your browser.
                </AlertDescription>
            </Alert>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" type="text" placeholder="John Doe" {...register('name')} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="user@example.com" {...register('email')} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register('password')} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Account
            </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <Link href={`/auth/login${from ? `?from=${encodeURIComponent(from)}` : ''}`} className="underline">
            Log in
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
