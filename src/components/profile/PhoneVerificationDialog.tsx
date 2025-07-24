
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
  const [isVerifierReady, setIsVerifierReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  // A ref for the container div to ensure it's stable across renders
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);

  const cleanupRecaptcha = useCallback(() => {
    if (recaptchaVerifierRef.current) {
        recaptchaVerifierRef.current.clear();
        recaptchaVerifierRef.current = null;
    }
    if (recaptchaContainerRef.current) {
        recaptchaContainerRef.current.innerHTML = '';
    }
    setIsVerifierReady(false);
  }, []);
  
  useEffect(() => {
    if (open) {
      // Use a short timeout to ensure the dialog and its container are mounted in the DOM
      setTimeout(() => {
        if (!app) {
          setError("Firebase app is not configured correctly.");
          return;
        }
        
        const container = recaptchaContainerRef.current;
        if (container && !recaptchaVerifierRef.current) {
          try {
            const auth = getAuth(app);
            // Ensure the container is empty before creating a new verifier
            container.innerHTML = ''; 
            const verifier = new FirebaseRecaptchaVerifier(auth, container, {
              size: 'invisible',
              callback: () => {
                console.log("✅ reCAPTCHA challenge solved.");
                setIsVerifierReady(true);
              },
              'expired-callback': () => {
                console.warn("⚠️ reCAPTCHA expired.");
                setError("reCAPTCHA expired. Please try sending the code again.");
                cleanupRecaptcha();
              }
            });

            recaptchaVerifierRef.current = verifier;
            
            verifier.render().then(() => {
                console.log("✅ reCAPTCHA rendered and ready");
                setIsVerifierReady(true);
            }).catch(err => {
                console.error("❌ reCAPTCHA render error:", err);
                setError("Could not render reCAPTCHA. A page refresh might be needed, or your browser might be blocking it.");
            });
          } catch (err) {
            console.error('❌ reCAPTCHA setup failed:', err);
            setError('Could not initialize reCAPTCHA. Please try again.');
          }
        }
      }, 100);
    } else {
      cleanupRecaptcha();
    }
  }, [open, cleanupRecaptcha]);

  const handleSendOtp = async () => {
    setError(null);
    if (!recaptchaVerifierRef.current || !isVerifierReady) {
      setError("reCAPTCHA is not ready. Please wait a moment or re-open the dialog.");
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
      console.error("❌ OTP send error:", err);
      if (err.code === 'auth/internal-error') {
        setError("Firebase encountered an internal error. This might be due to a temporary service issue or a problem with reCAPTCHA. Please try again.");
      } else if (err.code === 'auth/too-many-requests') {
        setError("You have sent too many requests. Please wait a while before trying again.");
      } else {
        setError("Failed to send OTP. You may be rate-limited or the number may be incorrect. Please try again.");
      }
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
      console.error("❌ OTP verification error:", err);
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
      <div id="recaptcha-container-wrapper">
         <div ref={recaptchaContainerRef}></div>
      </div>
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

          {step === 'initial' && !isVerifierReady && !error && (
            <div className="flex items-center justify-center text-sm text-muted-foreground p-4">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Initializing reCAPTCHA...
            </div>
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
              <Button onClick={handleSendOtp} disabled={isLoading || !isVerifierReady} className="w-full">
                {(isLoading || !isVerifierReady) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isLoading ? 'Sending...' : !isVerifierReady ? 'Initializing...' : 'Send Code'}
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
