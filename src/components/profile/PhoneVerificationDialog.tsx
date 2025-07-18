
'use client';

import { useRef, useState, useCallback } from "react";
import type { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";
import { getFirebaseClient } from "@/lib/firebaseClient";
import { useAuth } from '@/context/AuthProvider';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from 'lucide-react';

interface PhoneVerificationDialogProps {
  children: React.ReactNode;
  phone: string;
  onVerified: () => void;
}

export function PhoneVerificationDialog({ children, phone, onVerified }: PhoneVerificationDialogProps) {
  const { user, updateUserData } = useAuth();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'initial' | 'verify'>('initial');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifierReady, setIsVerifierReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  
  const recaptchaContainerRef = useCallback((node: HTMLDivElement | null) => {
    if (node !== null && !verifierRef.current && open) {
        getFirebaseClient().then(({ auth }) => {
          // Dynamically import RecaptchaVerifier only on the client
          import('firebase/auth').then(({ RecaptchaVerifier: FirebaseRecaptchaVerifier }) => {
            try {
              const verifier = new FirebaseRecaptchaVerifier(auth, node, {
                size: 'invisible',
                callback: () => {
                  console.log('reCAPTCHA solved');
                },
                'expired-callback': () => {
                  toast({ title: "reCAPTCHA Expired", description: "Please try sending the code again.", variant: "destructive" });
                  if (verifierRef.current) {
                    verifierRef.current.clear();
                    verifierRef.current = null;
                  }
                  setIsVerifierReady(false);
                },
              });
              
              verifier.render().then(() => {
                console.log("✅ reCAPTCHA rendered successfully.");
                verifierRef.current = verifier;
                setIsVerifierReady(true);
              }).catch((renderError: any) => {
                console.error('❌ reCAPTCHA failed to render:', renderError);
                setError("reCAPTCHA failed to load. This is often caused by ad blockers or network issues. Please disable them and try again.");
                setIsVerifierReady(false);
              });

            } catch (initError: any) {
              console.error('❌ Error creating RecaptchaVerifier', initError);
              setError("Failed to initialize the phone verification system.");
            }
          });
        });
    }
  }, [open, toast]);

  const handleSendOtp = async () => {
    setError(null);
    if (!verifierRef.current || !isVerifierReady) {
      setError('The reCAPTCHA verifier is not ready. Please wait a moment or reopen the dialog.');
      return;
    }
    
    setIsLoading(true);
    const appVerifier = verifierRef.current;
    
    try {
      const { auth } = await getFirebaseClient();
      const { signInWithPhoneNumber } = await import('firebase/auth');
      const fullPhoneNumber = `+91${phone}`;
      
      const result = await signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
      confirmationResultRef.current = result;
      
      toast({ title: 'OTP Sent', description: `A code has been sent to ${fullPhoneNumber}.` });
      setStep('verify');
    } catch (err: any)      {
      console.error("🔥 Error sending OTP:", err);
      let description = 'Failed to send OTP. Please check the phone number and try again.';
      if (err.code === 'auth/invalid-phone-number') {
        description = 'The phone number format is invalid. Please ensure it is 10 digits.';
      } else if (err.code === 'auth/too-many-requests') {
        description = "You've sent too many requests. Please try again later.";
      } else if (err.code?.includes('internal-error')) {
        description = "An internal error occurred, often due to ad blockers, VPNs, or network issues. Please disable them and try again.";
      }
      setError(description);
      toast({ title: 'Error Sending OTP', description, variant: 'destructive', duration: 9000 });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    if (!user || !confirmationResultRef.current) return;
    setIsLoading(true);
    try {
      await confirmationResultRef.current.confirm(otp);
      
      if (updateUserData) {
        await updateUserData({ phoneVerified: true, phone: phone });
      }
      
      toast({ title: 'Success', description: 'Your phone number has been verified.' });
      onVerified();
      resetStateAndClose(false);
    } catch (err: any) {
      console.error('Error verifying OTP:', err);
      setError('The code you entered is incorrect. Please try again.');
      toast({ title: 'Verification Failed', description: 'The code you entered is incorrect.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetStateAndClose = (isOpen: boolean) => {
    if (!isOpen) {
      setStep('initial');
      setOtp('');
      setIsLoading(false);
      setError(null);
      setIsVerifierReady(false);
      if (verifierRef.current) {
        verifierRef.current.clear();
        verifierRef.current = null;
      }
    }
    setOpen(isOpen);
  };
  
  return (
    <Dialog open={open} onOpenChange={resetStateAndClose}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verify Phone Number</DialogTitle>
          <DialogDescription>
            {step === 'initial'
              ? `We'll send a verification code to +91 ${phone}.`
              : `Enter the 6-digit code sent to +91 ${phone}.`}
          </DialogDescription>
        </DialogHeader>
        
        {/* This div is the container for the invisible reCAPTCHA */}
        <div ref={recaptchaContainerRef} />

        {error && (
            <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Verification Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

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
        
        <DialogFooter>
          {step === 'initial' ? (
            <Button onClick={handleSendOtp} disabled={isLoading || !isVerifierReady} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {!isVerifierReady ? 'Initializing...' : 'Send Code'}
            </Button>
          ) : (
            <div className="w-full flex justify-between">
              <Button variant="ghost" onClick={() => { setStep('initial'); setOtp(''); setError(null); }} disabled={isLoading}>Back</Button>
              <Button onClick={handleVerifyOtp} disabled={isLoading || otp.length < 6}>
                {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</> : 'Verify & Save'}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
