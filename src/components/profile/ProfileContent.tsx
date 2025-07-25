
'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Gift, Award, LogOut, Edit, Settings, Scale } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ProfileHeader from './ProfileHeader';
import ProfileCompletion from './ProfileCompletion';
import StatsSummary from './StatsSummary';
import ReferralCard from './ReferralCard';
import { useAuth } from '@/context/AuthProvider';
import SupportCard from './SupportCard';
import DailyStreakCard from './DailyStreakCard';

export default function ProfileContent({ userProfile }: { userProfile: any }) {
    const router = useRouter();
    const { logout } = useAuth();

    const handleLogout = async () => {
        await logout();
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
            
            <DailyStreakCard userProfile={userProfile} />
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
                <Button asChild size="lg" className="w-full justify-start text-base py-6" variant="secondary">
                    <Link href="/settings"><Settings className="mr-4" /> App Settings</Link>
                </Button>
                <Button asChild size="lg" className="w-full justify-start text-base py-6" variant="secondary">
                    <Link href="/policies"><Scale className="mr-4" /> Legal & Policies</Link>
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
