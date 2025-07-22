
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
import { auth } from "@/lib/firebaseClient";
import { signInWithPhoneNumber } from "firebase/auth";

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
      recaptchaVerifierRef.current = null;
      const container = document.getElementById('recaptcha-container-in-dialog');
      if (container) container.innerHTML = '';
    }
  }, []);

  const setupRecaptcha = useCallback(async () => {
    if (!auth || recaptchaVerifierRef.current || !open) return;

    let container = document.getElementById('recaptcha-container-in-dialog');
    if (!container) {
      container = document.createElement('div');
      container.id = 'recaptcha-container-in-dialog';
      document.body.appendChild(container);
    }

    try {
      const { RecaptchaVerifier } = await import('firebase/auth');
      const verifier = new RecaptchaVerifier(auth, 'recaptcha-container-in-dialog', {
        size: 'invisible',
        callback: () => {},
        'expired-callback': () => {
          setError("reCAPTCHA expired. Try again.");
          cleanupVerifier();
        },
      });
      await verifier.render();
      recaptchaVerifierRef.current = verifier;
    } catch (e: any) {
      console.error("reCAPTCHA error:", e);
      setError("Failed to load reCAPTCHA. Check network or disable blockers.");
    }
  }, [open, cleanupVerifier]);

  useEffect(() => {
    return () => cleanupVerifier();
  }, [cleanupVerifier]);

  useEffect(() => {
    if (open && step === 'initial') {
      setupRecaptcha();
    }
  }, [open, step, setupRecaptcha]);

  const handleSendOtp = async () => {
    setError(null);

    await setupRecaptcha();
    const verifier = recaptchaVerifierRef.current;

    if (!verifier || !auth) {
      setError("Verifier not ready. Close and try again.");
      return;
    }

    setIsLoading(true);
    try {
      const confirmationResult = await signInWithPhoneNumber(auth, `+91${phone}`, verifier);
      confirmationResultRef.current = confirmationResult;
      toast({ title: "OTP Sent", description: `Code sent to +91 ${phone}` });
      setStep('verify');
    } catch (err: any) {
      console.error("OTP error:", err);
      setError("Failed to send OTP. Check format or wait.");
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
        await updateUserData({ phoneVerified: true, phone });
      }
      toast({ title: "Verified", description: "Phone number verified." });
      onVerified();
      resetStateAndClose(false);
    } catch (err: any) {
      setError("Invalid code. Try again.");
      toast({ title: "Failed", description: "Wrong code entered.", variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const resetStateAndClose = (isOpen: boolean) => {
    if (!isOpen) {
      cleanupVerifier();
      setStep('initial');
      setOtp('');
      setError(null);
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
              ? `We’ll send a code to +91 ${phone}`
              : `Enter the code sent to +91 ${phone}`}
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
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isLoading ? 'Sending...' : 'Send Code'}
            </Button>
          ) : (
            <div className="w-full flex justify-between">
              <Button variant="ghost" onClick={() => { setStep('initial'); setOtp(''); setupRecaptcha(); }} disabled={isLoading}>Back</Button>
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
