
'use client';

import React, { memo, useCallback, useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, updateDoc, type DocumentData } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import Link from 'next/link';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { 
    Edit, Award, UserPlus, Banknote, Users, Trophy, Star, Gift, 
    LogOut, Loader2, Copy, PercentCircle, Mail, MessageSquare, Settings,
    CheckCircle2, AlertCircle
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { sendPhoneOtp } from '@/ai/flows/send-phone-otp-flow';
import { verifyPhoneOtp } from '@/ai/flows/verify-phone-otp-flow';
import { sendOtp } from '@/ai/flows/send-otp-flow';
import { verifyOtp } from '@/ai/flows/verify-otp-flow';


const profileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email address.' }),
  phone: z.string().regex(/^\d{10}$/, { message: 'Please enter a valid 10-digit phone number.'}),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, { message: 'Please use YYYY-MM-DD format.' }).refine(
    (dob) => new Date(dob) < new Date(), { message: "Date of birth must be in the past."}
  ),
  gender: z.enum(['Male', 'Female', 'Other', 'Prefer not to say'], { required_error: 'Please select a gender.'}),
  occupation: z.enum(['Student', 'Employee', 'Business', 'Others'], { required_error: 'Please select an occupation.'}),
  upi: z.string().regex(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/, { message: "Please enter a valid UPI ID."}),
  favoriteFormat: z.enum(['T20', 'ODI', 'Test', 'IPL', 'WPL', 'Mixed'], { required_error: 'Please select a format.'}),
  favoriteTeam: z.string().min(1, 'Please select a team.'),
  favoriteCricketer: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
});
type ProfileFormValues = z.infer<typeof profileSchema>;

const otpSchema = z.object({
  otp: z.string().length(6, { message: 'OTP must be 6 characters.' }),
});
type OtpFormValues = z.infer<typeof otpSchema>;

const occupations = ['Student', 'Employee', 'Business', 'Others'];
const cricketFormats = ['T20', 'ODI', 'Test', 'IPL', 'WPL', 'Mixed'];
const cricketTeams = [
    'India', 'Australia', 'England', 'South Africa', 'New Zealand', 'Pakistan', 'Sri Lanka', 'West Indies',
    'Chennai Super Kings', 'Mumbai Indians', 'Kolkata Knight Riders', 'Royal Challengers Bengaluru', 
    'Sunrisers Hyderabad', 'Punjab Kings', 'Delhi Capitals', 'Rajasthan Royals', 'Lucknow Super Giants', 'Gujarat Titans'
];
const MANDATORY_PROFILE_FIELDS = [
    'name', 'email', 'phone', 'dob', 'gender', 'occupation', 'upi', 
    'favoriteFormat', 'favoriteTeam', 'favoriteCricketer'
];

