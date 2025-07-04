
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleSendOtp = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter your email address.",
      });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setIsOtpSent(true);
      setLoading(false);
      toast({
        title: "OTP Sent",
        description: "Please check your email for the verification code.",
      });
    }, 1500);
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter the OTP.",
      });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      router.replace('/walkthrough');
    }, 1500);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-primary to-green-400 p-4">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8 text-white">
          <div className="inline-block bg-white/20 p-4 rounded-full">
            <span className="text-6xl">🏏</span>
          </div>
          <h1 className="text-4xl font-extrabold mt-4">Indcric</h1>
          <p className="text-lg opacity-90">Win ₹100 for 100 Seconds</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isOtpSent ? 'Verify Your Email' : 'Welcome to Indcric'}</CardTitle>
            <CardDescription>
              {isOtpSent 
                ? 'Enter the 6-digit code sent to your email.'
                : 'Enter your email to get started.'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isOtpSent ? (
              <div className="space-y-4">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    className="pl-10"
                    placeholder="Enter your email"
                    value={email}
                    onChangeText={setEmail}
                    type="email"
                    autoCapitalize="none"
                  />
                </div>
                <Button
                  className="w-full bg-accent hover:bg-accent/90"
                  onClick={handleSendOtp}
                  disabled={loading}
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  className="text-center tracking-[0.5em] text-lg font-bold"
                  placeholder="------"
                  value={otp}
                  onChangeText={setOtp}
                  type="number"
                  maxLength={6}
                />
                <Button
                  className="w-full bg-accent hover:bg-accent/90"
                  onClick={handleVerifyOtp}
                  disabled={loading}
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button
                  variant="link"
                  className="w-full"
                  onClick={handleSendOtp}
                >
                  Didn't receive OTP? Resend
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="mt-8 text-center text-white space-y-4">
            <h3 className="text-xl font-semibold">Why choose Indcric?</h3>
            <div className="flex justify-center gap-4 text-left">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">💰</span>
                    <span>Win real money</span>
                </div>
                 <div className="flex items-center gap-2">
                    <span className="text-2xl">🏆</span>
                    <span>Brand rewards</span>
                </div>
                 <div className="flex items-center gap-2">
                    <span className="text-2xl">⚡</span>
                    <span>Quick quizzes</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}
