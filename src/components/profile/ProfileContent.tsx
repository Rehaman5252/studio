
'use client';

import React from 'react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Gift, Award, Settings, LogOut, Edit } from 'lucide-react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';

const ProfileHeader = dynamic(() => import('./ProfileHeader'), {
    loading: () => <Skeleton className="h-[116px] w-full" />,
});
const ProfileCompletion = dynamic(() => import('./ProfileCompletion'), {
    loading: () => <Skeleton className="h-[76px] w-full" />,
});
const StatsSummary = dynamic(() => import('./StatsSummary'), {
    loading: () => <Skeleton className="h-[96px] w-full" />,
});
const ReferralCard = dynamic(() => import('./ReferralCard'), {
    loading: () => <Skeleton className="h-[124px] w-full" />,
});
const SupportCard = dynamic(() => import('./SupportCard'), {
    loading: () => <Skeleton className="h-[188px] w-full" />,
});

export default function ProfileContent({ userProfile }: { userProfile: any }) {
    const { toast } = useToast();
    const router = useRouter();

    const handleLogout = async () => {
        if (!auth) return;
        try {
            await signOut(auth);
            router.push('/auth/login');
            toast({ title: "Logged Out", description: "You have been successfully logged out." });
        } catch (error) {
            toast({ title: "Logout Failed", description: "Could not log out. Please try again.", variant: "destructive" });
        }
    };

    return (
        <div className="space-y-6 animate-fade-in-up">
            <div className="relative">
                <ProfileHeader userProfile={userProfile} />
                <Button asChild variant="outline" size="icon" className="absolute top-4 right-4 rounded-full h-8 w-8" aria-label="Edit Profile">
                    <Link href="/complete-profile">
                        <Edit className="h-4 w-4" />
                    </Link>
                </Button>
            </div>
            <ProfileCompletion userProfile={userProfile} />
            <StatsSummary userProfile={userProfile} />
            <ReferralCard userProfile={userProfile} />

            <section className="space-y-3 pt-4">
                <Button asChild size="lg" className="w-full justify-start text-base py-6" variant="secondary">
                    <Link href="/rewards"><Gift className="mr-4" /> My Rewards</Link>
                </Button>
                <Button asChild size="lg" className="w-full justify-start text-base py-6" variant="secondary">
                    <Link href="/certificates"><Award className="mr-4" /> View Certificates</Link>
                </Button>
                <Button asChild size="lg" className="w-full justify-start text-base py-6" variant="secondary">
                    <Link href="/settings"><Settings className="mr-4" /> App Settings</Link>
                </Button>
            </section>

            <SupportCard />

            <section>
                <Button variant="destructive" size="lg" className="w-full" onClick={handleLogout}>
                    <LogOut className="mr-2 h-5 w-5" /> Logout
                </Button>
            </section>
        </div>
    );
}
