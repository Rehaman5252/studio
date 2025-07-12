
"use client";
import { signInWithGoogle, registerWithEmail } from "@/lib/authUtils";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { updateProfile } from "firebase/auth";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const { toast } = useToast();

  const handleGoogle = async () => {
    try {
      await signInWithGoogle();
      toast({ title: "Success", description: "Google Sign-up successful!" });
      router.push('/home');
    } catch (err) {
      console.error("Google Sign-up error:", err.message);
      toast({ title: "Error", description: "Google Sign-up failed.", variant: "destructive" });
    }
  };

  const handleEmail = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await registerWithEmail(email, password);
      await updateProfile(userCredential.user, { displayName: name });
      toast({ title: "Success", description: "Account created successfully!" });
      router.push('/home');
    } catch (err) {
      console.error("Email signup error:", err.message);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="text-center">
        <h1 className="text-2xl font-bold">Create an Account</h1>
        <p className="text-muted-foreground">
            Already have an account? <Link href="/auth/login" className="text-primary hover:underline">Log in</Link>
        </p>
      </div>
      <Button variant="outline" onClick={handleGoogle}>Sign up with Google</Button>
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
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your Name" />
        </div>
        <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" type="email" />
        </div>
        <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <Button type="submit" className="w-full">Create Account</Button>
      </form>
    </div>
  );
}
