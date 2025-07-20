
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
import { RecaptchaVerifier as FirebaseRecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";

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
  
  useEffect(() => {
    return () => cleanupVerifier();
  }, [cleanupVerifier]);

  const handleSendOtp = async () => {
    setError(null);
    setIsLoading(true);

    try {
      let recaptchaContainer = document.getElementById('recaptcha-container-in-dialog');
      if (!recaptchaContainer) {
          recaptchaContainer = document.createElement('div');
          recaptchaContainer.id = 'recaptcha-container-in-dialog';
          document.body.appendChild(recaptchaContainer);
      } else {
          recaptchaContainer.innerHTML = '';
      }

      const verifier = new FirebaseRecaptchaVerifier(auth, recaptchaContainer, {
        size: 'invisible',
      });
      
      // Explicitly render and wait for it to be ready
      await verifier.render();
      recaptchaVerifierRef.current = verifier;

      const confirmationResult = await signInWithPhoneNumber(auth, `+91${phone}`, verifier);
      confirmationResultRef.current = confirmationResult;
      toast({ title: "OTP Sent", description: `A code has been sent to +91${phone}` });
      setStep('verify');
    } catch (err: any) {
      console.error("OTP send error:", err);
      let errorMessage = "Failed to send OTP. Please try again later.";
      if (err.code === 'auth/invalid-phone-number') {
        errorMessage = "The phone number is not valid. Please check and try again.";
      } else if (err.code === 'auth/too-many-requests') {
        errorMessage = "You've made too many requests. Please wait a while before trying again.";
      }
      setError(errorMessage);
      cleanupVerifier();
      setStep('initial');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    const confirmation = confirmationResultRef.current;
    if (!confirmation) {
      setError("Verification session expired. Please try again.");
      return;
    }
    setIsLoading(true);
    try {
      await confirmation.confirm(otp);
      await updateUserData?.({ phoneVerified: true, phone });
      toast({ title: "Verified", description: "Your phone number has been verified successfully." });
      onVerified();
      resetStateAndClose(false);
    } catch {
      setError("Invalid code. Please try again.");
      toast({ title: "Verification Failed", description: "The code you entered was incorrect.", variant: 'destructive' });
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
        <div id="recaptcha-container-in-dialog"></div>
        <DialogHeader>
          <DialogTitle>Verify Phone Number</DialogTitle>
          <DialogDescription>
            {step === 'initial'
              ? `We'll send a verification code to +91 ${phone}.`
              : `Enter the code sent to +91 ${phone}.`}
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
