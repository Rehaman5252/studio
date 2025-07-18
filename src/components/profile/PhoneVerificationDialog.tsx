
'use client';

import { useEffect, useRef, useState } from "react";
import type { ConfirmationResult, RecaptchaVerifier } from "firebase/auth";
import { getFirebaseClient } from "@/lib/firebaseClient";
import { useAuth } from '@/context/AuthProvider';
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface PhoneVerificationDialogProps {
  children: React.ReactNode;
  phone: string;
  onVerified: () => void;
}

export function PhoneVerificationDialog({ children, phone, onVerified }: PhoneVerificationDialogProps) {
  const { user, updateUserData } = useAuth();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<'initial' | 'verify'>('initial');
  const [otp, setOtp] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerifierReady, setIsVerifierReady] = useState(false);
  
  const recaptchaContainerRef = useRef<HTMLDivElement | null>(null);
  const verifierRef = useRef<RecaptchaVerifier | null>(null);
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);

  useEffect(() => {
    // If the dialog is not open, do nothing and ensure we clean up.
    if (!open) {
      if (verifierRef.current) {
        verifierRef.current.clear();
        verifierRef.current = null;
      }
      return;
    }

    // This timeout ensures the dialog and its container are fully mounted in the DOM
    // before we attempt to create and render the RecaptchaVerifier.
    const timer = setTimeout(() => {
      if (recaptchaContainerRef.current && !verifierRef.current) {
        getFirebaseClient().then(({ auth }) => {
          const { RecaptchaVerifier: FirebaseRecaptchaVerifier } = require('firebase/auth');
          
          try {
            const verifier = new FirebaseRecaptchaVerifier(auth, recaptchaContainerRef.current!, {
              size: 'invisible',
              callback: () => {
                console.log('reCAPTCHA automatically solved');
              },
              'expired-callback': () => {
                toast({ title: "reCAPTCHA Expired", description: "Please try sending the code again.", variant: "destructive" });
                verifierRef.current?.clear();
                setIsVerifierReady(false);
              },
            });
            verifierRef.current = verifier;

            verifier.render().then(() => {
              console.log("✅ reCAPTCHA rendered successfully.");
              setIsVerifierReady(true);
            }).catch(error => {
              console.error('❌ reCAPTCHA failed to render:', error);
              toast({
                title: "Verification Setup Failed",
                description: "Could not initialize phone verification. Disable any ad blockers/VPNs and check your network connection.",
                variant: "destructive",
                duration: 9000,
              });
              setIsVerifierReady(false);
            });
          } catch(e) {
            console.error('Error creating RecaptchaVerifier', e)
          }
        });
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (verifierRef.current) {
        verifierRef.current.clear();
        verifierRef.current = null;
      }
    };
  }, [open, toast]);

  const handleSendOtp = async () => {
    if (!isVerifierReady || !verifierRef.current) {
      toast({ title: 'Error', description: 'reCAPTCHA verifier is not ready. Please wait or try again.', variant: 'destructive' });
      return;
    }
    
    setIsSending(true);
    const appVerifier = verifierRef.current;
    
    try {
      const { auth } = await getFirebaseClient();
      const { signInWithPhoneNumber } = await import('firebase/auth');
      const fullPhoneNumber = `+91${phone}`;
      
      const result = await signInWithPhoneNumber(auth, fullPhoneNumber, appVerifier);
      confirmationResultRef.current = result;
      
      toast({ title: 'OTP Sent', description: `A code has been sent to ${fullPhoneNumber}.` });
      setStep('verify');
    } catch (error: any) {
      console.error("🔥 Error sending OTP:", error);
      let description = 'Failed to send OTP. Please try again.';
      if (error.code === 'auth/invalid-phone-number') {
        description = 'The phone number format is invalid. Please ensure it is 10 digits.';
      } else if (error.code === 'auth/too-many-requests') {
        description = "You've sent too many requests. Please try again later.";
      } else if (error.code === 'auth/internal-error-encountered' || error.message.includes('reCAPTCHA')) {
          description = "An internal error occurred. This is often caused by ad blockers, VPNs, or missing 'localhost' in Firebase's Authorized Domains. Please check and try again.";
      }
      toast({ title: 'Error Sending OTP', description, variant: 'destructive', duration: 9000 });
    } finally {
      setIsSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!user || !confirmationResultRef.current) return;
    setIsVerifying(true);
    try {
      await confirmationResultRef.current.confirm(otp);
      
      if (updateUserData) {
        await updateUserData({ phoneVerified: true, phone: phone });
      }
      
      toast({ title: 'Success', description: 'Your phone number has been verified.' });
      onVerified();
      resetStateAndClose(false);
    } catch (error: any) {
      console.error('Error verifying OTP:', error);
      toast({ title: 'Verification Failed', description: 'The code you entered is incorrect.', variant: 'destructive' });
    } finally {
      setIsVerifying(false);
    }
  };

  const resetStateAndClose = (isOpen: boolean) => {
    if (!isOpen) {
      setStep('initial');
      setOtp('');
      setIsSending(false);
      setIsVerifying(false);
      setIsVerifierReady(false);
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
        
        <div ref={recaptchaContainerRef} />

        {step === 'verify' && (
          <div className="py-4">
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              maxLength={6}
              disabled={isVerifying}
              type="tel"
            />
          </div>
        )}
        
        <DialogFooter>
          {step === 'initial' ? (
            <Button onClick={handleSendOtp} disabled={!isVerifierReady || isSending} className="w-full">
              {isSending ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...</>
              : !isVerifierReady ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Initializing...</>
              : 'Send Code'}
            </Button>
          ) : (
            <div className="w-full flex justify-between">
              <Button variant="ghost" onClick={() => { setStep('initial'); setOtp(''); }} disabled={isVerifying}>Back</Button>
              <Button onClick={handleVerifyOtp} disabled={isVerifying || otp.length < 6}>
                {isVerifying ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</> : 'Verify & Save'}
              </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
