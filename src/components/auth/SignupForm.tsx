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
import { AlertCircle, Loader2, IndianRupee } from 'lucide-react';
import { handleGoogleSignIn } from '@/lib/authUtils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { sendOtp } from '@/ai/flows/send-otp-flow';
import { verifyOtp } from '@/ai/flows/verify-otp-flow';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
        <title>Google</title>
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.6 1.62-4.38 1.62-3.8 0-6.88-3.1-6.88-6.9s3.08-6.9 6.88-6.9c2.14 0 3.54.88 4.34 1.62l2.44-2.34C18.44 2.14 15.47 1 12.48 1 5.88 1 1 5.98 1 12.5s4.88 11.5 11.48 11.5c3.54 0 6.2-1.18 8.18-3.12 2.05-2.05 2.7-5.14 2.7-7.72v-.8h-11.88z" />
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
  
  // Store form data to use after OTP verification
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

    if (!isFirebaseConfigured || !auth || !db) {
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
        <h1 className="text-3xl font-bold">{formStep === 'details' ? 'Create an Account' : 'Verify Your Email'}</h1>
        <p className="text-muted-foreground">
          {formStep === 'details' ? (
            <>
              Already have an account?{' '}
              <Link href={`/auth/login${from ? `?from=${from}` : ''}`} className="font-semibold text-primary hover:underline">
                Sign in
              </Link>
            </>
          ) : `Enter the OTP sent to ${detailsData?.email}`}
        </p>
      </div>

      {formStep === 'details' && (
        <div className="space-y-4">
          {!isFirebaseConfigured && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Firebase Not Configured</AlertTitle>
                <AlertDescription>
                    The app cannot connect to the authentication service. If you are the developer, please ensure your Firebase environment variables are set in your hosting provider's settings.
                </AlertDescription>
            </Alert>
          )}
          <Button variant="outline" className="w-full text-base py-6" onClick={onGoogleLogin} disabled={isAuthDisabled || !isFirebaseConfigured} suppressHydrationWarning>
              {isGoogleLoading ? <Loader2 className="animate-spin" /> : <><GoogleIcon className="h-5 w-5 mr-3" /> Continue with Google</>}
          </Button>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or with email
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
                    <Input id="phone" type="tel" placeholder="9876543210" className="pl-20" {...detailsForm.register('phone')} disabled={isAuthDisabled} />
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
            <Button type="submit" className="w-full text-base py-6" disabled={isAuthDisabled || !isFirebaseConfigured} suppressHydrationWarning>
              {isOtpSending ? <Loader2 className="animate-spin mr-2" /> : 'Continue'}
            </Button>
          </form>
        </div>
      )}

      {formStep === 'otp' && (
        <div className="space-y-4">
             <form onSubmit={otpForm.handleSubmit(handleVerifyAndSignup)} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="otp">One-Time Password</Label>
                    <Input id="otp" type="text" placeholder="123456" {...otpForm.register('otp')} disabled={isAuthDisabled} />
                    {otpForm.formState.errors.otp && <p className="text-sm text-destructive">{otpForm.formState.errors.otp.message}</p>}
                </div>
                <Button type="submit" className="w-full text-base py-6" disabled={isAuthDisabled || !isFirebaseConfigured} suppressHydrationWarning>
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
