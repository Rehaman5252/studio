
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getFirebaseAuth, isFirebaseConfigured } from '@/lib/firebaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { handleGoogleSignIn, registerWithEmail } from '@/lib/authUtils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { sendEmailVerification } from 'firebase/auth';
import FirebaseConfigWarning from './FirebaseConfigWarning';

const GoogleIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" {...props}>
        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.651-3.356-11.303-8H6.306C9.656,39.663,16.318,44,24,44z"/>
        <path fill="#1565C0" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C39.99,35.091,44,29.836,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
    </svg>
);

const signupSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
  referralCode: z.string().optional(),
});
type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const refCodeFromUrl = searchParams.get('ref') || '';
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const form = useForm<SignupFormValues>({ 
    resolver: zodResolver(signupSchema),
    defaultValues: {
      referralCode: refCodeFromUrl
    }
  });

  const onGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
        const user = await handleGoogleSignIn(form.getValues('referralCode') || refCodeFromUrl);
        if (user) {
            toast({ title: 'Signed In!', description: `Welcome, ${user.displayName}!` });
            router.replace('/complete-profile');
        }
    } catch (error: any) {
         if (error.code !== 'auth/popup-closed-by-user' && error.code !== 'auth/cancelled-popup-request') {
             toast({ title: 'Sign Up Failed', description: 'Could not sign in with Google. Please try again.', variant: 'destructive' });
         }
    } finally {
        setIsGoogleLoading(false);
    }
  };

  const onEmailSignUp = async (data: SignupFormValues) => {
    setIsLoading(true);
    const auth = getFirebaseAuth();
    if (!auth) {
        toast({ title: "Error", description: "Authentication services are not ready. Please try again later.", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    try {
        const userCredential = await registerWithEmail(data.email, data.password, data.name, data.referralCode || null);
        if (auth.currentUser) {
            await sendEmailVerification(auth.currentUser);
        }
        
        toast({ title: 'Account Created!', description: 'Please check your email to verify your account.' });
        router.push(`/auth/verify-email${from ? `?from=${from}` : ''}`);

    } catch (error: any) {
        let description = 'An unexpected error occurred. Please try again.';
        if (error.code === 'auth/email-already-in-use') {
            description = 'This email is already registered. Please log in instead.';
        } else if (error.code === 'auth/weak-password') {
            description = 'The password is too weak. Please use at least 6 characters.';
        } else if (error.code === 'auth/invalid-email') {
            description = 'The email address is not valid.';
        } else if (error.code === 'auth/network-request-failed') {
            description = 'You appear to be offline. Please check your connection and try again.';
        } else {
            console.error("Signup Error:", error);
        }
        toast({ title: 'Sign Up Failed', description, variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  };

  const isAuthDisabled = isLoading || isGoogleLoading;
  
  return (
    <Card className="w-full max-w-md shadow-2xl shadow-black/20">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Join the Squad</CardTitle>
        <CardDescription>Create an account to start your innings</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {!isFirebaseConfigured ? <FirebaseConfigWarning /> : (
            <>
                <Button variant="outline" className="w-full" onClick={onGoogleSignUp} disabled={isAuthDisabled}>
                    {isGoogleLoading ? (
                        <><Loader2 className="animate-spin mr-2" /> Signing Up...</>
                    ) : (
                        <><GoogleIcon className="mr-3 h-5 w-5" /> Continue with Google</>
                    )}
                </Button>
                <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div>
                </div>
                
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onEmailSignUp)} className="space-y-4">
                    <FormField control={form.control} name="name" render={({ field }) => (
                        <FormItem><FormLabel>Name</FormLabel><FormControl><Input placeholder="Sachin Tendulkar" {...field} disabled={isAuthDisabled} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="email" render={({ field }) => (
                        <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="sachin@tendulkar.com" {...field} disabled={isAuthDisabled} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="password" render={({ field }) => (
                        <FormItem><FormLabel>Password</FormLabel><div className="relative"><FormControl><Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...field} disabled={isAuthDisabled} /></FormControl><Button type="button" variant="ghost" size="icon" className="absolute top-0 right-0 h-full px-3" onClick={() => setShowPassword(p => !p)} aria-label="Toggle password visibility">{showPassword ? <EyeOff /> : <Eye />}</Button></div><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="referralCode" render={({ field }) => (
                        <FormItem><FormLabel>Referral Code (Optional)</FormLabel><FormControl><Input placeholder="Enter friend's code" {...field} disabled={isAuthDisabled} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <Button type="submit" className="w-full" disabled={isAuthDisabled}>
                        {isLoading ? ( <><Loader2 className="animate-spin mr-2" /> Creating Account...</> ) : "Create Account"}
                    </Button>
                </form>
                </Form>
            </>
        )}
      </CardContent>
      <CardFooter className="flex justify-center text-sm">
        <p className="text-muted-foreground">
            Already have an account?{' '}
            <Link href={`/auth/login${from ? `?from=${from}` : ''}`} className="font-semibold text-primary hover:underline">
                Sign in here
            </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