// Define default values to ensure all form fields are controlled from the start.
const defaultFormValues = {
  name: '',
  email: '',
  phone: '',
  dob: '',
  gender: '',
  occupation: '',
  upi: '',
  favoriteFormat: '',
  favoriteTeam: '',
  favoriteCricketer: '',
};

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
      <Skeleton className="h-[96px] w-full" />
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
                    <div className="flex items-center gap-1.5">
                        <p className="text-muted-foreground text-sm">{maskPhone(userProfile?.phone)}</p>
                        {userProfile?.phone ? (userProfile.phoneVerified ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-yellow-500" />) : null}
                    </div>
                    <div className="flex items-center gap-1.5">
                         <p className="text-muted-foreground text-sm">{userProfile?.email || 'No email set'}</p>
                         {userProfile?.email ? (userProfile.emailVerified ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-yellow-500" />) : null}
                    </div>
                    <div className="text-muted-foreground text-xs flex items-center gap-2 flex-wrap">
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

const ProfileCompletion = memo(({ userProfile }: { userProfile: any }) => {
    const completedFields = MANDATORY_PROFILE_FIELDS.filter(field => !!userProfile?.[field]);
    const completionPercentage = Math.round((completedFields.length / MANDATORY_PROFILE_FIELDS.length) * 100);

    if (completionPercentage === 100) {
        return null;
    }

    return (
        <Card className="bg-card shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <PercentCircle /> Profile Completion
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
                <Progress value={completionPercentage} className="h-3" />
                <p className="text-sm text-center text-muted-foreground">
                    {completionPercentage}% complete ({completedFields.length}/{MANDATORY_PROFILE_FIELDS.length} fields)
                </p>
            </CardContent>
        </Card>
    );
});
ProfileCompletion.displayName = "ProfileCompletion";

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

const SupportCard = memo(() => (
    <Card className="bg-card shadow-lg">
        <CardHeader>
            <CardTitle className="text-lg">Help & Support</CardTitle>
            <CardDescription>Connect to reach the Third Umpire.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
            <Button asChild size="lg" className="w-full justify-start text-base py-6" variant="secondary">
                <a href="mailto:support@indcric.com">
                    <Mail className="mr-4" />
                    Email: support@indcric.com
                </a>
            </Button>
            <Button asChild size="lg" className="w-full justify-start text-base py-6" variant="secondary">
                <a href="https://wa.me/917842722245" target="_blank" rel="noopener noreferrer">
                    <MessageSquare className="mr-4" />
                    WhatsApp: +91 7842722245
                </a>
            </Button>
        </CardContent>
    </Card>
));
SupportCard.displayName = "SupportCard";

export default function ProfileContent({ userProfile, isLoading }: { userProfile: any, isLoading: boolean }) {
    const { toast } = useToast();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formStep, setFormStep] = useState<'details' | 'otp_email' | 'otp_phone'>('details');
    const [detailsData, setDetailsData] = useState<ProfileFormValues | null>(null);

    const detailsForm = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: defaultFormValues as any,
    });
    
    const otpForm = useForm<OtpFormValues>({
        resolver: zodResolver(otpSchema),
    });

    useEffect(() => {
        if (userProfile && open) {
            const defaults: ProfileFormValues = {} as ProfileFormValues;
            MANDATORY_PROFILE_FIELDS.forEach(field => {
                 defaults[field as keyof ProfileFormValues] = userProfile[field] || '';
            });
            detailsForm.reset(defaults);
        }
    }, [userProfile, detailsForm, open]);

    const updateProfileData = async (data: ProfileFormValues, verifiedField?: 'email' | 'phone') => {
        if (!userProfile?.uid) return;
        setIsSubmitting(true);
        try {
            const userDocRef = doc(db, 'users', userProfile.uid);
            
            const updatePayload: DocumentData = { ...data };
            if (verifiedField === 'email') {
                updatePayload.emailVerified = true;
            } else if (verifiedField === 'phone') {
                updatePayload.phoneVerified = true;
            }

            await updateDoc(userDocRef, updatePayload);
            toast({
                title: "Profile Updated",
                description: "Your information has been saved successfully.",
            });
            setOpen(false);
            setFormStep('details');
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

    const handleDetailsSubmit = async (data: ProfileFormValues) => {
        const phoneChanged = data.phone && data.phone !== userProfile.phone;
        const emailChanged = data.email && data.email !== userProfile.email;

        setDetailsData(data);
        
        // Always prioritize phone verification if it changed
        if (phoneChanged) {
            setIsSubmitting(true);
            try {
                const result = await sendPhoneOtp({ phone: data.phone });
                if (result.success) {
                    toast({ title: 'OTP Sent (For Demo)', description: 'Please use OTP: 654321 to continue.', duration: 9000 });
                    setFormStep('otp_phone');
                } else {
                    toast({ title: 'Failed to Send OTP', description: result.message, variant: 'destructive' });
                }
            } catch (error) {
                 toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
            } finally {
                setIsSubmitting(false);
            }
        } else if (emailChanged) {
            setIsSubmitting(true);
            try {
                const result = await sendOtp({ email: data.email });
                if (result.success) {
                    toast({ title: 'OTP Sent (For Demo)', description: 'Please use OTP: 123456 to continue.', duration: 9000 });
                    setFormStep('otp_email');
                } else {
                    toast({ title: 'Failed to Send OTP', description: result.message, variant: 'destructive' });
                }
            } catch (error) {
                 toast({ title: 'Error', description: 'An unexpected error occurred while sending the OTP.', variant: 'destructive' });
            } finally {
                setIsSubmitting(false);
            }
        } else {
            // No verifiable fields changed, just save the other data
            await updateProfileData(data);
        }
    };
    
    const handlePhoneOtpSubmit = async (otpData: OtpFormValues) => {
        if (!detailsData) return;
        setIsSubmitting(true);
        try {
            const result = await verifyPhoneOtp({ phone: detailsData.phone, otp: otpData.otp });
            if (result.success) {
                toast({ title: 'Phone Verified', description: result.message });
                // If email also needs verification and hasn't been verified, move to that step
                const emailChanged = detailsData.email && detailsData.email !== userProfile.email;
                if(emailChanged) {
                     const emailResult = await sendOtp({ email: detailsData.email });
                     if (emailResult.success) {
                        toast({ title: 'OTP Sent (For Demo)', description: 'Please use OTP: 123456 to continue.', duration: 9000 });
                        setFormStep('otp_email');
                        otpForm.reset();
                     } else {
                        // Phone verified, but email failed. Save what we have.
                        await updateProfileData(detailsData, 'phone');
                     }
                } else {
                   await updateProfileData(detailsData, 'phone');
                }
            } else {
                toast({ title: 'Verification Failed', description: result.message, variant: 'destructive' });
            }
        } catch (error) {
             toast({ title: 'Error', description: 'An unexpected error occurred.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEmailOtpSubmit = async (otpData: OtpFormValues) => {
        if (!detailsData) return;
        setIsSubmitting(true);
        try {
            const result = await verifyOtp({ email: detailsData.email, otp: otpData.otp });
            if (result.success) {
                toast({ title: 'Email Verified', description: result.message });
                await updateProfileData(detailsData, 'email');
            } else {
                toast({ title: 'Verification Failed', description: result.message, variant: 'destructive' });
            }
        } catch (error) {
            toast({ title: 'Error', description: 'An unexpected error occurred during verification.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = async () => {
        if (!auth) {
            toast({ title: "Firebase Not Configured", description: "Could not connect to authentication service.", variant: "destructive" });
            return;
        }
        try {
            await signOut(auth);
            toast({ title: "Logged Out", description: "You have been successfully logged out." });
            router.push('/auth/login');
        } catch (error: any) {
            toast({ title: "Logout Failed", description: error.message, variant: "destructive" });
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
        <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) { otpForm.reset(); setFormStep('details'); } setOpen(isOpen); }}>
            <div className="space-y-6 animate-fade-in-up">
                <ProfileHeader userProfile={userProfile} />
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

            <DialogContent className="sm:max-w-[425px]">
                {formStep === 'details' && (
                <>
                    <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                        <DialogDescription>
                            Your profile must be 100% complete. Verified fields are locked.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...detailsForm}>
                        <form onSubmit={detailsForm.handleSubmit(handleDetailsSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-6">
                            {MANDATORY_PROFILE_FIELDS.map((fieldName) => {
                                const isEmail = fieldName === 'email';
                                const isPhone = fieldName === 'phone';
                                
                                const isVerified = (isEmail && userProfile?.emailVerified) || (isPhone && userProfile?.phoneVerified);
                                const isNonContactFieldWithValue = !!userProfile?.[fieldName] && !isEmail && !isPhone;
                                
                                const isLocked = isVerified || isNonContactFieldWithValue;

                                if (['gender', 'occupation', 'favoriteFormat', 'favoriteTeam'].includes(fieldName)) {
                                     const options = fieldName === 'gender' ? ['Male', 'Female', 'Other', 'Prefer not to say']
                                                   : fieldName === 'occupation' ? occupations
                                                   : fieldName === 'favoriteFormat' ? cricketFormats
                                                   : cricketTeams;
                                    return (
                                        <FormField
                                            key={fieldName}
                                            control={detailsForm.control}
                                            name={fieldName as keyof ProfileFormValues}
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1')}</FormLabel>
                                                    <Select onValueChange={field.onChange} value={field.value} disabled={isLocked || isSubmitting}>
                                                        <FormControl>
                                                            <SelectTrigger><SelectValue placeholder={`Select your ${fieldName.toLowerCase()}`} /></SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            {options.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    )
                                }
                                return (
                                    <FormField
                                        key={fieldName}
                                        control={detailsForm.control}
                                        name={fieldName as keyof ProfileFormValues}
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{fieldName.charAt(0).toUpperCase() + fieldName.slice(1).replace(/([A-Z])/g, ' $1')}</FormLabel>
                                                <FormControl><Input type={fieldName === 'dob' ? 'date' : (isPhone ? 'tel' : isEmail ? 'email' : 'text')} placeholder={`Your ${fieldName}`} {...field} disabled={isLocked || isSubmitting} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                );
                            })}
                            <DialogFooter className="sticky bottom-0 bg-background pt-4">
                                <DialogClose asChild><Button type="button" variant="secondary" disabled={isSubmitting}>Cancel</Button></DialogClose>
                                <Button type="submit" disabled={isSubmitting || !detailsForm.formState.isDirty}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Save
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </>
                )}
                {formStep === 'otp_phone' && (
                <>
                    <DialogHeader>
                        <DialogTitle>Verify Phone Number</DialogTitle>
                        <DialogDescription>
                            We've sent a 6-digit code to {detailsData?.phone}. Please enter it below.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...otpForm}>
                         <form onSubmit={otpForm.handleSubmit(handlePhoneOtpSubmit)} className="space-y-4">
                            <FormField
                                control={otpForm.control}
                                name="otp"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>One-Time Password</FormLabel>
                                        <FormControl><Input placeholder="123456" {...field} disabled={isSubmitting} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => setFormStep('details')} disabled={isSubmitting}>Back</Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Verify & Save
                                </Button>
                            </DialogFooter>
                         </form>
                    </Form>
                </>
                )}
                 {formStep === 'otp_email' && (
                <>
                    <DialogHeader>
                        <DialogTitle>Verify Email Address</DialogTitle>
                        <DialogDescription>
                            We've sent a 6-digit code to {detailsData?.email}. Please enter it below.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...otpForm}>
                         <form onSubmit={otpForm.handleSubmit(handleEmailOtpSubmit)} className="space-y-4">
                            <FormField
                                control={otpForm.control}
                                name="otp"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>One-Time Password</FormLabel>
                                        <FormControl><Input placeholder="123456" {...field} disabled={isSubmitting} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <DialogFooter>
                                <Button type="button" variant="ghost" onClick={() => setFormStep('details')} disabled={isSubmitting}>Back</Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Verify & Save
                                </Button>
                            </DialogFooter>
                         </form>
                    </Form>
                </>
                )}
            </DialogContent>
        </Dialog>
    )
}

    
