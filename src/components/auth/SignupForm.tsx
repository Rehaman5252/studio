
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { auth, db } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { handleGoogleSignIn } from '@/lib/authUtils';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
        <title>Google</title>
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.6 1.62-4.38 1.62-3.8 0-6.88-3.1-6.88-6.9s3.08-6.9 6.88-6.9c2.14 0 3.54.88 4.34 1.62l2.44-2.34C18.44 2.14 15.47 1 12.48 1 5.88 1 1 5.98 1 12.5s4.88 11.5 11.48 11.5c3.54 0 6.2-1.18 8.18-3.12 2.05-2.05 2.7-5.14 2.7-7.72v-.8h-11.88z" />
    </svg>
);

const signupSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
  });

  const onGoogleLogin = async () => {
    setIsGoogleLoading(true);
    await handleGoogleSignIn(
        () => router.push(from || '/home'),
        (errorMsg) => toast({ title: 'Google Sign-In Failed', description: errorMsg, variant: 'destructive' })
    );
    setIsGoogleLoading(false);
  };
  
  const onSignup = async (data: SignupFormValues) => {
    setIsLoading(true);
    
    if (!auth || !db) {
        console.error("FIREBASE MISSING CONFIG: Please add your Firebase project configuration to your environment variables to enable authentication.");
        toast({
            title: "Authentication Unavailable",
            description: "The authentication service is not configured. Please contact the site administrator.",
            variant: "destructive",
        });
        setIsLoading(false);
        return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
      const user = userCredential.user;
      
      await updateProfile(user, { displayName: data.name });

      const userDoc = {
        uid: user.uid,
        name: data.name,
        email: user.email,
        phone: '', 
        createdAt: serverTimestamp(),
        totalRewards: 0,
        quizzesPlayed: 0,
        referralCode: `indcric.com/ref/${user.uid.slice(0, 8)}`,
        photoURL: user.photoURL || '',
      };
      await setDoc(doc(db, 'users', user.uid), userDoc);

      router.push(from || '/home');
    } catch (error: any) {
        let message = 'An error occurred during sign up.';
        if (error.code === 'auth/email-already-in-use') {
            message = 'This email is already registered. Please log in instead.';
        } else if (error.code === 'auth/weak-password') {
            message = 'The password is too weak. Please choose a stronger password.';
        }
        toast({
            title: 'Sign Up Failed',
            description: message,
            variant: 'destructive',
        });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md p-4 sm:p-8 space-y-8">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight text-center text-shimmer animate-shimmer">
          indcric
        </h1>
        <h2 className="mt-2 text-center text-2xl font-bold tracking-tight text-foreground">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link href={`/auth/login${from ? `?from=${from}` : ''}`} className="font-medium text-primary hover:text-primary/90">
            Sign in
          </Link>
        </p>
      </div>

      <div className="space-y-6">
        <Button variant="outline" className="w-full text-base py-6" onClick={onGoogleLogin} disabled={isLoading || isGoogleLoading} suppressHydrationWarning>
            {isGoogleLoading ? <Loader2 className="animate-spin" /> : <><GoogleIcon className="h-5 w-5 mr-2" /> Continue with Google</>}
        </Button>
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSignup)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" placeholder="Sachin Tendulkar" {...register('name')} disabled={isLoading || isGoogleLoading} suppressHydrationWarning />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email address</Label>
            <Input id="email" type="email" placeholder="you@example.com" {...register('email')} disabled={isLoading || isGoogleLoading} suppressHydrationWarning />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register('password')} disabled={isLoading || isGoogleLoading} suppressHydrationWarning />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full text-base py-6" disabled={isLoading || isGoogleLoading}>
            {isLoading && <Loader2 className="animate-spin mr-2" />}
            Create Account
          </Button>
        </form>
      </div>
    </div>
  );
}
