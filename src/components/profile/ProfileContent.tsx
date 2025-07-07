
'use client';

import React, { memo, useCallback, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
    Edit, Award, UserPlus, Banknote, Users, Trophy, Star, Gift, 
    LogOut, Loader2, Copy
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const profileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  phone: z.string().regex(/^\d{10}$/, { message: 'Please enter a valid 10-digit phone number.'}),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Please use YYYY-MM-DD format.' }).refine(
    (dob) => new Date(dob) < new Date(), { message: "Date of birth must be in the past."}
  ).optional().or(z.literal('')),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say', '']),
  occupation: z.string().optional(),
  upi: z.string().optional(),
});
type ProfileFormValues = z.infer<typeof profileSchema>;


const maskPhone = (phone?: string) => {
    if (!phone || phone.length < 10) return 'Not set';
    const lastFour = phone.slice(-4);
    return `+91 •••• ••${lastFour.substring(0,2)} ${lastFour.substring(2,4)}`;
};

const maskUpi = (upi?: string) => {
    if (!upi || !upi.includes('@')) return 'Not set';
    const [user, domain] = upi.split('@');
    if (user.length <= 3) return `${user}••••@${domain}`;
    return `${user.substring(0, 3)}••••@${domain}`;
}

const calculateAge = (dobString?: string): number | null => {
    if (!dobString || !/^\d{4}-\d{2}-\d{2}$/.test(dobString)) return null;
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};

