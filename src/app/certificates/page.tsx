
import React from 'react';
import CertificatesContent from '@/components/certificates/CertificatesContent';
import { getAuthenticatedUser } from '@/lib/auth/getAuthenticatedUser';
import { getFirebaseFirestore } from '@/lib/firebaseClient';
import { collection, query, orderBy, getDocs } from 'firebase/firestore';
import type { QuizAttempt } from '@/lib/mockData';
import LoginPrompt from '@/components/auth/LoginPrompt';
import { Award } from 'lucide-react';

async function getCertificateData(uid: string) {
    try {
        const db = getFirebaseFirestore();
        if (!db) {
            throw new Error("Firestore is not available on the server.");
        }
        const q = query(collection(db, "users", uid, "quizAttempts"), orderBy("timestamp", "desc"));
        const querySnapshot = await getDocs(q);
        // We need to serialize the data because Timestamps can't be passed from Server to Client Components directly.
        const historyData = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                timestamp: data.timestamp.toMillis(),
            };
        }) as QuizAttempt[];
        return historyData;
    } catch (error) {
        console.error("Failed to fetch certificate data:", error);
        return [];
    }
}

export default async function CertificatesPage() {
    const { user } = await getAuthenticatedUser();

    if (!user) {
        return (
             <div className="flex flex-col h-screen bg-background">
                <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b">
                    <h1 className="text-2xl font-bold text-center text-foreground">My Certificates</h1>
                </header>
                <main className="flex-1 flex items-center justify-center p-4 pb-20">
                    <LoginPrompt 
                        icon={Award}
                        title="Claim Your Certificates"
                        description="Log in to view and download certificates for your perfect quiz scores."
                    />
                </main>
            </div>
        )
    }

    const initialHistory = await getCertificateData(user.uid);

    return (
        <div className="flex flex-col h-screen bg-background">
        <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b">
            <h1 className="text-2xl font-bold text-center text-foreground">My Certificates</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-4 space-y-4 pb-20">
            <CertificatesContent initialHistory={initialHistory} />
        </main>
        </div>
    );
}
