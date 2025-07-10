
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
import { isFirebaseConfigured, auth } from '@/lib/firebase';
import FirebaseConfigWarning from './FirebaseConfigWarning';
import { sendPasswordResetEmail } from 'firebase/auth';

// Schemas
const emailSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
});

type EmailFormValues = z.infer<typeof emailSchema>;

export default function ForgotPasswordForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const emailForm = useForm<EmailFormValues>({ resolver: zodResolver(emailSchema) });

  const handleSendResetEmail = async (data: EmailFormValues) => {
    setIsLoading(true);
    if (!auth) {
        toast({ title: 'Error', description: 'Authentication service not available.', variant: 'destructive' });
        setIsLoading(false);
        return;
    }
    try {
      await sendPasswordResetEmail(auth, data.email);
      toast({
          title: 'Password Reset Email Sent',
          description: 'Please check your email for a link to reset your password.',
        });
      setIsSuccess(true);
    } catch (error: any) {
      console.error(error);
      toast({ title: 'Error', description: 'Could not send reset email. Please check the address and try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
        <div className="flex h-full flex-col justify-center space-y-6 text-center">
            <h1 className="text-3xl font-bold tracking-tight">Check Your Inbox</h1>
            <p className="text-muted-foreground">A password reset link has been sent to your email address.</p>
            <Button onClick={() => router.push('/auth/login')} className="w-full">
                Back to Login
            </Button>
        </div>
    )
  }

  return (
    <div className="flex h-full flex-col justify-center space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Forgot Password</h1>
        <p className="text-muted-foreground">Enter your email to receive a password reset link.</p>
      </div>

      {!isFirebaseConfigured ? (
         <FirebaseConfigWarning />
      ) : (
         <form onSubmit={emailForm.handleSubmit(handleSendResetEmail)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="sachin@tendulkar.com" {...emailForm.register('email')} disabled={isLoading} />
              {emailForm.formState.errors.email && <p className="text-sm text-destructive">{emailForm.formState.errors.email.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading && <Loader2 className="animate-spin mr-2" />}
              Send Reset Link
            </Button>
          </form>
      )}

      <p className="text-center text-sm text-muted-foreground">
          Remember your password?{' '}
          <Link href="/auth/login" className="font-semibold text-primary hover:underline">
              Sign in
          </Link>
      </p>
    </div>
  );
}
