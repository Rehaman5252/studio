
'use client';

import { useRef, useState, useEffect, useCallback } from "react";
import type { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";
import { useAuth } from '@/context/AuthProvider';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from 'lucide-react';
import { getFirebaseAuth } from "@/lib/firebaseClient";
import { signInWithPhoneNumber } from "firebase/auth";

// To prevent re-initialization on re-renders, the verifier is stored on the window object.
declare global {
  interface Window {
    recaptchaVerifier?: RecaptchaVerifier;
    recaptchaWidgetId?: number;
  }
}

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
  
  const setupRecaptcha = useCallback(() => {
    if (typeof window === 'undefined' || window.recaptchaVerifier) {
      return;
    }

    const auth = getFirebaseAuth();
    
    // Ensure the container exists. This is crucial.
    const recaptchaContainer = document.getElementById('recaptcha-container-in-dialog');
    if (!recaptchaContainer) {
      console.error("reCAPTCHA container not found in the DOM.");
      setError("The verification widget could not be loaded. Please try again.");
      return;
    }

    try {
        window.recaptchaVerifier = new (require("firebase/auth").RecaptchaVerifier)(auth, recaptchaContainer, {
            size: 'invisible',
            'callback': () => {
                console.log("✅ reCAPTCHA challenge solved.");
            },
            'expired-callback': () => {
                console.warn("reCAPTCHA expired. Cleaning up.");
                setError("reCAPTCHA challenge expired. Please try sending the code again.");
                cleanupVerifier();
            },
        });

        window.recaptchaVerifier.render().then((widgetId: number) => {
            console.log("✅ reCAPTCHA rendered successfully with widgetId:", widgetId);
            window.recaptchaWidgetId = widgetId;
        }).catch((err: any) => {
            console.error("🔥 reCAPTCHA render failed:", err);
            setError("Failed to render the verification widget. Ad blockers or network issues can cause this.");
        });
    } catch(e: any) {
        console.error("🔥 Error creating RecaptchaVerifier:", e);
        setError("Failed to create the verification widget. Please refresh and try again.");
    }
  }, []);

  const cleanupVerifier = () => {
    if (window.recaptchaVerifier) {
        window.recaptchaVerifier.clear();
        window.recaptchaVerifier = undefined;
        // Also remove the widget from the DOM to be safe
        const recaptchaContainer = document.getElementById('recaptcha-container-in-dialog');
        if (recaptchaContainer) {
            recaptchaContainer.innerHTML = '';
        }
        console.log("🧹 reCAPTCHA verifier cleaned up.");
    }
  };

  useEffect(() => {
    if (open) {
      setupRecaptcha();
    } else {
      cleanupVerifier();
    }

    return () => {
      if (!open) {
        cleanupVerifier();
      }
    };
  }, [open, setupRecaptcha]);
  

  const handleSendOtp = async () => {
    setError(null);
    const auth = getFirebaseAuth();

    if (!window.recaptchaVerifier) {
      const errorMessage = 'The verification system is not ready. Please try again in a moment.';
      setError(errorMessage);
      toast({ title: 'Verifier Not Ready', description: errorMessage, variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);
    
    try {
      const fullPhoneNumber = `+91${phone}`;
      const result = await signInWithPhoneNumber(auth, fullPhoneNumber, window.recaptchaVerifier);
      confirmationResultRef.current = result;
      
      toast({ title: 'OTP Sent', description: `A code has been sent to ${fullPhoneNumber}.` });
      setStep('verify');
    } catch (err: any) {
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

        {/* This div is the container for the reCAPTCHA widget. */}
        <div id="recaptcha-container-in-dialog"></div>

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
