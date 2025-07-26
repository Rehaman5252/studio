
'use client';

import SignupForm from '@/components/auth/SignupForm';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SignupPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace('/walkthrough'); // Always go to walkthrough after signup to ensure profile completion.
    }
  }, [user, loading, router]);
  
  // Show a loader while checking auth state or if user is found (and we are about to redirect)
  // This prevents the signup form from flashing on the screen for logged-in users.
  if (loading || user) {
     return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-4"
          >
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-muted-foreground">Finalizing your account...</p>
        </motion.div>
      </div>
    );
  }

  return <SignupForm />;
}
