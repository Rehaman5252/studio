
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/context/AuthProvider';
import { isFirebaseConfigured } from '@/lib/firebaseClient';
import { Checkbox } from '../ui/checkbox';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '../ui/form';
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
  phone: z.string().regex(/^\d{10}$/, { message: 'Please enter a valid 10-digit phone number.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  referralCode: z.string().optional(),
  terms: z.literal(true, {
    errorMap: () => ({ message: "You must accept the terms and conditions." }),
  }),
});
type SignupFormValues = z.infer<typeof signupSchema>;

export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from');
  const { toast } = useToast();
  const { registerWithEmail, signInWithGoogle, isProfileComplete } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const form = useForm<SignupFormValues>({ 
    resolver: zodResolver(signupSchema), 
    defaultValues: { 
        name: '',
        email: '',
        phone: '',
        password: '',
        referralCode: '',
        terms: false 
    } 
  });

  const handleSuccessfulGoogleLogin = (isComplete: boolean) => {
    toast({ title: "Signed In", description: "Welcome!" });
    if (from) {
        router.replace(from);
    } else {
        router.replace(isComplete ? '/home' : '/complete-profile');
    }
  }

  const onGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    try {
        const user = await signInWithGoogle();
        if (user) {
            handleSuccessfulGoogleLogin(isProfileComplete);
        }
    } catch(error) {
        console.error("Google signup failed in component", error);
    } finally {
        setIsGoogleLoading(false);
    }
  };

  const onEmailSignUp = async (data: SignupFormValues) => {
    setIsLoading(true);
    const user = await registerWithEmail(data.name, data.email, data.phone, data.password, data.referralCode);
    if (user) {
      toast({ title: 'Account Created!', description: 'Please check your email (including spam/all folders) to verify your account.' });
      router.push(`/auth/verify-email?from=${from || '/home'}`);
    }
    setIsLoading(false);
  };

  const isAuthDisabled = isLoading || isGoogleLoading;
  
  return (
    <Card className="w-full max-w-md shadow-2xl shadow-black/20">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
        <CardDescription>Enter your details to start your innings</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {!isFirebaseConfigured ? (
          <FirebaseConfigWarning />
        ) : (
          <>
            <Button variant="outline" className="w-full" onClick={onGoogleSignUp} disabled={isAuthDisabled}>
                {isGoogleLoading ? ( <><Loader2 className="animate-spin mr-2" /> Signing Up...</> ) : ( <><GoogleIcon className="mr-3 h-5 w-5" /> Continue with Google</> )}
            </Button>
            <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">Or continue with</span></div>
            </div>
            
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onEmailSignUp)} className="space-y-4">
                    <FormField
                        control={form.control} name="name"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Name</FormLabel>
                                <FormControl><Input placeholder="Sachin Tendulkar" {...field} disabled={isAuthDisabled} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control} name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl><Input type="email" placeholder="sachin@tendulkar.com" {...field} disabled={isAuthDisabled} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control} name="phone"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl><Input type="tel" placeholder="9876543210" {...field} disabled={isAuthDisabled} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control} name="password"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Password</FormLabel>
                                <div className="relative">
                                    <FormControl>
                                        <Input type={showPassword ? 'text' : 'password'} placeholder="••••••••" {...field} disabled={isAuthDisabled} />
                                    </FormControl>
                                    <Button type="button" variant="ghost" size="icon" className="absolute top-0 right-0 h-full px-3" onClick={() => setShowPassword(prev => !prev)} aria-label="Toggle password visibility">
                                        {showPassword ? <EyeOff /> : <Eye />}
                                    </Button>
                                </div>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control} name="referralCode"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Referral Code (Optional)</FormLabel>
                                <FormControl><Input placeholder="FRIEND123" {...field} disabled={isAuthDisabled} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="terms"
                        render={({ field }) => (
                            <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        disabled={isAuthDisabled}
                                    />
                                </FormControl>
                                <div className="space-y-1 leading-none">
                                    <FormLabel className="text-sm font-normal text-muted-foreground">
                                        I agree to the{' '}
                                        <Link href="/policies" className="underline text-primary hover:text-primary/80">
                                            Terms & Conditions
                                        </Link>
                                    </FormLabel>
                                    <FormMessage />
                                </div>
                            </FormItem>
                        )}
                    />

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
            <Link href={`/auth/login${from ? `?from=${encodeURIComponent(from)}` : ''}`} className="font-semibold text-primary hover:underline">
                Sign in here
            </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
