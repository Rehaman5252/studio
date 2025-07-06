
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Loader2, ArrowRight } from 'lucide-react';
import { sendOtp } from '@/ai/flows/send-otp-flow';
import { verifyOtp } from '@/ai/flows/verify-otp-flow';
import { handleGoogleSignIn } from '@/lib/authUtils';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
        <title>Google</title>
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.6 1.62-4.38 1.62-3.8 0-6.88-3.1-6.88-6.9s3.08-6.9 6.88-6.9c2.14 0 3.54.88 4.34 1.62l2.44-2.34C18.44 2.14 15.47 1 12.48 1 5.88 1 1 5.98 1 12.5s4.88 11.5 11.48 11.5c3.54 0 6.2-1.18 8.18-3.12 2.05-2.05 2.7-5.14 2.7-7.72v-.8h-11.88z" />
    </svg>
);

const IndianFlagIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 20" width="30" height="20">
      <rect width="30" height="20" fill="#f93"/>
      <rect width="30" height="13" fill="#fff"/>
      <rect width="30" height="7" fill="#128807"/>
      <g transform="translate(15,10)">
        <circle r="3" fill="#008"/>
        <circle r="2.5" fill="#fff"/>
        <circle r="0.5" fill="#008"/>
        <g id="d">
          <g id="c">
            <g id="b">
              <g id="a">
                <path d="M0-2.5v2.5h1" fill="#008"/>
                <path d="M0-2.5v2.5h-1" fill="#008" transform="scale(-1,1)"/>
              </g>
              <use href="#a" transform="rotate(15)"/>
            </g>
            <use href="#b" transform="rotate(30)"/>
          </g>
          <use href="#c" transform="rotate(60)"/>
        </g>
        <use href="#d" transform="scale(-1,1)"/>
      </g>
    </svg>
  );

const emailSchema = z.object({ email: z.string().email({ message: 'Please enter a valid email address.' }) });
const otpSchema = z.object({ otp: z.string().min(6, { message: 'OTP must be 6 digits.' }) });
const detailsSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  phone: z.string().min(10, { message: 'Please enter a valid 10-digit phone number.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type Step = 'email' | 'otp' | 'details';

export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [step, setStep] = useState<Step>('email');
  const [formData, setFormData] = useState({ email: '', name: '', phone: '', password: '' });

  const { register, handleSubmit, formState: { errors }, getValues, trigger } = useForm();
  
  const onGoogleLogin = async () => {
    setIsGoogleLoading(true);
    await handleGoogleSignIn(
        () => router.push(from || '/home'),
        (errorMsg) => toast({ title: 'Google Sign-In Failed', description: errorMsg, variant: 'destructive' })
    );
    setIsGoogleLoading(false);
  }

  const handleSendOtp = async () => {
    const isValid = await trigger("email");
    if (!isValid) return;

    setIsLoading(true);
    const email = getValues("email");
    try {
      const result = await sendOtp({ email });
      if (result.success) {
        setFormData(prev => ({ ...prev, email }));
        setStep('otp');
        toast({ title: 'OTP Sent', description: `A verification code (123456) has been sent to ${email}.` });
      } else {
        toast({ title: 'Failed to Send OTP', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    const isValid = await trigger("otp");
    if (!isValid) return;

    setIsLoading(true);
    const otp = getValues("otp");
    try {
      const result = await verifyOtp({ email: formData.email, otp });
      if (result.success) {
        setStep('details');
        toast({ title: 'Email Verified', description: 'Please complete your registration.' });
      } else {
        toast({ title: 'Invalid OTP', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccount = async () => {
    const isValid = await trigger(["name", "phone", "password"]);
    if (!isValid) return;

    setIsLoading(true);
    const { name, phone, password } = getValues();
    const { email } = formData;
    
    if (!isFirebaseConfigured || !auth || !db) {
        toast({ title: 'Service Unavailable', description: "The authentication service is not configured.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await updateProfile(user, { displayName: name });
      
      const userDoc = {
        uid: user.uid,
        name,
        email,
        phone,
        createdAt: serverTimestamp(),
        totalRewards: 0,
        quizzesPlayed: 0,
        referralCode: `indcric.com/ref/${user.uid.slice(0, 8)}`,
        photoURL: user.photoURL || '',
      };
      await setDoc(doc(db, 'users', user.uid), userDoc);
      
      router.push(from || '/home');
    } catch (error: any) {
        const message = error.code === 'auth/email-already-in-use' 
            ? 'This email is already registered. Please log in.' 
            : 'An error occurred during sign up.';
      toast({ title: 'Sign Up Failed', description: message, variant: 'destructive' });
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
        <Button variant="outline" className="w-full text-base py-6" onClick={onGoogleLogin} disabled={isLoading || isGoogleLoading}>
            {isGoogleLoading ? <Loader2 className="animate-spin" /> : <GoogleIcon className="h-5 w-5" />}
            Continue with Google
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

        {step === 'email' && (
          <form onSubmit={handleSubmit(handleSendOtp)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input id="email" type="email" placeholder="you@example.com" {...register('email', emailSchema.shape.email as any)} disabled={isLoading} />
              {errors.email && <p className="text-sm text-destructive">{String(errors.email.message)}</p>}
            </div>
            <Button type="submit" className="w-full text-base py-6" disabled={isLoading}>
              {isLoading && <Loader2 className="animate-spin" />}
              Send Verification Code
              {!isLoading && <ArrowRight />}
            </Button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleSubmit(handleVerifyOtp)} className="space-y-4 text-center">
             <Label htmlFor="otp">Enter Verification Code</Label>
             <p className='text-sm text-muted-foreground'>Sent to {formData.email}. The dummy OTP is 123456.</p>
            <div className="space-y-2">
              <Input id="otp" {...register('otp', otpSchema.shape.otp as any)} maxLength={6} className="text-center text-2xl tracking-[0.5em] font-mono" />
              {errors.otp && <p className="text-sm text-destructive">{String(errors.otp.message)}</p>}
            </div>
            <Button type="submit" className="w-full text-base py-6" disabled={isLoading}>
              {isLoading && <Loader2 className="animate-spin" />}
              Verify Email
            </Button>
          </form>
        )}
        
        {step === 'details' && (
          <form onSubmit={handleSubmit(handleCreateAccount)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" {...register('name', detailsSchema.shape.name as any)} />
              {errors.name && <p className="text-sm text-destructive">{String(errors.name.message)}</p>}
            </div>
             <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none gap-2">
                       <IndianFlagIcon />
                       <span className="text-foreground">+91</span>
                    </div>
                    <Input id="phone" type="tel" {...register('phone', detailsSchema.shape.phone as any)} className="pl-20" />
                </div>
                {errors.phone && <p className="text-sm text-destructive">{String(errors.phone.message)}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...register('password', detailsSchema.shape.password as any)} />
              {errors.password && <p className="text-sm text-destructive">{String(errors.password.message)}</p>}
            </div>
            <Button type="submit" className="w-full text-base py-6" disabled={isLoading}>
              {isLoading && <Loader2 className="animate-spin" />}
              Create Account
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
