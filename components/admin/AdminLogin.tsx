
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Eye, EyeOff, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function AdminLogin() {
  const [email, setEmail] = useState('admin@cricblitz.app');
  const [password, setPassword] = useState('CricBlitz@Admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setIsLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({
        title: 'Authentication Successful',
        description: 'Welcome, Admin. Redirecting to dashboard...',
      });
      router.push('/admin/dashboard');
    } catch (error: any) {
       toast({
        title: 'Authentication Failed',
        description: 'Invalid credentials. Please try again.',
        variant: 'destructive',
      });
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <Card className="shadow-2xl bg-card/80 backdrop-blur-lg border-primary/20 animate-fade-in-up">
        <CardHeader className="text-center">
            <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-4">
                <Shield className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Third Umpire's Room</CardTitle>
            <CardDescription>Access restricted to authorized CricBlitz match officials.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
            <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="email">Official Email</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="umpire@cricblitz.app" 
                      required 
                      className="h-12"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={isLoading}
                    />
                </div>
                <div className="space-y-2 relative">
                    <Label htmlFor="password">Access Code</Label>
                    <Input 
                      id="password" 
                      type={showPassword ? 'text' : 'password'}
                      placeholder='••••••••'
                      required 
                      className="h-12 pr-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={isLoading}
                    />
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-7 h-8 w-8 text-muted-foreground hover:text-foreground"
                        onClick={togglePasswordVisibility}
                        disabled={isLoading}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </Button>
                </div>
                <Button type="submit" className="w-full h-12 text-base font-bold" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    {isLoading ? 'Checking Credentials...' : 'Proceed to Review'}
                </Button>
                <div className="text-center">
                    <Button variant="link" asChild className="text-xs text-muted-foreground">
                        <Link href="/">
                            Return to the Pitch
                        </Link>
                    </Button>
                </div>
            </form>
        </CardContent>
    </Card>
  );
}
