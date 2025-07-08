'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { sendOtp } from '@/ai/flows/send-otp-flow';
import { verifyOtp } from '@/ai/flows/verify-otp-flow';
import { isFirebaseConfigured } from '@/lib/firebase';
import FirebaseConfigWarning from './FirebaseConfigWarning';

// Schemas
const emailSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});
const otpSchema = z.object({
  otp: z.string().length(6, { message: 'OTP must be 6 digits.' }),
});
const passwordSchema = z.object({
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type EmailFormValues = z.infer<typeof emailSchema>;
type OtpFormValues = z.infer<typeof otpSchema>;
type PasswordFormValues = z.infer<typeof passwordSchema>;

type FormStep = 'enter_email' | 'verify_otp' | 'reset_password' | 'success';

export default function ForgotPasswordForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [formStep, setFormStep] = useState<FormStep>('enter_email');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const emailForm = useForm<EmailFormValues>({ resolver: zodResolver(emailSchema) });
  const otpForm = useForm<OtpFormValues>({ resolver: zodResolver(otpSchema) });
  const passwordForm = useForm<PasswordFormValues>({ resolver: zodResolver(passwordSchema) });

  const handleSendOtp = async (data: EmailFormValues) => {
    setIsLoading(true);
    try {
      const result = await sendOtp({ email: data.email });
      if (result.success) {
        toast({
          title: 'Demo: OTP Sent',
          description: 'This is a demo. Please use OTP: 123456 to proceed.',
          duration: 9000,
        });
        setEmail(data.email);
        setFormStep('verify_otp');
      } else {
        toast({ title: 'Failed to Send OTP', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (data: OtpFormValues) => {
    setIsLoading(true);
    try {
      const result = await verifyOtp({ email, otp: data.otp });
      if (result.success) {
        toast({ title: 'Email Verified', description: 'Please set your new password.' });
        setFormStep('reset_password');
      } else {
        toast({ title: 'Verification Failed', description: result.message, variant: 'destructive' });
      }
    } catch (error) {
      toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (data: PasswordFormValues) => {
    setIsLoading(true);
    // In a real app, you would call a Firebase function here to update the password.
    // For this simulation, we'll just show a success message.
    console.log(`Simulating password reset for ${email} with password ${data.password}`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({ title: 'Password Reset Successful', description: 'Your password has been changed.' });
    setFormStep('success');
    setIsLoading(false);
  };
  
  const renderFormContent = () => {
    switch (formStep) {
      case 'enter_email':
        return (
          <form onSubmit={emailForm.handleSubmit(handleSendOtp)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="sachin@tendulkar.com" {...emailForm.register('email')} disabled={isLoading} />
              {emailForm.formState.errors.email && <p className="text-sm text-destructive">{emailForm.formState.errors.email.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="animate-spin mr-2" />}
              Send Verification Code
            </Button>
          </form>
        );
      case 'verify_otp':
        return (
          <form onSubmit={otpForm.handleSubmit(handleVerifyOtp)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">One-Time Password</Label>
              <Input id="otp" type="text" placeholder="123456" {...otpForm.register('otp')} disabled={isLoading} autoComplete="one-time-code" />
              {otpForm.formState.errors.otp && <p className="text-sm text-destructive">{otpForm.formState.errors.otp.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="animate-spin mr-2" />}
              Verify
            </Button>
          </form>
        );
      case 'reset_password':
        return (
          <form onSubmit={passwordForm.handleSubmit(handleResetPassword)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...passwordForm.register('password')} disabled={isLoading} />
                <Button type="button" variant="ghost" size="icon" className="absolute top-0 right-0 h-full px-3" onClick={() => setShowPassword(prev => !prev)}>
                  {showPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
              {passwordForm.formState.errors.password && <p className="text-sm text-destructive">{passwordForm.formState.errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
               <div className="relative">
                <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} placeholder="••••••••" {...passwordForm.register('confirmPassword')} disabled={isLoading} />
                <Button type="button" variant="ghost" size="icon" className="absolute top-0 right-0 h-full px-3" onClick={() => setShowConfirmPassword(prev => !prev)}>
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                </Button>
              </div>
              {passwordForm.formState.errors.confirmPassword && <p className="text-sm text-destructive">{passwordForm.formState.errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="animate-spin mr-2" />}
              Reset Password
            </Button>
          </form>
        );
        case 'success':
            return (
                <div className="space-y-4 text-center">
                    <p>Your password has been successfully reset.</p>
                    <Button onClick={() => router.push('/auth/login')} className="w-full">
                        Back to Login
                    </Button>
                </div>
            );
    }
  };
  
  const getStepTitle = () => {
      switch(formStep) {
          case 'enter_email': return 'Forgot Password';
          case 'verify_otp': return 'Check Your Email';
          case 'reset_password': return 'Set a New Password';
          case 'success': return 'Success!';
      }
  }

  const getStepDescription = () => {
    switch(formStep) {
        case 'enter_email': return 'Enter your email to receive a verification code.';
        case 'verify_otp': return `We sent a code to ${email}.`;
        case 'reset_password': return 'Your new password must be at least 6 characters.';
        case 'success': return 'You can now log in with your new password.';
    }
  }

  return (
    <div className="flex h-full flex-col justify-center space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">{getStepTitle()}</h1>
        <p className="text-muted-foreground">{getStepDescription()}</p>
      </div>

      {!isFirebaseConfigured ? (
         <FirebaseConfigWarning />
      ) : (
         <div className="space-y-4">
            {renderFormContent()}
         </div>
      )}

      {formStep !== 'success' && (
          <p className="text-center text-sm text-muted-foreground">
              Remember your password?{' '}
              <Link href="/auth/login" className="font-semibold text-primary hover:underline">
                  Sign in
              </Link>
          </p>
      )}
    </div>
  );
}
