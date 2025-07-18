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
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { handleGoogleSignIn } from '@/lib/authUtils';
import FirebaseConfigWarning from './FirebaseConfigWarning';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.651-3.356-11.303-8H6.306C9.656,39.663,16.318,44,24,44z"/>
        <path fill="#1565C0" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,35.091,44,29.836,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
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
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onLogin = async (data: LoginFormValues) => {
    setIsLoading(true);
    if (!auth) {
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
        <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
        <p className="text-muted-foreground">
          New to the crease?{' '}
          <Link href={`/auth/signup${from ? `?from=${from}` : ''}`} className="font-semibold text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>

      {!isFirebaseConfigured ? (
        <FirebaseConfigWarning />
      ) : (
        <div className="space-y-4">
            <Button variant="outline" className="w-full" onClick={onGoogleLogin} disabled={isAuthDisabled}>
                {isGoogleLoading ? <Loader2 className="animate-spin" /> : <><GoogleIcon className="mr-3 h-5 w-5" /> Continue with Google</>}
            </Button>

            <div className="relative">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">
                Or continue with
                </span>
            </div>
            </div>

            <form onSubmit={handleSubmit(onLogin)} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="sachin@tendulkar.com" {...register('email')} disabled={isAuthDisabled} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link href="/auth/forgot-password" className="text-sm font-semibold text-primary hover:underline">
                        Forgot password?
                    </Link>
                </div>
                <div className="relative">
                    <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...register('password')} disabled={isAuthDisabled} />
                    <Button type="button" variant="ghost" size="icon" className="absolute top-0 right-0 h-full px-3" onClick={() => setShowPassword(prev => !prev)}>
                      {showPassword ? <EyeOff /> : <Eye />}
                    </Button>
                </div>
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={isAuthDisabled}>
                {isLoading && <Loader2 className="animate-spin mr-2" />}
                Sign In
            </Button>
            </form>
        </div>
      )}
    </div>
  );
}
