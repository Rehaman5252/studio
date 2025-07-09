'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { handleGoogleSignIn } from '@/lib/authUtils';
import { sendOtp } from '@/ai/flows/send-otp-flow';
import { verifyOtp } from '@/ai/flows/verify-otp-flow';
import { sendPhoneOtp } from '@/ai/flows/send-phone-otp-flow';
import { verifyPhoneOtp } from '@/ai/flows/verify-phone-otp-flow';
import FirebaseConfigWarning from './FirebaseConfigWarning';
import { createNewUserDocument } from '@/lib/authUtils';


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

type FormStep = 'details' | 'otp_email' | 'otp_phone';

export default function SignupForm() {
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const { toast } = useToast();

  const [formStep, setFormStep] = useState<FormStep>('details');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [detailsData, setDetailsData] = useState<DetailsFormValues | null>(null);

  const detailsForm = useForm<DetailsFormValues>({ resolver: zodResolver(detailsSchema) });
  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { otp: '' },
  });

  useEffect(() => {
    if (formStep === 'otp_email' || formStep === 'otp_phone') {
      otpForm.reset({ otp: '' });
    }
  }, [formStep, otpForm]);
  
  const getStepTitle = () => {
    switch(formStep) {
        case 'details': return 'Join the Challenge';
        case 'otp_email': return 'Verify Your Email';
        case 'otp_phone': return 'Verify Your Phone';
    }
  }
  
  const getStepDescription = () => {
    switch(formStep) {
        case 'details': return (<>Already have an account?{' '}<Link href={`/auth/login${from ? `?from=${from}` : ''}`} className="font-semibold text-primary hover:underline">Sign in here</Link></>);
        case 'otp_email': return `Enter the 6-digit code we sent to ${detailsData?.email}`;
        case 'otp_phone': return `Enter the 6-digit code we sent to +91 ${detailsData?.phone}`;
    }
  }

  const onGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
        await handleGoogleSignIn();
        // On success, AuthGuard handles redirection automatically.
    } catch (error: any) {
        let errorMessage = "An unknown error occurred during Google sign-in.";
        if (error.code === 'auth/popup-closed-by-user') {
            errorMessage = "Sign-in was cancelled. Please try again.";
        } else if (error.code === 'auth/network-request-failed') {
            errorMessage = "Network error. Please check your connection and try again.";
        } else {
            console.error("Google Sign-In Error:", error);
        }
        toast({ title: 'Google Sign-In Failed', description: errorMessage, variant: 'destructive' });
    } finally {
        setIsGoogleLoading(false);
    }
  };

  const handleDetailsSubmit = async (data: DetailsFormValues) => {
    setIsLoading(true);
    try {
        const result = await sendOtp({ email: data.email });
        if (result.success) {
            toast({ 
                title: 'Demo: Email OTP Sent', 
                description: 'For this demo, use OTP: 123456 to proceed.',
                duration: 9000,
            });
            setDetailsData(data);
            setFormStep('otp_email');
        } else {
            toast({ title: 'Failed to Send OTP', description: result.message, variant: 'destructive' });
        }
    } catch (error: any) {
        toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleEmailOtpSubmit = async (otpData: OtpFormValues) => {
    if (!detailsData) return;
    setIsLoading(true);
    try {
        const verifyResult = await verifyOtp({ email: detailsData.email, otp: otpData.otp });
        if (!verifyResult.success) {
            toast({ title: 'Email Verification Failed', description: verifyResult.message, variant: 'destructive' });
            return; // Stay on the same step
        }

        toast({ title: 'Email Verified!', description: 'Now, let\'s verify your phone.' });
        const phoneOtpResult = await sendPhoneOtp({ phone: detailsData.phone });
        if (phoneOtpResult.success) {
            toast({ 
                title: 'Demo: Phone OTP Sent', 
                description: 'For this demo, use OTP: 654321 to sign up.',
                duration: 9000,
            });
            setFormStep('otp_phone');
        } else {
             toast({ title: 'Failed to Send Phone OTP', description: phoneOtpResult.message, variant: 'destructive' });
        }
    } catch (error) {
        toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleFinalSignup = async (otpData: OtpFormValues) => {
    if (!detailsData) return;
    setIsLoading(true);

    if (!auth || !db) {
        toast({ title: "Service Unavailable", description: "Cannot create account.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    try {
        const verifyResult = await verifyPhoneOtp({ phone: detailsData.phone, otp: otpData.otp });
        if (!verifyResult.success) {
            throw new Error(verifyResult.message);
        }

        const userCredential = await createUserWithEmailAndPassword(auth, detailsData.email, detailsData.password);
        const user = userCredential.user;
        
        await updateProfile(user, { displayName: detailsData.name });
        
        await createNewUserDocument(user, {
            phone: detailsData.phone,
            emailVerified: true,
            phoneVerified: true
        });
        
        toast({ title: 'Account Created!', description: 'Welcome to CricBlitz! Please complete your profile.' });
        
        // AuthGuard will now correctly redirect to /complete-profile automatically.
        // No router.push() needed here.

    } catch (error: any) {
        let message = error.message || 'An error occurred during sign up.';
        if (error.code === 'auth/email-already-in-use') {
            message = 'This email is already registered. Please log in instead.';
        }
        toast({ title: 'Sign Up Failed', description: message, variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  };

  const isAuthDisabled = isLoading || isGoogleLoading;
  
  const renderFormContent = () => {
    switch (formStep) {
        case 'details':
            return (
                 <form onSubmit={detailsForm.handleSubmit(handleDetailsSubmit)} className="space-y-4">
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
                        <div className="relative">
                            <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...detailsForm.register('password')} disabled={isAuthDisabled} />
                             <Button type="button" variant="ghost" size="icon" className="absolute top-0 right-0 h-full px-3" onClick={() => setShowPassword(prev => !prev)}>
                                {showPassword ? <EyeOff /> : <Eye />}
                             </Button>
                        </div>
                        {detailsForm.formState.errors.password && <p className="text-sm text-destructive">{detailsForm.formState.errors.password.message}</p>}
                    </div>
                    <Button type="submit" className="w-full" disabled={isAuthDisabled}>
                        {isLoading ? <Loader2 className="animate-spin mr-2" /> : 'Continue'}
                    </Button>
                </form>
            );
        case 'otp_email':
        case 'otp_phone':
            return (
                 <form onSubmit={otpForm.handleSubmit(formStep === 'otp_email' ? handleEmailOtpSubmit : handleFinalSignup)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="otp">One-Time Password</Label>
                        <Input id="otp" type="text" placeholder="123456" {...otpForm.register('otp')} disabled={isAuthDisabled} autoComplete="one-time-code" />
                        {otpForm.formState.errors.otp && <p className="text-sm text-destructive">{otpForm.formState.errors.otp.message}</p>}
                    </div>
                    <Button type="submit" className="w-full" disabled={isAuthDisabled}>
                        {isLoading && <Loader2 className="animate-spin mr-2" />}
                        Verify & Continue
                    </Button>
                    <Button variant="link" size="sm" onClick={() => { setFormStep('details'); }} disabled={isAuthDisabled}>
                        Back to details
                    </Button>
                </form>
            );
    }
  }

  return (
    <div className="flex h-full flex-col justify-center space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">{getStepTitle()}</h1>
        <p className="text-muted-foreground">{getStepDescription()}</p>
      </div>

      {!isFirebaseConfigured ? (
         <FirebaseConfigWarning />
      ) : (
        <div className="space-y-4">
            {formStep === 'details' && (
                <>
                <Button variant="outline" className="w-full" onClick={onGoogleLogin} disabled={isAuthDisabled}>
                    {isGoogleLoading ? <Loader2 className="animate-spin" /> : <><GoogleIcon className="mr-3 h-5 w-5" /> Continue with Google</>}
                </Button>
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
                    </div>
                </div>
                </>
            )}
            {renderFormContent()}
        </div>
      )}
    </div>
  );
}
