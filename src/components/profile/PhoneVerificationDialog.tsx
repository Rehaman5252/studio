
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
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerifierReady, setIsVerifierReady] = useState(false);
  
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      if (verifierRef.current) {
        verifierRef.current.clear();
        verifierRef.current = null;
        console.log("🧹 reCAPTCHA cleared on dialog close.");
      }
      return;
    }

    let isMounted = true;
    
    // Use a small timeout to ensure the container is in the DOM
    const timeoutId = setTimeout(() => {
      if (!isMounted || verifierRef.current) {
        return;
      }
      
      const setupRecaptcha = async () => {
        try {
          const { auth } = await getFirebaseClient();
          const { RecaptchaVerifier: FirebaseRecaptchaVerifier } = await import('firebase/auth');
          
          if (!recaptchaContainerRef.current) {
            console.error("reCAPTCHA container ref is null.");
            return;
          }

          console.log("Attempting to create and render RecaptchaVerifier...");

          const verifier = new FirebaseRecaptchaVerifier(auth, recaptchaContainerRef.current, {
            'size': 'invisible',
            'callback': () => console.log("reCAPTCHA solved."),
            'expired-callback': () => {
              if (!isMounted) return;
              toast({ title: 'reCAPTCHA Expired', description: 'Please try sending the code again.', variant: 'destructive' });
              setIsVerifierReady(false);
              verifierRef.current?.clear();
              verifierRef.current = null;
            }
          });
          
          verifierRef.current = verifier;

          verifier.render().then(() => {
            if (isMounted) {
              console.log("✅ reCAPTCHA rendered and ready.");
              setIsVerifierReady(true);
            }
          }).catch(error => {
            console.error("❌ reCAPTCHA render error:", error);
            if (isMounted) {
              toast({
                title: 'reCAPTCHA Render Failed',
                description: 'Could not display reCAPTCHA. Please disable ad blockers and refresh the page.',
                variant: 'destructive',
                duration: 9000
              });
              setIsVerifierReady(false);
            }
          });

        } catch (error) {
          console.error("❌ reCAPTCHA setup error:", error);
          if (isMounted) {
            toast({ 
              title: 'Verification Setup Failed', 
              description: 'Could not initialize phone verification. Check your network connection and disable any ad blockers.', 
              variant: 'destructive',
              duration: 9000 
            });
            setIsVerifierReady(false);
          }
        }
      };
      
      setupRecaptcha();
    }, 100);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [open, toast]);

  const handleSendOtp = async () => {
    if (!verifierRef.current || !isVerifierReady) {
      toast({ title: 'Error', description: 'reCAPTCHA verifier is not ready. Please wait a moment.', variant: 'destructive' });
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
    } catch (error: any) => {
      console.error("🔥 Error sending OTP:", error);
      let description = 'Failed to send OTP. Please check the phone number and try again.';
      if (error.code === 'auth/too-many-requests') {
          description = "You've made too many requests. Please try again later.";
      } else if (error.code === 'auth/internal-error' || error.code === 'auth/internal-error-encountered') {
         description = "Internal Firebase error. Ensure this app's domain (e.g., localhost) is added to 'Authorized domains' in your Firebase project settings and check for ad blockers.";
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
    if (!isOpen) {
      setStep('initial');
      setOtp('');
      setIsSending(false);
      setIsVerifying(false);
      setIsVerifierReady(false);
      confirmationResultRef.current = null;
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

    