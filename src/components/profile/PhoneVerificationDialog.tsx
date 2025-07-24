
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
import { auth, isFirebaseConfigured } from "@/lib/firebase";
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
    if (recaptchaVerifierRef.current) {
      recaptchaVerifierRef.current.clear();
    }
    const container = document.getElementById('recaptcha-container');
    if (container) {
      container.remove();
    }
  }, []);

  const setupRecaptcha = useCallback(() => {
    if (!isFirebaseConfigured || !open || typeof window === 'undefined') return;

    cleanupVerifier(); // Clean up any existing verifier first
    
    // Create a new container dynamically
    const recaptchaContainer = document.createElement('div');
    recaptchaContainer.id = 'recaptcha-container';
    document.body.appendChild(recaptchaContainer);
    
    try {
      const verifier = new FirebaseRecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // This callback is called when reCAPTCHA is successfully executed.
        },
        'expired-callback': () => {
          setError("reCAPTCHA expired. Please close and try again.");
          cleanupVerifier();
        },
      });
      verifier.render();
      recaptchaVerifierRef.current = verifier;
    } catch (e: any) {
      console.error("reCAPTCHA setup error:", e);
      setError("Failed to load reCAPTCHA. Please check your network or ad-blocker and try again.");
    }
  }, [open, cleanupVerifier]);


  useEffect(() => {
    if (open) {
      setupRecaptcha();
    } else {
      cleanupVerifier();
    }
    
    return () => cleanupVerifier();
  }, [open, setupRecaptcha, cleanupVerifier]);

  const handleSendOtp = async () => {
    setError(null);
    if (!recaptchaVerifierRef.current) {
      setError("reCAPTCHA is not ready. Please wait a moment or try re-opening this dialog.");
      return;
    }
    
    setIsLoading(true);
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, `+91${phone}`, recaptchaVerifierRef.current);
      confirmationResultRef.current = confirmationResult;
      toast({ title: "OTP Sent", description: `Code sent to +91 ${phone}` });
      setStep('verify');
    } catch (err: any) {
      console.error("OTP send error:", err);
      setError("Failed to send OTP. Check the phone number or try again later.");
      setupRecaptcha(); // Reset reCAPTCHA on failure
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
      await updateUserData({ phoneVerified: true });
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
      }, 300); // Delay state reset for smoother closing
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
