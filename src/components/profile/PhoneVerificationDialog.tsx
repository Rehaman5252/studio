
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
}

// Add a declaration for the window object to include recaptchaVerifier
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
  
  const cleanupRecaptcha = () => {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      const widget = document.querySelector('.grecaptcha-badge');
      if(widget?.parentNode) {
        // This is a common workaround to remove the reCAPTCHA badge if it persists
        try {
            document.body.removeChild(widget.parentNode);
        } catch (e) {
            // It might already be gone
        }
      }
      window.recaptchaVerifier = undefined;
    }
  };

  useEffect(() => {
    if (open) {
      // Setup reCAPTCHA only when the dialog is opened
      try {
        if (!window.recaptchaVerifier) {
          window.recaptchaVerifier = new FirebaseRecaptchaVerifier(auth, 'recaptcha-container', {
            size: 'invisible',
            callback: () => {
              // reCAPTCHA solved, allow signInWithPhoneNumber.
            },
            'expired-callback': () => {
              setError("reCAPTCHA expired. Please try sending the code again.");
            }
          });
          // Render it
          window.recaptchaVerifier.render().catch((err) => {
              console.error("reCAPTCHA render failed", err);
              setError("Could not render reCAPTCHA. Please check your network or ad-blocker.");
          });
        }
      } catch(e) {
          console.error("Recaptcha setup failed", e);
          setError("Could not initialize reCAPTCHA. Please check your network or ad-blocker.");
      }
    }

    // Cleanup when the component unmounts or dialog closes
    return () => {
      cleanupRecaptcha();
    };
  }, [open]);


  const handleSendOtp = async () => {
    setError(null);
    if (!window.recaptchaVerifier) {
      setError("reCAPTCHA is not ready. Please wait a moment and try again.");
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
      setError("Failed to send OTP. Is the phone number correct? You may also be rate-limited if you have tried too many times.");
      // Don't reset reCAPTCHA here, as user might want to try again immediately.
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
      await updateUserData({ phoneVerified: true });
      toast({ title: "Phone Verified!", description: "Your phone number is now verified."});
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
      // Delay state reset to allow for smoother closing animation
      setTimeout(() => {
        setStep('initial');
        setOtp('');
        setError(null);
        setIsLoading(false);
        window.confirmationResult = undefined;
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

          {/* This div must always be in the DOM when the dialog is open for reCAPTCHA to attach */}
          <div id="recaptcha-container"></div>

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
    </>
  );
}