const StatItem = memo(({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
    <div className="flex flex-col items-center gap-1 text-center p-2 rounded-lg bg-background/50">
        <Icon className="h-7 w-7 text-primary" />
        <p className="font-bold text-xl">{value}</p>
        <p className="text-xs text-muted-foreground">{title}</p>
    </div>
));
StatItem.displayName = 'StatItem';


const ProfileSkeleton = () => (
    <div className="space-y-6">
      <Card className="bg-card shadow-lg">
          <CardContent className="p-4 flex items-center gap-4">
              <Skeleton className="w-20 h-20 rounded-full" />
              <div className="flex-1 space-y-2">
                  <Skeleton className="h-7 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
              </div>
          </CardContent>
      </Card>
      <Card className="bg-card shadow-lg">
          <CardContent className="p-4 grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center gap-1 text-center p-2 rounded-lg">
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <Skeleton className="h-7 w-8 mt-1" />
                  <Skeleton className="h-3 w-16 mt-1" />
              </div>
              <div className="flex flex-col items-center gap-1 text-center p-2 rounded-lg">
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <Skeleton className="h-7 w-8 mt-1" />
                  <Skeleton className="h-3 w-16 mt-1" />
              </div>
              <div className="flex flex-col items-center gap-1 text-center p-2 rounded-lg">
                  <Skeleton className="h-7 w-7 rounded-full" />
                  <Skeleton className="h-7 w-8 mt-1" />
                  <Skeleton className="h-3 w-16 mt-1" />
              </div>
          </CardContent>
      </Card>
      <Skeleton className="h-[92px] w-full" />
      <Skeleton className="h-[92px] w-full" />
    </div>
);


const ProfileHeader = memo(({ userProfile }: { userProfile: any }) => {
    const age = calculateAge(userProfile?.dob);
    return (
        <Card className="bg-card shadow-lg">
            <CardContent className="p-4 flex items-center gap-4 relative">
                <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
                    <AvatarImage src={userProfile?.photoURL || `https://placehold.co/100x100.png`} alt="User Avatar" data-ai-hint="avatar person" />
                    <AvatarFallback>{userProfile?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                    <h2 className="text-2xl font-bold text-foreground">{userProfile?.name || 'New User'}</h2>
                    <p className="text-muted-foreground text-sm">
                        {maskPhone(userProfile?.phone)}
                    </p>
                    <div className="text-muted-foreground text-sm flex items-center gap-2 flex-wrap">
                        {age && <span>{age} yrs</span>}
                        {userProfile?.gender && <span>&middot; {userProfile.gender}</span>}
                        {userProfile?.occupation && <span>&middot; {userProfile.occupation}</span>}
                    </div>
                </div>
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="absolute top-4 right-4 rounded-full h-8 w-8" aria-label="Edit Profile">
                        <Edit className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
            </CardContent>
        </Card>
    );
});
ProfileHeader.displayName = 'ProfileHeader';

const StatsSummary = memo(({ userProfile }: { userProfile: any }) => (
    <Card className="bg-card shadow-lg">
        <CardContent className="p-4 grid grid-cols-3 gap-4">
            <StatItem title="Quizzes Played" value={userProfile?.quizzesPlayed || 0} icon={Trophy} />
            <StatItem title="Perfect Scores" value={userProfile?.perfectScores || 0} icon={Star} />
            <StatItem title="Total Earnings" value={`₹${userProfile?.totalRewards || 0}`} icon={Banknote} />
        </CardContent>
    </Card>
));
StatsSummary.displayName = 'StatsSummary';


const PayoutInfo = memo(({ userProfile }: { userProfile: any }) => (
    <Card className="bg-card shadow-lg">
        <CardHeader>
            <CardTitle className="text-lg">Payout Info</CardTitle>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-foreground">UPI: {maskUpi(userProfile?.upi)}</p>
            <p className="text-xs text-muted-foreground mt-1">Payout details are locked after first entry.</p>
        </CardContent>
    </Card>
));
PayoutInfo.displayName = 'PayoutInfo';

const ReferralCard = memo(({ userProfile }: { userProfile: any }) => {
    const { toast } = useToast();
    const handleCopy = () => {
        const referralLink = userProfile?.referralCode || '';
        navigator.clipboard.writeText(referralLink);
        toast({
            title: "Copied to Clipboard!",
            description: "Your referral link has been copied.",
        });
    };

    return (
     <Card className="bg-card shadow-lg">
        <CardHeader>
            <CardTitle className="text-lg">Refer & Earn</CardTitle>
        </CardHeader>
        <CardContent>
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                    <Users className="h-8 w-8 text-primary"/>
                    <div>
                        <p className="font-bold text-xl">₹{userProfile?.referralEarnings || 0}</p>
                        <p className="text-sm text-muted-foreground">From Referrals</p>
                    </div>
                </div>
                <Button variant="secondary" size="sm" onClick={handleCopy}>
                    <Copy className="mr-2" />
                    Copy Link
                </Button>
            </div>
            <p className="text-xs text-muted-foreground bg-muted p-2 rounded-md">{userProfile?.referralCode || 'No code available'}</p>
        </CardContent>
    </Card>
    );
});
ReferralCard.displayName = 'ReferralCard';

const ActionButtons = memo(() => {
    const router = useRouter();
    const { toast } = useToast();

    const handleLogout = async () => {
        if (!auth) {
            toast({
                title: "Firebase Not Configured",
                description: "Could not connect to authentication service.",
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
        <section className="space-y-3 pt-4">
            <Button asChild size="lg" className="w-full justify-start text-base py-6" variant="secondary">
                <Link href="/rewards"><Gift className="mr-4" /> My Rewards</Link>
            </Button>
            <Button asChild size="lg" className="w-full justify-start text-base py-6" variant="secondary">
                <Link href="/certificates"><Award className="mr-4" /> View Certificates</Link>
            </Button>
            <Button variant="destructive" size="lg" className="w-full" onClick={handleLogout}>
                <LogOut className="mr-2 h-5 w-5" /> Logout
            </Button>
        </section>
    );
});
ActionButtons.displayName = 'ActionButtons';


export default function ProfileContent({ userProfile, isLoading }: { userProfile: any, isLoading: boolean }) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [open, setOpen] = useState(false);
    
    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: '',
            phone: '',
            dob: '',
            gender: '',
            occupation: '',
            upi: '',
        },
    });

    useEffect(() => {
        if (userProfile) {
            form.reset({
                name: userProfile.name || '',
                phone: userProfile.phone || '',
                dob: userProfile.dob || '',
                gender: userProfile.gender || '',
                occupation: userProfile.occupation || '',
                upi: userProfile.upi || '',
            });
        }
    }, [userProfile, form]);

    const onSubmit = async (data: ProfileFormValues) => {
        if (!userProfile?.uid) return;
        setIsSubmitting(true);
        try {
            const userDocRef = doc(db, 'users', userProfile.uid);
            
            // Create a mutable copy to potentially remove the UPI field
            const dataToUpdate: Partial<ProfileFormValues> = { ...data };

            // Prevent updating UPI if it already exists and is not empty.
            if (userProfile.upi && userProfile.upi.trim() !== '') {
                delete dataToUpdate.upi;
            }
            
            await updateDoc(userDocRef, dataToUpdate);
            toast({
                title: "Profile Updated",
                description: "Your information has been saved successfully.",
            });
            setOpen(false);
        } catch (error: any) {
            console.error("Profile update failed:", error);
            toast({
                title: "Update Failed",
                description: "Could not save your profile. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    if (isLoading) {
        return <ProfileSkeleton />;
    }

    if (!userProfile) {
        return (
            <Card>
                <CardContent className="p-8 text-center text-muted-foreground">
                    Could not load user profile. Please try again later.
                </CardContent>
            </Card>
        );
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <div className="space-y-6 animate-fade-in-up">
                <ProfileHeader userProfile={userProfile} />
                <StatsSummary userProfile={userProfile} />
                <PayoutInfo userProfile={userProfile} />
                <ReferralCard userProfile={userProfile} />
                <ActionButtons />
            </div>

            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Name</FormLabel>
                                    <FormControl><Input placeholder="Your Name" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone</FormLabel>
                                    <FormControl><Input type="tel" placeholder="10-digit number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="dob"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Date of Birth</FormLabel>
                                    <FormControl><Input type="date" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="gender"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Gender</FormLabel>
                                     <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger><SelectValue placeholder="Select a gender" /></SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Male">Male</SelectItem>
                                            <SelectItem value="Female">Female</SelectItem>
                                            <SelectItem value="Other">Other</SelectItem>
                                            <SelectItem value="Prefer not to say">Prefer not to say</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="occupation"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Occupation</FormLabel>
                                    <FormControl><Input placeholder="e.g., Student, Engineer" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="upi"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>UPI ID</FormLabel>
                                    <FormControl>
                                        <Input 
                                            placeholder="your-id@bank" 
                                            {...field} 
                                            disabled={!!userProfile?.upi || isSubmitting} 
                                        />
                                    </FormControl>
                                    {!!userProfile?.upi && <p className="text-xs text-muted-foreground">UPI ID cannot be changed once set.</p>}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary" disabled={isSubmitting}>Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save changes
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}
