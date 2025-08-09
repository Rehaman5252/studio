
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/context/AuthProvider';
import { isFirebaseConfigured, db } from '@/lib/firebase';
import FirebaseConfigWarning from './FirebaseConfigWarning';

const signUpSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phone: z.string().min(10, { message: 'Please enter a valid phone number.' }).regex(/^\d{10,15}$/, "Invalid phone number"),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  referralCode: z.string().optional(),
});

type SignUpFormValues = z.infer<typeof signUpSchema>;

export default function SignUpForm({ from }: { from: string | null }) {
  const router = useRouter();
  const { toast } = useToast();
  const { registerWithEmail } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignUpFormValues>({
    resolver: zodResolver(signUpSchema),
  });

  const onSignUp = async (data: SignUpFormValues) => {
    setIsLoading(true);
    try {
        const user = await registerWithEmail(data.name, data.email, data.phone, data.password, data.referralCode);
        if (user) {
            toast({
                title: "Account Created!",
                description: "We've sent a verification link to your email. Please verify to continue."
            });
            router.push(`/auth/verify-email?from=${from || '/home'}`);
        }
    } catch (error) {
        // Errors are already handled and toasted within the auth provider
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-2xl shadow-black/20">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
        <CardDescription>Join the ultimate cricket quiz experience!</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {!isFirebaseConfigured || !db ? (
          <FirebaseConfigWarning />
        ) : (
          <form onSubmit={handleSubmit(onSignUp)} className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" placeholder="Virat Kohli" {...register('name')} disabled={isLoading} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="cheeku@virat.com" {...register('email')} disabled={isLoading} />
              {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone Number</Label>
              <Input id="phone" type="tel" placeholder="9876543210" {...register('phone')} disabled={isLoading} />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="8+ characters" {...register('password')} disabled={isLoading} />
                <Button type="button" variant="ghost" size="icon" className="absolute top-0 right-0 h-full px-3" onClick={() => setShowPassword(p => !p)} aria-label="Toggle password visibility">{showPassword ? <EyeOff /> : <Eye />}</Button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
             <div className="space-y-1.5">
              <Label htmlFor="referralCode">Referral Code (Optional)</Label>
              <Input id="referralCode" placeholder="Enter referral code" {...register('referralCode')} disabled={isLoading} />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? ( <><Loader2 className="animate-spin mr-2" /> Creating Account...</> ) : "Sign Up"}
            </Button>
          </form>
        )}
      </CardContent>
      <CardFooter className="flex justify-center text-sm">
        <p className="text-muted-foreground">Already have an account?{' '}<Link href="/auth/login" className="font-semibold text-primary hover:underline">Sign In</Link></p>
      </CardFooter>
    </Card>
  );
}
