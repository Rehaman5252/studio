'use client';

import { useState, useEffect, useCallback } from "react";
import type { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";
import { useAuth } from '@/context/AuthProvider';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Terminal } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { auth } from "@/lib/firebase";
import { signInWithPhoneNumber, RecaptchaVerifier as FirebaseRecaptchaVerifier } from "firebase/auth";

interface Props {
  children: React.ReactNode;
  phone: string;
}

declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    confirmationResult?: ConfirmationResult;
  }
}

export function PhoneVerificationDialog({ children, phone }: Props) {
  const { updateUserData } = useAuth();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'initial' | 'verify'>('initial');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cleanupRecaptcha = useCallback(() => {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
    }
  }, []);

  useEffect(() => {
    return () => {
      // Ensure cleanup runs when the component unmounts
      cleanupRecaptcha();
    };
  }, [cleanupRecaptcha]);

  const setupRecaptcha = useCallback(() => {
    if (!open || typeof window === 'undefined' || !auth) return;
    
    // Clear any previous instance to avoid errors on re-open
    cleanupRecaptcha();

    try {
      // The container MUST be visible when render is called,
      // so we ensure it's here before initializing.
      const recaptchaContainer = document.getElementById('recaptcha-container');
      if (recaptchaContainer) {
          window.recaptchaVerifier = new FirebaseRecaptchaVerifier(
          'recaptcha-container',
          {
            size: 'invisible',
            callback: () => {
              // reCAPTCHA solved, allow signInWithPhoneNumber.
            },
            'expired-callback': () => {
              setError("reCAPTCHA expired. Please try sending the code again.");
              cleanupRecaptcha();
            }
          },
          auth
        );
        // We don't call render here immediately. It will be called by signInWithPhoneNumber.
      }
    } catch (err) {
      console.error("reCAPTCHA initialization error", err);
      setError("Could not initialize reCAPTCHA. Please try again.");
      cleanupRecaptcha();
    }
  }, [open, cleanupRecaptcha]);

  useEffect(() => {
    if (open) {
      // Setup reCAPTCHA when the dialog opens
      setupRecaptcha();
    }
  }, [open, setupRecaptcha]);


  const handleSendOtp = async () => {
    setError(null);
    if (!window.recaptchaVerifier) {
      setError("reCAPTCHA is not ready. Please close and re-open the dialog.");
      return;
    }
    
    setIsLoading(true);
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, `+91${phone}`, window.recaptchaVerifier);
      window.confirmationResult = confirmationResult;
      toast({ title: "OTP Sent", description: `Code sent to +91 ${phone}` });
      setStep('verify');
    } catch (err: any) {
      console.error("OTP send error:", err);
      setError("Failed to send OTP. You may be rate-limited or the number may be incorrect. Please try again.");
      cleanupRecaptcha();
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    if (!window.confirmationResult || otp.length < 6) return;

    setIsLoading(true);
    try {
      await window.confirmationResult.confirm(otp);
      if (updateUserData) await updateUserData({ phoneVerified: true });
      toast({ title: "Phone Verified!", description: "Your phone number is now verified." });
      resetStateAndClose(false);
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
      setTimeout(() => {
        setStep('initial');
        setOtp('');
        setError(null);
        setIsLoading(false);
        window.confirmationResult = undefined;
        cleanupRecaptcha();
      }, 300);
    }
  };

  return (
    <>
      <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}>{children}</div>
      <Dialog open={open} onOpenChange={resetStateAndClose}>
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
          
          <div id="recaptcha-container"></div>

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
    </>
  );
}
