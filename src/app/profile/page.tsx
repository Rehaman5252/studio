
'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { 
    LogOut, Edit, Award, UserPlus, Banknote, Users, Trophy, Star, Gift, 
    Settings, LifeBuoy, Moon, Bell, Music, Vibrate, RefreshCw
} from 'lucide-react';

const maskEmail = (email: string) => {
    if (!email || !email.includes('@')) return '';
    const [user, domain] = email.split('@');
    if (user.length <= 2) return email;
    return `${user.substring(0, 2)}•••@${domain}`;
};

const maskPhone = (phone: string) => {
    if (!phone || phone.length <= 4) return phone;
    return `+91 ••••${phone.substring(phone.length - 4)}`;
};

const maskUpi = (upi: string) => {
    if (!upi || !upi.includes('@')) return upi;
    const [user, domain] = upi.split('@');
    return `${user.substring(0, 3)}••••@${domain}`;
}

const StatItem = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
    <div className="flex flex-col items-center gap-1 text-center p-2 rounded-lg bg-background/50">
        <Icon className="h-7 w-7 text-primary" />
        <p className="font-bold text-xl">{value}</p>
        <p className="text-xs text-muted-foreground">{title}</p>
    </div>
)

export default function ProfilePage() {
    const router = useRouter();
    const { toast } = useToast();

    // Mock user data based on the spec
    const user = {
        name: 'John Doe',
        email: 'johndoe@example.com',
        phone: '9876543210',
        age: 22,
        gender: 'Male',
        occupation: 'Student',
        totalRewards: '₹600',
        highestStreak: 5,
        referralEarnings: '₹30',
        certificatesEarned: 6,
        quizzesPlayed: 27,
        upi: 'john.doe@okaxis',
        referralCode: 'indcric.com/ref/john123',
    };
    
    const handleLogout = () => {
        // Clear quiz history from local storage
        localStorage.removeItem('indcric-quiz-history');
        // Redirect to login page
        router.replace('/auth/login');
    };

    const handleReferAndEarn = () => {
        toast({
            title: "Coming Soon!",
            description: "The referral program is not yet active. Check back later!",
        });
    };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-primary/80 via-green-800 to-green-900/80">
      <header className="p-4 bg-background/80 backdrop-blur-lg sticky top-0 z-10 border-b flex items-center justify-between">
        <h1 className="text-2xl font-bold text-center text-foreground">My Profile</h1>
        <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut />
        </Button>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        {/* User Info Section */}
        <Card className="bg-background/80 backdrop-blur-sm shadow-lg">
            <CardContent className="p-4 flex items-center gap-4 relative">
                <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
                    <AvatarImage src="https://placehold.co/100x100.png" alt="User Avatar" data-ai-hint="avatar person" />
                    <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                    <h2 className="text-2xl font-bold text-foreground">{user.name}</h2>
                    <p className="text-muted-foreground text-sm">
                        {maskPhone(user.phone)}
                    </p>
                    <p className="text-muted-foreground text-sm">
                        {user.age} yrs | {user.gender} | {user.occupation}
                    </p>
                </div>
                 <Button variant="outline" size="icon" className="absolute top-4 right-4 rounded-full h-8 w-8">
                    <Edit className="h-4 w-4" />
                 </Button>
            </CardContent>
        </Card>

        {/* Stats Section */}
        <Card className="bg-background/80 backdrop-blur-sm shadow-lg">
             <CardContent className="p-4 grid grid-cols-3 gap-4">
                <StatItem title="Quizzes Played" value={user.quizzesPlayed} icon={Trophy} />
                <StatItem title="Highest Streak" value={user.highestStreak} icon={Star} />
                <StatItem title="Total Earnings" value={user.totalRewards} icon={Banknote} />
            </CardContent>
        </Card>

        {/* Rewards & Certificates Section */}
        <Card className="bg-background/80 backdrop-blur-sm shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg">Rewards & Certificates</CardTitle>
            </CardHeader>
             <CardContent className="grid grid-cols-2 gap-4">
                 <div className="flex items-center gap-3 p-3 rounded-lg bg-background/50">
                    <Award className="h-8 w-8 text-primary"/>
                    <div>
                        <p className="font-bold text-xl">{user.certificatesEarned}</p>
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
        
        {/* Referral Section */}
        <Card className="bg-background/80 backdrop-blur-sm shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg">Referrals</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                        <Users className="h-8 w-8 text-primary"/>
                        <div>
                            <p className="font-bold text-xl">{user.referralEarnings}</p>
                            <p className="text-sm text-muted-foreground">From Referrals</p>
                        </div>
                    </div>
                    <Button variant="outline" size="sm">Copy Link</Button>
                </div>
                <p className="text-xs text-muted-foreground bg-muted p-2 rounded-md">{user.referralCode}</p>
            </CardContent>
        </Card>

        {/* Payout Info Section */}
        <Card className="bg-background/80 backdrop-blur-sm shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg">Payout Info</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-foreground">UPI: {maskUpi(user.upi)}</p>
                <p className="text-xs text-muted-foreground mt-1">Payout details are locked and cannot be changed.</p>
            </CardContent>
        </Card>
        
        {/* Settings Section */}
        <Card className="bg-background/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg">Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="flex items-center gap-2">
                <Moon className="h-5 w-5" />
                <span>Dark Mode</span>
              </Label>
              <Switch id="dark-mode" />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications" className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <span>Quiz Reminders</span>
              </Label>
              <Switch id="notifications" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sound" className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                <span>In-App Sounds</span>
              </Label>
              <Switch id="sound" defaultChecked />
            </div>
             <div className="flex items-center justify-between">
              <Label htmlFor="vibration" className="flex items-center gap-2">
                <Vibrate className="h-5 w-5" />
                <span>Vibration Feedback</span>
              </Label>
              <Switch id="vibration" defaultChecked />
            </div>
             <div className="flex items-center justify-between">
              <Label htmlFor="hint-ad" className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                <span>Auto-play Hint Ad</span>
              </Label>
              <Switch id="hint-ad" defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* Actions Section */}
        <section className="space-y-3 pt-4">
            <Button asChild size="lg" className="w-full justify-start text-base py-6" variant="secondary">
                <Link href="/certificates">
                  <Award className="mr-4" /> View Certificates
                </Link>
            </Button>
            <Button size="lg" className="w-full justify-start text-base py-6" variant="secondary" onClick={handleReferAndEarn}>
                <UserPlus className="mr-4" /> Refer & Earn
            </Button>
        </section>
        
        {/* Support Section */}
        <Card className="bg-background/80 backdrop-blur-sm shadow-lg">
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
      </main>
    </div>
  );
}
