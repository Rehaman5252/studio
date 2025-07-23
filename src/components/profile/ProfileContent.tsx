
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Gift, Award, Settings, LogOut, Edit, Scale } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ProfileHeader from './ProfileHeader';
import ProfileCompletion from './ProfileCompletion';
import StatsSummary from './StatsSummary';
import ReferralCard from './ReferralCard';
import SupportCard from './SupportCard';
import { useAuth as useAuthOriginal } from '@/context/AuthProvider'; // Renamed to avoid conflict
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function ProfileContent({ userProfile }: { userProfile: any }) {
    const router = useRouter();
    const { user } = useAuthOriginal();

    const handleLogout = async () => {
        await signOut(auth);
        router.replace('/auth/login');
    };

    if (!userProfile) {
        return <p>No profile data found.</p>;
    }

    return (
        <div className="space-y-6">
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
                    <Link href="/certificates" prefetch={true}><Award className="mr-4" /> View Certificates</Link>
                </Button>
            </section>
        </div>
    );
}
