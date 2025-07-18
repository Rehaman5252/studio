
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

// This is the correct, robust implementation based on expert guidance.
export function PhoneVerificationDialog({ children, phone, onVerified }: { children: React.ReactNode; phone: string; onVerified: () => void; }) {
  const { user, updateUserData } = useAuth();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'initial' | 'verify'>('initial');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerifierReady, setIsVerifierReady] = useState(false);
  
  // Use a ref for the confirmation result to persist it across renders.
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  
  // This ref holds the RecaptchaVerifier instance.
  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  // This ref is for the DOM element where reCAPTCHA will be rendered.
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Only run this effect when the dialog is open.
    if (!open) {
        return;
    }

    let isMounted = true;

    const setupRecaptcha = async () => {
        // Prevent re-initialization if verifier already exists
        if (verifierRef.current) {
            if(!isVerifierReady) setIsVerifierReady(true); // It might already be ready
            return;
        }

        try {
            const { auth } = await getFirebaseClient();
            const { RecaptchaVerifier } = await import('firebase/auth');

            // Ensure the container exists.
            if (recaptchaContainerRef.current) {
                const verifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
                    'size': 'invisible',
                    'callback': () => {
                        console.log("reCAPTCHA solved interactively.");
                    },
                    'expired-callback': () => {
                        toast({ title: 'reCAPTCHA Expired', description: 'Please try sending the code again.', variant: 'destructive' });
                        setIsVerifierReady(false);
                        verifierRef.current?.clear();
                        verifierRef.current = null;
                    }
                });
                
                // Store the verifier instance in the ref immediately.
                verifierRef.current = verifier;

                // Wait for it to render and then enable the send button.
                await verifier.render();
                if (isMounted) {
                    console.log("✅ reCAPTCHA rendered and ready.");
                    setIsVerifierReady(true);
                }
            }
        } catch (error) {
            console.error("❌ reCAPTCHA setup error:", error);
            toast({ 
                title: 'Verification Setup Failed', 
                description: 'Could not initialize phone verification. Ad blockers or network issues can sometimes cause this.', 
                variant: 'destructive',
                duration: 9000 
            });
            if (isMounted) setIsVerifierReady(false);
        }
    };
    
    setupRecaptcha();

    return () => {
        isMounted = false;
        // Cleanup on dialog close or component unmount.
        // The verifier instance is cleared in the onOpenChange handler.
    };
  }, [open, toast, isVerifierReady]);

  const handleSendOtp = async () => {
    if (!verifierRef.current) {
      toast({ title: 'Error', description: 'reCAPTCHA verifier not ready. Please wait.', variant: 'destructive' });
      return;
    }
    
    setIsSending(true);
    const appVerifier = verifierRef.current;

    try {
      const { auth } = await getFirebaseClient();
      const { signInWithPhoneNumber } = await import('firebase/auth');
      const fullPhoneNumber = `+91${phone}`;
      
      const result = await signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
      confirmationResultRef.current = result;

      toast({
        title: 'OTP Sent',
        description: `A verification code has been sent to ${fullPhoneNumber}.`,
      });
      setStep('verify');
    } catch (error: any) {
      console.error("🔥 Error sending OTP:", error);
      let description = 'Failed to send OTP. Please check the phone number and try again.';
      if (error.code === 'auth/too-many-requests') {
          description = "You've made too many requests. Please try again later.";
      } else if (error.code === 'auth/internal-error' || error.code === 'auth/internal-error-encountered') {
         description = "Internal Firebase error. Ensure this app's domain is authorized in your Firebase project for Phone Auth, and check for ad blockers.";
      } else if (error.code === 'auth/invalid-phone-number') {
        description = 'The phone number provided is not valid. Please use the format 9876543210.';
      }
      toast({ title: 'Error Sending OTP', description, variant: 'destructive', duration: 9000 });
      
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!user || !confirmationResultRef.current) return;
    setIsVerifying(true);
    try {
      await confirmationResultRef.current.confirm(otp);
      
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
      setIsVerifying(false);
    }
  };

  const resetStateAndClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      // Clear verifier on close to ensure a fresh start next time
      if (verifierRef.current) {
        verifierRef.current.clear();
        verifierRef.current = null;
        console.log("🧹 reCAPTCHA cleared on dialog close.");
      }
      setStep('initial');
      setOtp('');
      setIsSending(false);
      setIsVerifying(false);
      setIsVerifierReady(false);
      confirmationResultRef.current = null;
    }
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
        
        {/* This div must be in the DOM for the verifier to attach to */}
        <div ref={recaptchaContainerRef} className="my-2"></div>
        
        {step === 'verify' ? (
          <div className="py-4">
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              maxLength={6}
              disabled={isVerifying}
              type="tel"
            />
          </div>
        ) : null}
        
        <DialogFooter>
          {step === 'initial' ? (
            <Button onClick={handleSendOtp} disabled={!isVerifierReady || isSending} className="w-full">
              {isSending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
              ) : !isVerifierReady ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Initializing...</>
              ) : (
                'Send Code'
              )}
            </Button>
          ) : (
            <div className='w-full flex justify-between'>
              <Button variant="ghost" onClick={() => { setStep('initial'); setOtp(''); }} disabled={isVerifying}>Back</Button>
              <Button onClick={handleVerifyOtp} disabled={isVerifying || otp.length < 6}>
                {isVerifying ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</> : 'Verify & Save'}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
