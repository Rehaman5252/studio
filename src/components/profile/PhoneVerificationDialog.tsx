
'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import type { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";
import { useAuth } from '@/context/AuthProvider';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from 'lucide-react';
import { getFirebaseAuth, isFirebaseConfigured, isFirebaseOnline } from "@/lib/firebaseClient";
import { signInWithPhoneNumber } from "firebase/auth";

interface PhoneVerificationDialogProps {
  children: React.ReactNode;
  phone: string;
  onVerified: () => void;
}

export function PhoneVerificationDialog({ children, phone, onVerified }: PhoneVerificationDialogProps) {
  const { updateUserData } = useAuth();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'initial' | 'verify'>('initial');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  // ERROR: The reCAPTCHA verifier is not being managed correctly.
  // It can cause issues if it's not cleaned up or if it's initialized multiple times.
  // This can lead to intermittent failures in sending the OTP.
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const cleanupVerifier = useCallback(() => {
    if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
        const recaptchaContainer = document.getElementById('recaptcha-container-in-dialog');
        if (recaptchaContainer) {
            recaptchaContainer.innerHTML = '';
        }
    }
  }, []);
  
  useEffect(() => {
    return () => {
        cleanupVerifier();
    };
  }, [cleanupVerifier]);

  const setupRecaptcha = useCallback(async () => {
    const auth = getFirebaseAuth();
    if (!auth || recaptchaVerifierRef.current || !open) return;
    
    // Ensure the container exists in the body
    let recaptchaContainer = document.getElementById('recaptcha-container-in-dialog');
    if (!recaptchaContainer) {
        recaptchaContainer = document.createElement('div');
        recaptchaContainer.id = 'recaptcha-container-in-dialog';
        document.body.appendChild(recaptchaContainer);
    }
    
    const online = await isFirebaseOnline();
    if (!online) {
        setError("You appear to be offline. Please check your connection to verify your phone number.");
        return;
    }

    try {
        const { RecaptchaVerifier } = await import('firebase/auth');
        if (!recaptchaVerifierRef.current) {
            const verifier = new RecaptchaVerifier(auth, 'recaptcha-container-in-dialog', {
                size: 'invisible',
                'callback': () => {},
                'expired-callback': () => {
                    setError("reCAPTCHA challenge expired. Please try sending the code again.");
                    cleanupVerifier();
                },
            });
            await verifier.render();
            recaptchaVerifierRef.current = verifier;
        }
    } catch(e: any) {
        console.error("Recaptcha setup error:", e);
        setError("Failed to create the verification widget. Ad blockers or network issues can cause this. Please refresh and try again.");
    }
  }, [cleanupVerifier, open]);

  useEffect(() => {
    if (open && step === 'initial') {
      setupRecaptcha();
    }
  }, [open, step, setupRecaptcha]);
  
  const handleSendOtp = async () => {
    setError(null);

    const online = await isFirebaseOnline();
    if (!online) {
        setError("You appear to be offline. Please check your connection and try again.");
        return;
    }

    await setupRecaptcha(); 
    const verifier = recaptchaVerifierRef.current;
    const auth = getFirebaseAuth();

    if (!verifier || !auth) {
      const errorMessage = 'The verification system is not ready. Please close and re-open this dialog.';
      setError(errorMessage);
      toast({ title: 'Verifier Not Ready', description: errorMessage, variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const fullPhoneNumber = `+91${phone}`;
      const confirmationResult = await signInWithPhoneNumber(auth, fullPhoneNumber, verifier);
      confirmationResultRef.current = confirmationResult;
      
      toast({ title: 'OTP Sent', description: `A code has been sent to ${fullPhoneNumber}.` });
      setStep('verify');
    } catch (err: any) {
      console.error("🔥 Error sending OTP:", err.code, err.message);
      let description = 'Failed to send OTP. Please check the phone number and try again.';
      if (err.code === 'auth/invalid-phone-number') {
        description = 'The phone number format is invalid. Please ensure it is 10 digits.';
      } else if (err.code === 'auth/too-many-requests') {
        description = "You've requested this too many times. Please try again later.";
      } else if (err.code?.includes('internal-error') || err.message?.includes('reCAPTCHA') || err.message?.includes('offline')) {
        description = "An internal error occurred, often due to ad blockers, VPNs, or network issues. Please disable them and try again.";
      }
      setError(description);
      toast({ title: 'Error Sending OTP', description, variant: 'destructive', duration: 9000 });
      cleanupVerifier();
      setStep('initial'); 
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    const confirmation = confirmationResultRef.current;
    if (!confirmation) return;
    setIsLoading(true);
    try {
      await confirmation.confirm(otp);
      
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
      cleanupVerifier();
      setStep('initial');
      setOtp('');
      setIsLoading(false);
      setError(null);
    }
    setOpen(isOpen);
  };
  
  if (!isFirebaseConfigured) {
    return <>{children}</>;
  }

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
            <Button onClick={handleSendOtp} disabled={isLoading} className="w-full">
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {isLoading ? 'Sending...' : 'Send Code'}
            </Button>
          ) : (
            <div className="w-full flex justify-between">
              <Button variant="ghost" onClick={() => { setStep('initial'); setOtp(''); setError(null); setupRecaptcha(); }} disabled={isLoading}>Back</Button>
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
