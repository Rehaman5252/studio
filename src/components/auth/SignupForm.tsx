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
import { Loader2 } from 'lucide-react';
import { handleGoogleSignIn } from '@/lib/authUtils';
import { sendOtp } from '@/ai/flows/send-otp-flow';
import { verifyOtp } from '@/ai/flows/verify-otp-flow';
import FirebaseConfigWarning from './FirebaseConfigWarning';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.651-3.356-11.303-8H6.306C9.656,39.663,16.318,44,24,44z"/>
        <path fill="#1565C0" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,35.091,44,29.836,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
);

const detailsSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phone: z.string().regex(/^\d{10}$/, { message: 'Please enter a valid 10-digit phone number.'}),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});
type DetailsFormValues = z.infer<typeof detailsSchema>;

const otpSchema = z.object({
  otp: z.string().length(6, { message: 'OTP must be 6 characters.' }),
});
type OtpFormValues = z.infer<typeof otpSchema>;


export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const { toast } = useToast();

  const [formStep, setFormStep] = useState<'details' | 'otp'>('details');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isOtpSending, setIsOtpSending] = useState(false);
  
  const [detailsData, setDetailsData] = useState<DetailsFormValues | null>(null);

  const detailsForm = useForm<DetailsFormValues>({ resolver: zodResolver(detailsSchema) });
  const otpForm = useForm<OtpFormValues>({ resolver: zodResolver(otpSchema) });

  const onGoogleLogin = async () => {
    setIsGoogleLoading(true);
    await handleGoogleSignIn(
        () => router.push(from || '/home'),
        (errorMsg) => toast({ title: 'Google Sign-In Failed', description: errorMsg, variant: 'destructive' })
    );
    setIsGoogleLoading(false);
  };

  const handleSendOtp = async (data: DetailsFormValues) => {
    setIsOtpSending(true);
    try {
        const result = await sendOtp({ email: data.email });
        if (result.success) {
            toast({ title: 'OTP Sent', description: result.message });
            setDetailsData(data);
            setFormStep('otp');
        } else {
            toast({ title: 'Failed to Send OTP', description: result.message, variant: 'destructive' });
        }
    } catch (error: any) {
        toast({ title: 'Error', description: 'An unexpected error occurred while sending the OTP.', variant: 'destructive' });
    } finally {
        setIsOtpSending(false);
    }
  };
  
  const handleVerifyAndSignup = async (otpData: OtpFormValues) => {
    if (!detailsData) return;
    setIsLoading(true);

    if (!auth || !db) {
        toast({
            title: "Service Unavailable",
            description: "Cannot create account. Please contact support.",
            variant: "destructive",
        });
        setIsLoading(false);
        return;
    }
    
    try {
        const verifyResult = await verifyOtp({ email: detailsData.email, otp: otpData.otp });
        if (!verifyResult.success) {
            toast({ title: 'Verification Failed', description: verifyResult.message, variant: 'destructive' });
            setIsLoading(false);
            return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, detailsData.email, detailsData.password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName: detailsData.name });

        const userDoc = {
            uid: user.uid,
            name: detailsData.name,
            email: user.email,
            phone: `+91${detailsData.phone}`,
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
        }
        toast({ title: 'Sign Up Failed', description: message, variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  };

  const isAuthDisabled = isLoading || isGoogleLoading || isOtpSending;

  return (
    <div className="flex h-full flex-col justify-center space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          {formStep === 'details' ? 'Join the Challenge' : 'Check Your Email'}
        </h1>
        <p className="text-muted-foreground">
          {formStep === 'details' ? (
            <>
              Already have an account?{' '}
              <Link href={`/auth/login${from ? `?from=${from}` : ''}`} className="font-semibold text-primary hover:underline">
                Sign in here
              </Link>
            </>
          ) : `Enter the 6-digit code we sent to ${detailsData?.email}`}
        </p>
      </div>

      {!isFirebaseConfigured ? (
         <FirebaseConfigWarning />
      ) : formStep === 'details' ? (
        <div className="space-y-4">
          <Button variant="outline" className="w-full" onClick={onGoogleLogin} disabled={isAuthDisabled}>
              {isGoogleLoading ? <Loader2 className="animate-spin" /> : <><GoogleIcon className="mr-3 h-5 w-5" /> Continue with Google</>}
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <form onSubmit={detailsForm.handleSubmit(handleSendOtp)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" placeholder="Sachin Tendulkar" {...detailsForm.register('name')} disabled={isAuthDisabled} />
              {detailsForm.formState.errors.name && <p className="text-sm text-destructive">{detailsForm.formState.errors.name.message}</p>}
            </div>
            <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-foreground">🇮🇳 +91</span>
                    </div>
                    <Input id="phone" type="tel" placeholder="9876543210" className="pl-16" {...detailsForm.register('phone')} disabled={isAuthDisabled} />
                </div>
                {detailsForm.formState.errors.phone && <p className="text-sm text-destructive">{detailsForm.formState.errors.phone.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="sachin@tendulkar.com" {...detailsForm.register('email')} disabled={isAuthDisabled} />
              {detailsForm.formState.errors.email && <p className="text-sm text-destructive">{detailsForm.formState.errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" {...detailsForm.register('password')} disabled={isAuthDisabled} />
              {detailsForm.formState.errors.password && <p className="text-sm text-destructive">{detailsForm.formState.errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isAuthDisabled}>
              {isOtpSending ? <Loader2 className="animate-spin mr-2" /> : 'Continue'}
            </Button>
          </form>
        </div>
      ) : (
        <div className="space-y-4">
             <form onSubmit={otpForm.handleSubmit(handleVerifyAndSignup)} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="otp">One-Time Password</Label>
                    <Input id="otp" type="text" placeholder="123456" {...otpForm.register('otp')} disabled={isAuthDisabled} />
                    {otpForm.formState.errors.otp && <p className="text-sm text-destructive">{otpForm.formState.errors.otp.message}</p>}
                </div>
                <Button type="submit" className="w-full" disabled={isAuthDisabled}>
                    {isLoading && <Loader2 className="animate-spin mr-2" />}
                    Verify & Create Account
                </Button>
             </form>
             <Button variant="link" size="sm" onClick={() => setFormStep('details')} disabled={isAuthDisabled}>
                Back to details
             </Button>
        </div>
      )}
    </div>
  );
}
