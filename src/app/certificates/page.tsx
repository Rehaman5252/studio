
import { Suspense } from 'react';
import { Award } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import CertificatesContent from '@/components/certificates/CertificatesContent';
import LoginPrompt from '@/components/auth/LoginPrompt';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { getFirebaseFirestore } from '@/lib/firebaseClient';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import type { QuizAttempt } from '@/lib/mockData';

const CertificatesSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-[125px] w-full rounded-lg" />
      <Skeleton className="h-[125px] w-full rounded-lg" />
      <Skeleton className="h-[125px] w-full rounded-lg" />
    </div>
);

async function CertificatesData() {
    const { user } = await getAuthenticatedUser();
    
    if (!user) {
        return (
            <main className="flex-1 flex items-center justify-center p-4 pb-20">
                <LoginPrompt 
                    icon={Award}
                    title="Claim Your Certificates"
                    description="Log in to view and download certificates for your perfect quiz scores."
                />
            </main>
        );
    }
    
    const db = getFirebaseFirestore();
    let history: QuizAttempt[] = [];
    let error: string | null = null;
    
    try {
        const q = query(collection(db, "users", user.uid, "quizAttempts"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        history = querySnapshot.docs.map(doc => doc.data() as QuizAttempt);
    } catch (e: any) {
        console.error("Failed to fetch certificate data on server:", e);
        error = "Could not load your certificates. Please try again later.";
    }

    return (
        <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
            <CertificatesContent initialHistory={history} error={error} />
        </main>
    );
}

export default function CertificatesPage() {
  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b">
        <h1 className="text-2xl font-bold text-center text-foreground">My Certificates</h1>
      </header>
      <Suspense fallback={<main className="flex-1 p-4 pb-20"><CertificatesSkeleton /></main>}>
        <CertificatesData />
      </Suspense>
    </div>
  );
}
