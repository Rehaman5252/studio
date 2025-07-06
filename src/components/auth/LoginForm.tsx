'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { auth, isFirebaseConfigured } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { AlertCircle, Loader2 } from 'lucide-react';
import { handleGoogleSignIn } from '@/lib/authUtils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" {...props}>
        <title>Google</title>
        <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.85 3.18-1.73 4.1-1.02 1.02-2.6 1.62-4.38 1.62-3.8 0-6.88-3.1-6.88-6.9s3.08-6.9 6.88-6.9c2.14 0 3.54.88 4.34 1.62l2.44-2.34C18.44 2.14 15.47 1 12.48 1 5.88 1 1 5.98 1 12.5s4.88 11.5 11.48 11.5c3.54 0 6.2-1.18 8.18-3.12 2.05-2.05 2.7-5.14 2.7-7.72v-.8h-11.88z" />
    </svg>
);

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Please enter your password.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onLogin = async (data: LoginFormValues) => {
    setIsLoading(true);
    if (!isFirebaseConfigured || !auth) {
        toast({
            title: "Authentication Unavailable",
            description: "The authentication service is not configured. Please contact the site administrator.",
            variant: "destructive",
        });
        setIsLoading(false);
        return;
    }

    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      router.push(from || '/home');
    } catch (error: any) {
      toast({
        title: 'Login Failed',
        description: 'Invalid credentials. Please check your email and password.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const onGoogleLogin = async () => {
    setIsGoogleLoading(true);
    await handleGoogleSignIn(
        () => router.push(from || '/home'),
        (errorMsg) => toast({ title: 'Google Sign-In Failed', description: errorMsg, variant: 'destructive' })
    );
    setIsGoogleLoading(false);
  }

  const isAuthDisabled = isLoading || isGoogleLoading;

  return (
    <div className="flex h-full flex-col justify-center space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Welcome Back!</h1>
        <p className="text-muted-foreground">
          Don't have an account?{' '}
          <Link href={`/auth/signup${from ? `?from=${from}` : ''}`} className="font-semibold text-primary hover:underline">
            Sign up
          </Link>
        </p>
      </div>

      <div className="space-y-4">
        {!isFirebaseConfigured && (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Firebase Not Configured</AlertTitle>
                <AlertDescription>
                    The app cannot connect to the authentication service. If you are the developer, please ensure your Firebase environment variables are set in your hosting provider's settings.
                </AlertDescription>
            </Alert>
        )}
      
        <Button variant="outline" className="w-full text-base py-6" onClick={onGoogleLogin} disabled={isAuthDisabled || !isFirebaseConfigured}>
            {isGoogleLoading ? <Loader2 className="animate-spin" /> : <><GoogleIcon className="h-5 w-5 mr-3" /> Continue with Google</>}
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">
              Or with email
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onLogin)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="sachin@tendulkar.com" {...register('email')} disabled={isAuthDisabled || !isFirebaseConfigured} suppressHydrationWarning />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="••••••••" {...register('password')} disabled={isAuthDisabled || !isFirebaseConfigured} suppressHydrationWarning />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
          <Button type="submit" className="w-full text-base py-6" disabled={isAuthDisabled || !isFirebaseConfigured} suppressHydrationWarning>
            {isLoading && <Loader2 className="animate-spin mr-2" />}
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}
