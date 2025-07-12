
'use client';

import React, { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/context/AuthProvider';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { sendPhoneOtp } from '@/ai/flows/send-phone-otp-flow';
import { verifyPhoneOtp } from '@/ai/flows/verify-phone-otp-flow';

export function PhoneVerificationDialog({ children, phone }: { children: React.ReactNode; phone: string }) {
  const { user, userData } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'initial' | 'verify'>('initial');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendOtp = async () => {
    setIsLoading(true);
    try {
      const result = await sendPhoneOtp({ phone });
      if (result.success) {
        toast({
          title: 'Demo: OTP Sent',
          description: 'A code has been sent to your phone. For this demo, use 654321.',
          duration: 9000
        });
        setStep('verify');
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send OTP.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!user || !db) return;
    setIsLoading(true);
    try {
      const result = await verifyPhoneOtp({ phone, otp });
      if (result.success) {
        const userDocRef = doc(db, 'users', user.uid);
        await updateDoc(userDocRef, { phoneVerified: true });
        toast({ title: 'Success', description: 'Your phone number has been verified.' });
        setOpen(false);
        // Reset state after closing
        setTimeout(() => {
          resetState();
        }, 300);
      } else {
        toast({ title: 'Error', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to verify OTP.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };
  
  const resetState = () => {
    setStep('initial');
    setOtp('');
    setIsLoading(false);
  }

  // Prevent dialog from opening if the phone number is already verified
  const onOpenDialog = (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (userData?.phoneVerified) {
        e.preventDefault();
        toast({ title: "Already Verified", description: "This phone number is already verified."});
        return;
    }
    setOpen(true);
  }


  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetState();
    }}>
      <DialogTrigger asChild>
        <div onClick={(e: any) => onOpenDialog(e)}>
            {children}
        </div>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verify Phone Number</DialogTitle>
          <DialogDescription>
            {step === 'initial'
              ? `We'll send a verification code to +91 ${phone}.`
              : `Enter the 6-digit code sent to +91 ${phone}.`}
          </DialogDescription>
        </DialogHeader>
        {step === 'verify' && (
          <div className="py-4">
            <Input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="123456"
              maxLength={6}
              disabled={isLoading}
            />
          </div>
        )}
        <DialogFooter>
          {step === 'initial' ? (
            <Button onClick={handleSendOtp} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send Code
            </Button>
          ) : (
            <div className='w-full flex justify-between'>
                <Button variant="ghost" onClick={resetState} disabled={isLoading}>Back</Button>
                <Button onClick={handleVerifyOtp} disabled={isLoading || otp.length < 6}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Verify
                </Button>
            </div>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
