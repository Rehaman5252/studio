
"use client";
import { signInWithGoogle, loginWithEmail } from "@/lib/authUtils";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleGoogle = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result) {
        toast({ title: "Success", description: "Google Sign-in successful!" });
        router.push('/home');
      }
      // If result is null, it means the user cancelled, so we do nothing.
    } catch (err) {
      console.error("Google Sign-in error:", err.message);
      toast({ title: "Error", description: "Google Sign-in failed.", variant: "destructive" });
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleEmail = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await loginWithEmail(email, password);
      toast({ title: "Success", description: "Email login successful!" });
      router.push('/home');
    } catch (err) {
      console.error("Email login error:", err.message);
      toast({ title: "Error", description: "Invalid email or password.", variant: "destructive" });
    } finally {
      setIsLoading(false);
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
      <Button variant="outline" onClick={handleGoogle} disabled={isGoogleLoading || isLoading}>
        {isGoogleLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Login with Google
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
      <form onSubmit={handleEmail} className="space-y-4">
        <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@example.com" type="email" disabled={isLoading || isGoogleLoading} />
        </div>
        <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" disabled={isLoading || isGoogleLoading}/>
        </div>
        <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Login with Email
        </Button>
      </form>
    </div>
  );
}
