
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  PhoneAuthProvider,
  linkWithCredential,
  type User,
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

// Step 1: Details form schema
const detailsSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters' }),
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, { message: 'Phone number must be in E.164 format (e.g., +14155552671)' }),
});

// Step 2: OTP form schema
const otpSchema = z.object({
  otp: z.string().length(6, { message: 'OTP must be 6 digits' }),
});

type DetailsFormValues = z.infer<typeof detailsSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    grecaptcha?: any;
  }
}

export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'details' | 'otp'>('details');
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<DetailsFormValues | null>(null);

  // Initialize reCAPTCHA verifier
  useEffect(() => {
    if (!isFirebaseConfigured || !auth || typeof window === 'undefined') return;
    
    if (!window.recaptchaVerifier) {
        try {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
              'size': 'invisible',
              'callback': (response: any) => {
                // reCAPTCHA solved, allow signInWithPhoneNumber.
              }
            });
        } catch (error) {
            console.error("reCAPTCHA initialization error:", error);
            toast({
                title: 'Error',
                description: 'Could not initialize sign-up verification. Please refresh and try again.',
                variant: 'destructive',
            });
        }
    }
  }, [toast]);

  const detailsForm = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsSchema),
    defaultValues: {
      phone: '+91',
    },
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
  });

  const handleDetailsSubmit = async (data: DetailsFormValues) => {
    if (!isFirebaseConfigured || !auth || !window.recaptchaVerifier) {
      toast({
        title: "Authentication Error",
        description: "The authentication service is currently unavailable. Please try again later.",
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    setUserDetails(data);

    try {
      const appVerifier = window.recaptchaVerifier;
      const confirmationResult = await signInWithPhoneNumber(auth, data.phone, appVerifier);
      setVerificationId(confirmationResult.verificationId);
      setStep('otp');
      toast({
        title: 'OTP Sent',
        description: `A 6-digit code has been sent to ${data.phone}.`,
      });
    } catch (error: any) {
      console.error("Phone auth error:", error);
      toast({
        title: 'Could Not Send OTP',
        description: error.message,
        variant: 'destructive',
      });
      // Reset reCAPTCHA
      if (window.grecaptcha && window.recaptchaVerifier) {
        window.grecaptcha.reset(window.recaptchaVerifier.widgetId);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (data: OtpFormValues) => {
    if (!isFirebaseConfigured || !auth || !db) {
        toast({
            title: "Authentication Error",
            description: "The authentication service is currently unavailable. Please try again later.",
            variant: 'destructive'
        });
        return;
    }

    if (!verificationId || !userDetails) {
      toast({ title: 'An error occurred', description: 'Missing verification data. Please start over.', variant: 'destructive' });
      setStep('details');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Create phone credential
      const phoneCredential = PhoneAuthProvider.credential(verificationId, data.otp);

      // 2. Create user with email and password
      const userCredential = await createUserWithEmailAndPassword(auth, userDetails.email, userDetails.password);
      const user = userCredential.user;

      // 3. Link phone number to the new account and send verification email
      await Promise.all([
          linkWithCredential(user, phoneCredential),
          updateProfile(user, { displayName: userDetails.name }),
          sendEmailVerification(user)
      ]);

      // 4. Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name: userDetails.name,
        email: userDetails.email,
        phone: userDetails.phone,
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
      
      router.push(`/auth/verify-email${from ? `?from=${encodeURIComponent(from)}` : ''}`);

    } catch (error: any) {
      toast({
        title: 'Sign Up Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">{step === 'details' ? 'Create an Account' : 'Verify Your Phone'}</CardTitle>
        <CardDescription>
          {step === 'details' ? 'Join indcric to test your cricket knowledge' : `Enter the OTP sent to ${userDetails?.phone}`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'details' && !isFirebaseConfigured && (
            <Alert variant="destructive" className="mb-4">
                <Info className="h-4 w-4" />
                <AlertTitle>Service Unavailable</AlertTitle>
                <AlertDescription className="text-foreground/80">
                    The authentication service is currently unavailable. Please try again later.
                </AlertDescription>
            </Alert>
        )}
        {step === 'details' ? (
          <form onSubmit={detailsForm.handleSubmit(handleDetailsSubmit)} className="space-y-4">
            <div id="recaptcha-container"></div>
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" type="text" placeholder="John Doe" {...detailsForm.register('name')} />
              {detailsForm.formState.errors.name && <p className="text-sm text-destructive">{detailsForm.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="user@example.com" {...detailsForm.register('email')} />
              {detailsForm.formState.errors.email && <p className="text-sm text-destructive">{detailsForm.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" {...detailsForm.register('password')} />
              {detailsForm.formState.errors.password && <p className="text-sm text-destructive">{detailsForm.formState.errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (with country code)</Label>
              <Input id="phone" type="tel" placeholder="+919876543210" {...detailsForm.register('phone')} />
              {detailsForm.formState.errors.phone && <p className="text-sm text-destructive">{detailsForm.formState.errors.phone.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading || !isFirebaseConfigured}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send OTP
            </Button>
          </form>
        ) : (
          <form onSubmit={otpForm.handleSubmit(handleOtpSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">6-Digit OTP</Label>
              <Input id="otp" type="text" placeholder="123456" {...otpForm.register('otp')} />
              {otpForm.formState.errors.otp && <p className="text-sm text-destructive">{otpForm.formState.errors.otp.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify & Create Account
            </Button>
             <Button variant="link" size="sm" onClick={() => setStep('details')} className="w-full">
                Back to details
             </Button>
          </form>
        )}
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
