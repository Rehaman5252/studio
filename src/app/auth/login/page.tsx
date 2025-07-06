'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, Loader2 } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [unverifiedUser, setUnverifiedUser] = useState<any>(null);
  const [isDemoMode] = useState(!isFirebaseConfigured);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const handleResendVerification = async () => {
      if (!unverifiedUser) return;
      setIsResending(true);
      try {
        await sendEmailVerification(unverifiedUser);
        toast({
            title: 'Verification Email Sent',
            description: 'A new verification link has been sent to your email address.',
        });
      } catch (error: any) {
        toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive',
        });
      } finally {
        setIsResending(false);
      }
  }

  const onSubmit = async (data: LoginFormValues) => {
    if (isDemoMode || !auth) {
        toast({
            title: "Demo Mode",
            description: "Login is disabled because Firebase is not configured.",
        });
        return;
    }

    setIsLoading(true);
    setUnverifiedUser(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
      
      if (!userCredential.user.emailVerified) {
        setUnverifiedUser(userCredential.user);
        toast({
            title: 'Email Not Verified',
            description: 'Please check your inbox and click the verification link to continue.',
            variant: 'destructive',
        });
        await auth.signOut(); // Log out the user until they are verified
      } else {
        router.push(from || '/home');
      }

    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Welcome Back!</CardTitle>
        <CardDescription>Enter your credentials to access your account</CardDescription>
      </CardHeader>
      <CardContent>
        {isDemoMode && (
            <Alert variant="default" className="mb-4 border-primary bg-primary/10">
                <Info className="h-4 w-4 text-primary" />
                <AlertTitle>Demo Mode</AlertTitle>
                <AlertDescription className="text-foreground/80">
                    Firebase is not configured. Login is disabled. The app uses a mock user for demonstration.
                </AlertDescription>
            </Alert>
        )}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="user@example.com" {...register('email')} disabled={isDemoMode} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" {...register('password')} disabled={isDemoMode} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || isDemoMode}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Log In
          </Button>
        </form>
        {unverifiedUser && (
             <Button variant="secondary" className="w-full mt-2" onClick={handleResendVerification} disabled={isResending}>
                {isResending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Resend Verification Email
            </Button>
        )}
        <div className="mt-4 text-center text-sm">
          Don't have an account?{' '}
          <Link href={`/auth/signup${from ? `?from=${encodeURIComponent(from)}` : ''}`} className="underline">
            Sign up
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
