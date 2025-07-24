
'use client';

import { useState, useEffect, useCallback, useRef } from "react";
import type { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";
import { useAuth } from '@/context/AuthProvider';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Terminal } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { getAuth, signInWithPhoneNumber, RecaptchaVerifier as FirebaseRecaptchaVerifier } from "firebase/auth";
import { app } from "@/lib/firebase";

interface Props {
  children: React.ReactNode;
  phone: string;
}

export function PhoneVerificationDialog({ children, phone }: Props) {
  const { updateUserData } = useAuth();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'initial' | 'verify'>('initial');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const recaptchaRef = useRef<HTMLDivElement>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);


  const cleanupRecaptcha = useCallback(() => {
    if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
    }
    const container = document.getElementById('recaptcha-container');
    if (container) container.innerHTML = '';
  }, []);

  const setupRecaptcha = useCallback(() => {
    if (typeof window !== 'undefined' && recaptchaRef.current && !recaptchaVerifierRef.current) {
      try {
        const auth = getAuth(app);
        recaptchaVerifierRef.current = new FirebaseRecaptchaVerifier(
          'recaptcha-container',
          {
            size: 'invisible',
            callback: (response: any) => {
              // reCAPTCHA solved
            },
            'expired-callback': () => {
              setError("reCAPTCHA expired. Please try sending the code again.");
              cleanupRecaptcha();
            }
          }, auth
        );
      } catch (err) {
        console.error('reCAPTCHA setup failed:', err);
        setError('Could not initialize reCAPTCHA. Please try again.');
        cleanupRecaptcha();
      }
    }
  }, [cleanupRecaptcha]);

  useEffect(() => {
    if (open) {
      setupRecaptcha();
    }
  }, [open, setupRecaptcha]);

  const handleSendOtp = async () => {
    setError(null);
    if (!recaptchaVerifierRef.current) {
      setError("reCAPTCHA is not ready. Please close and re-open the dialog.");
      return;
    }
    
    setIsLoading(true);
    try {
      const auth = getAuth(app);
      const result = await signInWithPhoneNumber(auth, `+91${phone}`, recaptchaVerifierRef.current);
      setConfirmationResult(result);
      toast({ title: "OTP Sent", description: `Code sent to +91 ${phone}` });
      setStep('verify');
    } catch (err: any) {
      console.error("OTP send error:", err);
      setError("Failed to send OTP. You may be rate-limited or the number may be incorrect. Please try again.");
      cleanupRecaptcha(); // Reset reCAPTCHA on failure
      setupRecaptcha(); // And set it up again for the next try
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    if (!confirmationResult || otp.length < 6) return;

    setIsLoading(true);
    try {
      await confirmationResult.confirm(otp);
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
        setConfirmationResult(null);
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
          
          <div id="recaptcha-container" ref={recaptchaRef}></div>

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
