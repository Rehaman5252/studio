

'use client';

import React, { Suspense } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/context/AuthProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const signupSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phone: z.string().regex(/^\d{10}$/, { message: 'Please enter a valid 10-digit phone number.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  referralCode: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

const GoogleIcon = () => (
    <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
        <path fill="currentColor" d="M488 261.8C488 403.3 381.5 512 244 512S0 403.3 0 261.8C0 120.3 106.5 8 244 8s244 112.3 244 253.8zM138.3 336.7c-21.7-21.7-33.2-50.2-33.2-80.1s11.5-58.4 33.2-80.1c21.7-21.7 50.2-33.2 80.1-33.2s58.4 11.5 80.1 33.2c21.7 21.7 33.2 50.2 33.2 80.1s-11.5 58.4-33.2 80.1c-21.7 21.7-50.2-33.2-80.1-33.2s-58.4-11.5-80.1-33.2z"></path>
    </svg>
);


function AuthFormComponent({ type }: { type: 'login' | 'signup' }) {
  const { registerWithEmail, loginWithEmail, signInWithGoogle, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  const formSchema = type === 'login' ? loginSchema : signupSchema;

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      referralCode: searchParams.get('ref') || '',
    },
  });

  const { isSubmitting } = form.formState;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const from = searchParams.get('from') || '/';
    let result = null;

    if (type === 'signup') {
        const { name, email, phone, password, referralCode } = values as z.infer<typeof signupSchema>;
        result = await registerWithEmail(name, email, phone, password, referralCode);
        if (result) {
            toast({
                title: "Signup Successful!",
                description: "A verification link has been sent to your email. Please verify to continue.",
            });
        }
    } else {
        const { email, password } = values as z.infer<typeof loginSchema>;
        result = await loginWithEmail(email, password);
    }
    
    if (result) {
        router.replace(from);
    }
  };
  
  const handleGoogleSignIn = async () => {
    const from = searchParams.get('from') || '/';
    const result = await signInWithGoogle();
     if (result) {
        router.replace(from);
    }
  }

  if (user) {
    const from = searchParams.get('from') || '/';
    router.replace(from);
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>{type === 'login' ? 'Time to Bat Again! 🏏' : 'Join the Squad! 🧢'}</CardTitle>
        <CardDescription>
          {type === 'login' ? 'Welcome back, player! Log in to face the next challenge.' : 'Sign up to start your cricket journey and climb the leaderboard.'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {type === 'signup' && (
              <>
                <FormField control={form.control} name="name" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl><Input placeholder="John Doe" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="phone" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl><Input placeholder="10-digit number" type="tel" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </>
            )}
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl><Input placeholder="you@example.com" type="email" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl><Input placeholder="••••••••" type="password" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            {type === 'signup' && (
                <FormField control={form.control} name="referralCode" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referral Code (Optional)</FormLabel>
                    <FormControl><Input placeholder="Enter code from a friend" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {type === 'login' ? 'Login' : 'Sign Up'}
            </Button>
          </form>
        </Form>
        <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
            </div>
        </div>
        <Button variant="outline" className="w-full" onClick={handleGoogleSignIn} disabled={isSubmitting}>
           <GoogleIcon /> Google
        </Button>
      </CardContent>
      <CardFooter className="justify-center">
        <p className="text-sm text-muted-foreground">
          {type === 'login' ? "Don't have an account?" : 'Already have an account?'}
          <Button variant="link" asChild className="p-1">
            <Link href={type === 'login' ? `/auth/signup?${searchParams.toString()}` : `/auth/login?${searchParams.toString()}`}>
              {type === 'login' ? 'Sign Up' : 'Login'}
            </Link>
          </Button>
        </p>
      </CardFooter>
    </Card>
  );
}

// Wrap the component in Suspense for useSearchParams
export default function AuthForm(props: { type: 'login' | 'signup' }) {
    return (
        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin h-8 w-8" /></div>}>
            <AuthFormComponent {...props} />
        </Suspense>
    )
}
