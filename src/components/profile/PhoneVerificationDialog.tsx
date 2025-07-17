
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { getFirebaseClient } from '@/lib/firebaseClient';
import type { RecaptchaVerifier, ConfirmationResult } from 'firebase/auth';
import { signInWithPhoneNumber } from 'firebase/auth';

declare global {
  interface Window {
    confirmationResult?: ConfirmationResult;
  }
}

export function PhoneVerificationDialog({ children, phone, onVerified }: { children: React.ReactNode; phone: string; onVerified: () => void; }) {
  const { user, userData, updateUserData } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'initial' | 'verify'>('initial');
  const [isLoading, setIsLoading] = useState(false);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (!open) return;

    let isMounted = true;

    const setupRecaptcha = async () => {
      if (!recaptchaContainerRef.current || recaptchaVerifierRef.current) return;

      const { auth } = await getFirebaseClient();
      const { RecaptchaVerifier } = await import('firebase/auth');

      try {
        const verifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
          'size': 'invisible',
          'callback': () => {
            console.log("reCAPTCHA solved, ready to send OTP.");
          },
          'expired-callback': () => {
            toast({ title: 'reCAPTCHA Expired', description: 'Please try sending the code again.', variant: 'destructive' });
            recaptchaVerifierRef.current?.clear();
            recaptchaVerifierRef.current = null;
          }
        });
        if (isMounted) {
          recaptchaVerifierRef.current = verifier;
        }
      } catch (e) {
        console.error("Recaptcha setup error", e);
        toast({ title: 'Error', description: 'Could not initialize reCAPTCHA. Please refresh the page.', variant: 'destructive' });
      }
    };

    setupRecaptcha();

    return () => {
      isMounted = false;
      if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
      }
    };
  }, [open, toast]);

  const handleSendOtp = async () => {
    setIsLoading(true);
    if (!recaptchaVerifierRef.current) {
      toast({ title: 'Error', description: 'reCAPTCHA not ready. Please wait a moment and try again.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    try {
      const { auth } = await getFirebaseClient();
      const appVerifier = recaptchaVerifierRef.current;
      const fullPhoneNumber = `+91${phone}`;

      const confirmationResult = await signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
      window.confirmationResult = confirmationResult;

      toast({
        title: 'OTP Sent',
        description: `A verification code has been sent to ${fullPhoneNumber}.`,
      });
      setStep('verify');
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      let message = 'Failed to send OTP. Please check the phone number and try again.';
      if (error.code === 'auth/invalid-phone-number') {
        message = 'The phone number provided is not valid.';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many requests. Please try again later.';
      } else if (error.code === 'auth/internal-error') {
         message = 'An internal error occurred. This might be due to an incomplete Firebase project setup for Phone Auth.';
      }
      toast({ title: 'Error', description: message, variant: 'destructive' });
      recaptchaVerifierRef.current?.clear();
      recaptchaVerifierRef.current = null;
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!user || !window.confirmationResult) return;
    setIsLoading(true);
    try {
      await window.confirmationResult.confirm(otp);
      
      if(updateUserData) {
        await updateUserData({ phoneVerified: true });
      }
      
      toast({ title: 'Success', description: 'Your phone number has been verified.' });
      onVerified();
      setOpen(false);

    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      let message = 'Failed to verify OTP.';
      if (error.code === 'auth/invalid-verification-code') {
        message = 'The code you entered is incorrect.';
      } else if (error.code === 'auth/code-expired') {
        message = 'The verification code has expired. Please request a new one.';
      }
      toast({ title: 'Verification Failed', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetState = () => {
    setStep('initial');
    setOtp('');
    setIsLoading(false);
    if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
    }
  };
  
  const onOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      resetState();
    }
  }

  const onOpenDialog = (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
    if (userData?.phoneVerified && userData?.phone === phone) {
      e.preventDefault();
      toast({ title: "Already Verified", description: "This phone number is already verified." });
      return;
    }
    setOpen(true);
  };

  return (
    <>
      <div ref={recaptchaContainerRef}></div>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogTrigger asChild>
          <div onClick={(e: any) => onOpenDialog(e)}>
            {children}
          </div>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Phone Number</DialogTitle>
            <DialogDescription>
              {step === 'initial'
                ? `We'll send a verification code to +91 ${phone}.`
                : `Enter the 6-digit code sent to +91 ${phone}.`}
            </DialogDescription>
          </DialogHeader>
          {step === 'verify' && (
            <div className="py-4">
              <Input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                maxLength={6}
                disabled={isLoading}
              />
            </div>
          )}
          <DialogFooter>
            {step === 'initial' ? (
              <Button onClick={handleSendOtp} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send Code
              </Button>
            ) : (
              <div className='w-full flex justify-between'>
                <Button variant="ghost" onClick={() => setStep('initial')} disabled={isLoading}>Back</Button>
                <Button onClick={handleVerifyOtp} disabled={isLoading || otp.length < 6}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
