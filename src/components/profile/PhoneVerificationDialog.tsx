
'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import type { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";
import { useAuth } from '@/context/AuthProvider';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Terminal } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { auth, isFirebaseConfigured } from "@/lib/firebaseClient";
import { signInWithPhoneNumber, RecaptchaVerifier as FirebaseRecaptchaVerifier } from "firebase/auth";

interface Props {
  children: React.ReactNode;
  phone: string;
  onVerified: () => void;
}

export function PhoneVerificationDialog({ children, phone, onVerified }: Props) {
  const { updateUserData } = useAuth();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'initial' | 'verify'>('initial');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  const cleanupVerifier = useCallback(() => {
    const container = document.getElementById('recaptcha-container-in-dialog');
    if (recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current.clear();
      recaptchaVerifierRef.current = null;
      if (container) container.innerHTML = '';
    }
    if (container) {
      // If it exists but the verifier doesn't, it might be a stale container
      container.innerHTML = '';
    }
  }, []);

  const setupRecaptcha = useCallback(() => {
    if (!isFirebaseConfigured || !open || typeof window === 'undefined') return;

    if (recaptchaVerifierRef.current) {
      cleanupVerifier();
    }
    
    let container = document.getElementById('recaptcha-container-in-dialog');
    if (!container) {
      container = document.createElement('div');
      container.id = 'recaptcha-container-in-dialog';
      // Append to a part of the dialog that's always present, or body
      document.body.appendChild(container);
    }
    
    try {
      const verifier = new FirebaseRecaptchaVerifier(auth, 'recaptcha-container-in-dialog', {
        size: 'invisible',
        callback: () => {},
        'expired-callback': () => {
          setError("reCAPTCHA expired. Please try again.");
          cleanupVerifier();
        },
      });
      verifier.render();
      recaptchaVerifierRef.current = verifier;
    } catch (e: any) {
      console.error("reCAPTCHA error:", e);
      setError("Failed to load reCAPTCHA. Please check your network connection or disable ad-blockers and try again.");
    }
  }, [open, cleanupVerifier]);


  useEffect(() => {
    if (open) {
      setupRecaptcha();
    } else {
      cleanupVerifier();
    }
    
    // Cleanup on unmount
    return () => {
      cleanupVerifier();
    };
  }, [open, setupRecaptcha, cleanupVerifier]);

  const handleSendOtp = async () => {
    setError(null);
    if (!recaptchaVerifierRef.current) {
      setError("reCAPTCHA is not ready. Please close and re-open the dialog.");
      return;
    }
    
    setIsLoading(true);
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, `+91${phone}`, recaptchaVerifierRef.current);
      confirmationResultRef.current = confirmationResult;
      toast({ title: "OTP Sent", description: `Code sent to +91 ${phone}` });
      setStep('verify');
    } catch (err: any) {
      console.error("OTP error:", err);
      setError("Failed to send OTP. Check the phone number format or wait a moment before trying again.");
      cleanupVerifier();
      setupRecaptcha(); // Try to set it up again
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    const confirmation = confirmationResultRef.current;
    if (!confirmation || otp.length < 6) return;
    
    setIsLoading(true);
    try {
      await confirmation.confirm(otp);
      await updateUserData({ phoneVerified: true, phone });
      toast({ title: "Success!", description: "Your phone number has been verified." });
      onVerified();
      resetStateAndClose(false); // Close dialog on success
    } catch (err: any) {
      console.error("OTP verification error:", err);
      setError("The code you entered was invalid. Please try again.");
      toast({ title: "Verification Failed", description: "You entered the wrong code.", variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetStateAndClose = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      cleanupVerifier();
      setTimeout(() => {
        setStep('initial');
        setOtp('');
        setError(null);
        setIsLoading(false);
        confirmationResultRef.current = null;
      }, 300); // Delay reset to allow dialog to close smoothly
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={resetStateAndClose}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verify Phone Number</DialogTitle>
          <DialogDescription>
            {step === 'initial'
              ? `We’ll send a verification code to +91 ${phone}.`
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
              autoComplete="one-time-code"
            />
          </div>
        )}

        <DialogFooter>
          {step === 'initial' ? (
            <Button onClick={handleSendOtp} disabled={isLoading} className="w-full">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
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
