
'use client';

import { useRef, useState, useEffect, useCallback } from "react";
import type { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";
import { auth } from "@/lib/firebaseClient";
import { useAuth } from '@/context/AuthProvider';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from 'lucide-react';
import { signInWithPhoneNumber, RecaptchaVerifier as FirebaseRecaptchaVerifier } from "firebase/auth";

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
  
  const recaptchaContainerRef = useRef<HTMLDivElement>(null);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  
  // Use a ref to hold the verifier instance to avoid re-creation
  const verifierRef = useRef<RecaptchaVerifier | null>(null);

  // Function to clean up the verifier and its container
  const cleanupVerifier = useCallback(() => {
    if (verifierRef.current) {
        verifierRef.current.clear();
        verifierRef.current = null;
    }
    if (recaptchaContainerRef.current) {
        recaptchaContainerRef.current.innerHTML = "";
    }
  }, []);
  
  // Initialize reCAPTCHA when the dialog opens
  useEffect(() => {
    if (!open) {
        cleanupVerifier();
        return;
    }

    if (step === 'initial' && !verifierRef.current) {
      try {
        verifierRef.current = new FirebaseRecaptchaVerifier(auth, recaptchaContainerRef.current!, {
          size: 'invisible',
          'callback': () => console.log("✅ reCAPTCHA solved."),
          'expired-callback': () => {
              setError("reCAPTCHA challenge expired. Please try sending the code again.");
              cleanupVerifier();
          },
        });
        verifierRef.current.render();
      } catch(e: any) {
        console.error("Error creating RecaptchaVerifier", e);
        setError("Failed to create the verification widget. Please try again later.");
      }
    }

    // Cleanup on unmount or when dialog closes
    return () => cleanupVerifier();
  }, [open, step, cleanupVerifier]);

  const handleSendOtp = async () => {
    setError(null);
    if (!verifierRef.current) {
      const errorMessage = 'The verification system is not ready. Please wait or reopen this dialog.';
      setError(errorMessage);
      toast({ title: 'Verifier Not Ready', description: errorMessage, variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);
    const appVerifier = verifierRef.current;
    
    try {
      const fullPhoneNumber = `+91${phone}`;
      console.log(`📞 Attempting to sign in with phone: ${fullPhoneNumber}`);
      const result = await signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
      confirmationResultRef.current = result;
      
      toast({ title: 'OTP Sent', description: `A code has been sent to ${fullPhoneNumber}.` });
      setStep('verify');
    } catch (err: any)      {
      console.error("🔥 Error sending OTP:", err.code, err.message);
      let description = 'Failed to send OTP. Please check the phone number and try again.';
      if (err.code === 'auth/invalid-phone-number') {
        description = 'The phone number format is invalid. Please ensure it is 10 digits.';
      } else if (err.code === 'auth/too-many-requests') {
        description = "You've requested this too many times. Please try again later.";
      } else if (err.code?.includes('internal-error') || err.message?.includes('reCAPTCHA')) {
        description = "An internal error occurred, often due to ad blockers, VPNs, or network issues. Please disable them and try again.";
      }
      setError(description);
      toast({ title: 'Error Sending OTP', description, variant: 'destructive', duration: 9000 });
      // Cleanup the verifier so the user can try again from scratch
      cleanupVerifier();
      setStep('initial'); 
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    if (!confirmationResultRef.current) return;
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
        
        {error && (
            <Alert variant="destructive">
                <Terminal className="h-4 w-4" />
                <AlertTitle>Verification Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}

        <div id="recaptcha-container-wrapper">
          <div ref={recaptchaContainerRef} id="recaptcha-container"></div>
        </div>

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
              <Button variant="ghost" onClick={() => { setStep('initial'); setOtp(''); setError(null); cleanupVerifier(); }} disabled={isLoading}>Back</Button>
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
