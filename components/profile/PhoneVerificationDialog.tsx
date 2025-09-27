
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthProvider';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
} from 'firebase/auth';
import { auth } from '@/lib/firebase';

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
    confirmationResult: ConfirmationResult;
  }
}

interface PhoneVerificationDialogProps {
  phone: string;
  children: React.ReactNode;
}

export function PhoneVerificationDialog({ phone, children }: PhoneVerificationDialogProps) {
  const [open, setOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const { toast } = useToast();
  const { updateUserData } = useAuth();
  
  const setupRecaptcha = () => {
    if (typeof window !== 'undefined' && auth && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {
          // reCAPTCHA solved, allow signInWithPhoneNumber.
        },
      });
    }
  };

  const handleSendOtp = async () => {
    setIsLoading(true);
    try {
      if(!auth) throw new Error("Auth service is not available.");
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const confirmationResult = await signInWithPhoneNumber(auth, `+${phone}`, appVerifier);
      window.confirmationResult = confirmationResult;
      setIsOtpSent(true);
      toast({ title: 'OTP Sent', description: 'Check your phone for the verification code.' });
    } catch (error: any) {
      console.error('SMS not sent error', error);
      toast({
        title: 'Failed to Send OTP',
        description: 'Could not send verification code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast({ title: 'Invalid OTP', description: 'Please enter a 6-digit OTP.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const result = await window.confirmationResult.confirm(otp);
      if (result.user) {
        await updateUserData({ phoneVerified: true });
        toast({ title: 'Success!', description: 'Your phone number has been verified.' });
        setOpen(false);
      }
    } catch (error) {
      console.error('OTP verification error', error);
      toast({ title: 'Verification Failed', description: 'The OTP you entered is incorrect.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verify Your Phone Number</DialogTitle>
          <DialogDescription>
            {isOtpSent
              ? `We've sent a 6-digit code to +${phone}. Please enter it below.`
              : 'We will send a one-time password (OTP) to your number to verify it.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {!isOtpSent ? (
            <div className="text-center">
              <p className="font-semibold text-lg">Your number: +{phone}</p>
              <div id="recaptcha-container" className="my-2"></div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="otp">Enter OTP</Label>
              <Input
                id="otp"
                type="tel"
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                disabled={isLoading}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isLoading}>
              Cancel
            </Button>
          </DialogClose>
          {isOtpSent ? (
            <Button onClick={handleVerifyOtp} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Verify OTP
            </Button>
          ) : (
            <Button onClick={handleSendOtp} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send OTP
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
