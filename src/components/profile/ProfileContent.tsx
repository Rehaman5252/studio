
'use client';

import React, { memo, useCallback } from 'react';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
    Edit, Award, UserPlus, Banknote, Users, Trophy, Star, Gift, 
    Settings, Moon, Bell, Music, Vibrate, RefreshCw, LogOut
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { Badge } from '@/components/ui/badge';

const maskPhone = (phone: string) => {
    if (!phone || phone.length <= 4) return phone;
    return `+91 ••••${phone.substring(phone.length - 4)}`;
};

const maskUpi = (upi: string) => {
    if (!upi || !upi.includes('@')) return upi;
    const [user, domain] = upi.split('@');
    return `${user.substring(0, 3)}••••@${domain}`;
}

const StatItem = memo(({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
    <div className="flex flex-col items-center gap-1 text-center p-2 rounded-lg bg-background/50">
        <Icon className="h-7 w-7 text-primary" />
        <p className="font-bold text-xl">{value}</p>
        <p className="text-xs text-muted-foreground">{title}</p>
    </div>
));
StatItem.displayName = 'StatItem';

const ProfileHeader = memo(({ userProfile }: { userProfile: any }) => (
    <Card className="bg-card shadow-lg">
        <CardContent className="p-4 flex items-center gap-4 relative">
            <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
                <AvatarImage src={userProfile.photoURL || `https://placehold.co/100x100.png`} alt="User Avatar" data-ai-hint="avatar person" />
                <AvatarFallback>{userProfile.name?.charAt(0) || 'U'}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-bold text-foreground">{userProfile.name}</h2>
                </div>
                <p className="text-muted-foreground text-sm">
                    {maskPhone(userProfile.phone)}
                </p>
                <p className="text-muted-foreground text-sm">
                    {userProfile.age && `${userProfile.age} yrs | `} {userProfile.gender && `${userProfile.gender} | `} {userProfile.occupation}
                </p>
            </div>
            <Button variant="outline" size="icon" className="absolute top-4 right-4 rounded-full h-8 w-8" aria-label="Edit Profile">
                <Edit className="h-4 w-4" />
            </Button>
        </CardContent>
    </Card>
));
ProfileHeader.displayName = 'ProfileHeader';

const StatsSummary = memo(({ userProfile }: { userProfile: any }) => (
    <Card className="bg-card shadow-lg">
        <CardContent className="p-4 grid grid-cols-3 gap-4">
            <StatItem title="Quizzes Played" value={userProfile.quizzesPlayed || 0} icon={Trophy} />
            <StatItem title="Highest Streak" value={userProfile.highestStreak || 0} icon={Star} />
            <StatItem title="Total Earnings" value={`₹${userProfile.totalRewards || 0}`} icon={Banknote} />
        </CardContent>
    </Card>
));
StatsSummary.displayName = 'StatsSummary';

const RewardsSummary = memo(({ userProfile }: { userProfile: any }) => (
    <Card className="bg-card shadow-lg">
        <CardHeader>
            <CardTitle className="text-lg">Rewards & Certificates</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                <Award className="h-8 w-8 text-primary"/>
                <div>
                    <p className="font-bold text-xl">{userProfile.certificatesEarned || 0}</p>
                    <p className="text-sm text-muted-foreground">Certificates</p>
                </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                <Gift className="h-8 w-8 text-primary"/>
                <div>
                    <p className="font-bold text-xl">1</p>
                    <p className="text-sm text-muted-foreground">Gift Unlocked</p>
                </div>
            </div>
        </CardContent>
    </Card>
));
RewardsSummary.displayName = 'RewardsSummary';

const ReferralCard = memo(({ userProfile }: { userProfile: any }) => (
     <Card className="bg-card shadow-lg">
        <CardHeader>
            <CardTitle className="text-lg">Referrals</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-primary"/>
                    <div>
                        <p className="font-bold text-xl">₹{userProfile.referralEarnings || 0}</p>
                        <p className="text-sm text-muted-foreground">From Referrals</p>
                    </div>
                </div>
                <Button variant="secondary" size="sm">Copy Link</Button>
            </div>
            <p className="text-xs text-muted-foreground bg-muted p-2 rounded-md">{userProfile.referralCode}</p>
        </CardContent>
    </Card>
));
ReferralCard.displayName = 'ReferralCard';

const PayoutInfo = memo(({ userProfile }: { userProfile: any }) => (
    <Card className="bg-card shadow-lg">
        <CardHeader>
            <CardTitle className="text-lg">Payout Info</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-foreground">UPI: {userProfile.upi ? maskUpi(userProfile.upi) : 'Not set'}</p>
            <p className="text-xs text-muted-foreground mt-1">Payout details are locked and cannot be changed.</p>
        </CardContent>
    </Card>
));
PayoutInfo.displayName = 'PayoutInfo';

const SettingsSummary = memo(() => (
    <Card className="bg-card shadow-lg">
        <CardHeader>
            <CardTitle className="text-lg">Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
                <Label htmlFor="dark-mode" className="flex items-center gap-2"><Moon className="h-5 w-5" /><span>Dark Mode</span></Label>
                <Switch id="dark-mode" defaultChecked disabled />
            </div>
            <div className="flex items-center justify-between">
                <Label htmlFor="notifications" className="flex items-center gap-2"><Bell className="h-5 w-5" /><span>Quiz Reminders</span></Label>
                <Switch id="notifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
                <Label htmlFor="sound" className="flex items-center gap-2"><Music className="h-5 w-5" /><span>In-App Sounds</span></Label>
                <Switch id="sound" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
                <Label htmlFor="vibration" className="flex items-center gap-2"><Vibrate className="h-5 w-5" /><span>Vibration Feedback</span></Label>
                <Switch id="vibration" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
                <Label htmlFor="hint-ad" className="flex items-center gap-2"><RefreshCw className="h-5 w-5" /><span>Auto-play Hint Ad</span></Label>
                <Switch id="hint-ad" defaultChecked />
            </div>
        </CardContent>
    </Card>
));
SettingsSummary.displayName = 'SettingsSummary';

const ActionButtons = memo(({ handleReferAndEarn }: { handleReferAndEarn: () => void }) => (
    <section className="space-y-3 pt-4">
        <div>
            <Button asChild size="lg" className="w-full justify-start text-base py-6" variant="secondary">
                <Link href="/certificates"><Award className="mr-4" /> View Certificates</Link>
            </Button>
        </div>
        <div>
            <Button size="lg" className="w-full justify-start text-base py-6" variant="secondary" onClick={handleReferAndEarn}>
                <UserPlus className="mr-4" /> Refer & Earn
            </Button>
        </div>
    </section>
));
ActionButtons.displayName = 'ActionButtons';

const SupportCard = memo(() => (
    <Card className="bg-card shadow-lg">
        <CardHeader>
            <CardTitle className="text-lg">Support</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground">
                For any issues or feedback, please email us at:
            </p>
            <p className="font-semibold text-primary">support@indcric.com</p>
        </CardContent>
    </Card>
));
SupportCard.displayName = 'SupportCard';

const LogoutButton = memo(() => {
    const { toast } = useToast();
    const router = useRouter();

    const handleLogout = async () => {
        if (!auth) {
            toast({
                title: "Firebase Not Configured",
                description: "Could not connect to authentication service. Please set up your environment variables.",
                variant: "destructive"
            });
            return;
        }

        try {
            await signOut(auth);
            toast({
                title: "Logged Out",
                description: "You have been successfully logged out.",
            });
            router.push('/auth/login');
        } catch (error: any) {
            toast({
                title: "Logout Failed",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    return (
        <div className="pt-2">
            <Button variant="destructive" size="lg" className="w-full" onClick={handleLogout}>
                <LogOut className="mr-2 h-5 w-5" /> Logout
            </Button>
        </div>
    );
});
LogoutButton.displayName = 'LogoutButton';


export default function ProfileContent({ userProfile }: { userProfile: any }) {
    const { toast } = useToast();
    
    const handleReferAndEarn = useCallback(() => {
        toast({
            title: "Coming Soon!",
            description: "The referral program is not yet active. Check back later!",
        });
    }, [toast]);
    
    if (!userProfile) {
        return null;
    }

    return (
        <div 
            className="space-y-6 animate-fade-in-up"
        >
            <div><ProfileHeader userProfile={userProfile} /></div>
            <div><StatsSummary userProfile={userProfile} /></div>
            <div><RewardsSummary userProfile={userProfile} /></div>
            <div><ReferralCard userProfile={userProfile} /></div>
            <div><PayoutInfo userProfile={userProfile} /></div>
            <div><SettingsSummary /></div>
            
            <ActionButtons handleReferAndEarn={handleReferAndEarn} />
            
            <div><SupportCard /></div>

            <LogoutButton />
        </div>
    )
}
