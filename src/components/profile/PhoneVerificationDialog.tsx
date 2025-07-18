
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

export function PhoneVerificationDialog({ children, phone, onVerified }: { children: React.ReactNode; phone: string; onVerified: () => void; }) {
  const { user, updateUserData } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'initial' | 'verify'>('initial');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Use a ref to hold the verifier instance to avoid re-creation on re-renders
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    // This effect runs when the dialog opens or closes.
    // We only want to initialize reCAPTCHA when the dialog is actually open.
    if (!open) {
        if (recaptchaVerifierRef.current) {
            recaptchaVerifierRef.current.clear();
            recaptchaVerifierRef.current = null;
        }
        return;
    }

    // When the dialog opens, initialize a new verifier if one doesn't exist.
    const initializeRecaptcha = async () => {
        // Prevent re-initialization if it already exists from a previous failed attempt in the same session.
        if (recaptchaVerifierRef.current) return;
        
        try {
            const { auth } = await getFirebaseClient();
            const { RecaptchaVerifier } = await import('firebase/auth');
            
            // This div MUST be in the DOM for this to work.
            recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'invisible',
                'callback': () => {
                    // reCAPTCHA solved, ready to send OTP.
                    console.log("reCAPTCHA solved, ready to send OTP.");
                },
                'expired-callback': () => {
                    toast({ title: 'reCAPTCHA Expired', description: 'Please try sending the code again.', variant: 'destructive' });
                    setIsLoading(false);
                    // Clear the verifier so a new one can be created.
                    if (recaptchaVerifierRef.current) {
                        recaptchaVerifierRef.current.clear();
                        recaptchaVerifierRef.current = null;
                    }
                }
            });

            // Render the reCAPTCHA widget. This is a crucial step.
            await recaptchaVerifierRef.current.render();
            console.log("reCAPTCHA rendered successfully.");

        } catch (error) {
            console.error("reCAPTCHA setup error:", error);
            toast({ title: 'Verification Error', description: 'Could not initialize phone verification system. Ad blockers can sometimes cause this issue.', variant: 'destructive' });
            setIsLoading(false);
        }
    };
    
    initializeRecaptcha();

  }, [open, toast]);

  const handleSendOtp = async () => {
    setIsLoading(true);
    const appVerifier = recaptchaVerifierRef.current;

    if (!appVerifier) {
      toast({ title: 'Error', description: 'reCAPTCHA verifier not ready. Please wait a moment and try again.', variant: 'destructive' });
      setIsLoading(false);
      return;
    }

    try {
      const { auth } = await getFirebaseClient();
      const { signInWithPhoneNumber } = await import('firebase/auth');
      const fullPhoneNumber = `+91${phone}`;
      
      const result = await signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
      setConfirmationResult(result);

      toast({
        title: 'OTP Sent',
        description: `A verification code has been sent to ${fullPhoneNumber}.`,
      });
      setStep('verify');
    } catch (error: any) {
      console.error("Error sending OTP:", error);
      let description = 'Failed to send OTP. Please check the phone number and try again.';
      if (error.code === 'auth/too-many-requests') {
          description = "You've made too many requests. To protect your account, Firebase has temporarily blocked OTP requests from this device. Please try again later.";
      } else if (error.code === 'auth/internal-error') {
         description = "An internal error occurred. On localhost, this can be caused by ad blockers or network settings interfering with reCAPTCHA. For deployed apps, ensure your domain is authorized in the Firebase Console.";
      } else if (error.code === 'auth/invalid-phone-number') {
        description = 'The phone number provided is not valid.';
      }
      toast({ title: 'Error Sending OTP', description, variant: 'destructive', duration: 9000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!user || !confirmationResult) return;
    setIsLoading(true);
    try {
      await confirmationResult.confirm(otp);
      
      if(updateUserData) {
        await updateUserData({ phoneVerified: true, phone: phone });
      }
      
      toast({ title: 'Success', description: 'Your phone number has been verified.' });
      onVerified();
      setOpen(false);

    } catch (error: any) {
      console.error("Error verifying OTP:", error);
      let description = 'Failed to verify OTP.';
      if (error.code === 'auth/invalid-verification-code') {
        description = 'The code you entered is incorrect.';
      } else if (error.code === 'auth/code-expired') {
        description = 'The verification code has expired. Please request a new one.';
      }
      toast({ title: 'Verification Failed', description, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetStateAndClose = (isOpen: boolean) => {
    if (!isOpen) {
      setStep('initial');
      setOtp('');
      setIsLoading(false);
      setConfirmationResult(null);
    }
    setOpen(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={resetStateAndClose}>
      <DialogTrigger asChild>
        {children}
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
              type="tel"
            />
          </div>
        )}
        
        {/* This container is used by the reCAPTCHA verifier and must be in the DOM */}
        <div id="recaptcha-container"></div>
        
        <DialogFooter>
          {step === 'initial' ? (
            <Button onClick={handleSendOtp} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Send Code'}
            </Button>
          ) : (
            <div className='w-full flex justify-between'>
              <Button variant="ghost" onClick={() => setStep('initial')} disabled={isLoading}>Back</Button>
              <Button onClick={handleVerifyOtp} disabled={isLoading || otp.length < 6}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Verify & Save'}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
