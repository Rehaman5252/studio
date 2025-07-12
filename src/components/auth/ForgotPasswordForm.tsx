
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { isFirebaseConfigured, auth } from '@/lib/firebase';
import FirebaseConfigWarning from './FirebaseConfigWarning';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

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
        <Card className="w-full max-w-md">
            <CardHeader className="text-center">
                <CardTitle>Check Your Inbox</CardTitle>
                <CardDescription>A password reset link has been sent to your email address.</CardDescription>
            </CardHeader>
            <CardFooter>
                <Button onClick={() => router.push('/auth/login')} className="w-full">
                    Back to Login
                </Button>
            </CardFooter>
        </Card>
    )
  }

  return (
    <Card className="w-full max-w-md">
        <CardHeader className="text-center">
            <CardTitle>Forgot Password</CardTitle>
            <CardDescription>Enter your email to receive a password reset link.</CardDescription>
        </CardHeader>
        <form onSubmit={emailForm.handleSubmit(handleSendResetEmail)}>
            <CardContent className="space-y-4">
                 {!isFirebaseConfigured ? (
                    <FirebaseConfigWarning />
                ) : (
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" placeholder="sachin@tendulkar.com" {...emailForm.register('email')} disabled={isLoading} />
                        {emailForm.formState.errors.email && <p className="text-sm text-destructive">{emailForm.formState.errors.email.message}</p>}
                    </div>
                )}
            </CardContent>
            <CardFooter className="flex flex-col gap-4">
                 <Button type="submit" className="w-full" disabled={isLoading || !isFirebaseConfigured}>
                    {isLoading && <Loader2 className="animate-spin mr-2" />}
                    Send Reset Link
                </Button>
                 <p className="text-center text-sm text-muted-foreground">
                    Remember your password?{' '}
                    <Link href="/auth/login" className="font-semibold text-primary hover:underline">
                        Sign in
                    </Link>
                </p>
            </CardFooter>
        </form>
    </Card>
  );
}
