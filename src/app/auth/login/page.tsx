
"use client";
import { signInWithGoogle, loginWithEmail } from "@/lib/authUtils";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
      toast({ title: "Success", description: "Google Sign-in successful!" });
      router.push('/home');
    } catch (err) {
      console.error("Google Sign-in error:", err.message);
      toast({ title: "Error", description: "Google Sign-in failed.", variant: "destructive" });
    }
  };

  const handleEmail = async (e) => {
    e.preventDefault();
    try {
      await loginWithEmail(email, password);
      toast({ title: "Success", description: "Email login successful!" });
      router.push('/home');
    } catch (err) {
      console.error("Email login error:", err.message);
      toast({ title: "Error", description: "Invalid email or password.", variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Login</h1>
        <p className="text-muted-foreground">
            Don't have an account? <Link href="/auth/signup" className="text-primary hover:underline">Sign up</Link>
        </p>
      </div>
      <Button variant="outline" onClick={handleGoogle}>Login with Google</Button>
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
      <form onSubmit={handleEmail} className="space-y-4">
        <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" type="email" />
        </div>
        <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <Button type="submit" className="w-full">Login with Email</Button>
      </form>
    </div>
  );
}
