'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, updateDoc, type DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Gift, Award, Settings, LogOut, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ProfileHeader from './ProfileHeader';
import ProfileCompletion from './ProfileCompletion';
import StatsSummary from './StatsSummary';
import ReferralCard from './ReferralCard';
import SupportCard from './SupportCard';
import ProfileSkeleton from './ProfileSkeleton';

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

const MANDATORY_PROFILE_FIELDS = [
    'name', 'email', 'phone', 'dob', 'gender', 'occupation', 'upi', 
    'favoriteFormat', 'favoriteTeam', 'favoriteCricketer'
];

const defaultFormValues = {
  name: '', email: '', phone: '', dob: '', gender: '', 
  occupation: '', upi: '', favoriteFormat: '', 
  favoriteTeam: '', favoriteCricketer: '',
};

const occupations = ['Student', 'Employee', 'Business', 'Others'];
const cricketFormats = ['T20', 'ODI', 'Test', 'IPL', 'WPL', 'Mixed'];
const cricketTeams = [
    'India', 'Australia', 'England', 'South Africa', 'New Zealand', 'Pakistan', 'Sri Lanka', 'West Indies',
    'Chennai Super Kings', 'Mumbai Indians', 'Kolkata Knight Riders', 'Royal Challengers Bengaluru', 
    'Sunrisers Hyderabad', 'Punjab Kings', 'Delhi Capitals', 'Rajasthan Royals', 'Lucknow Super Giants', 'Gujarat Titans'
];


export default function ProfileContent({ userProfile, isLoading }: { userProfile: any, isLoading: boolean }) {
    const { toast } = useToast();
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: defaultFormValues as any,
    });

    useEffect(() => {
        if (userProfile && open) {
            const defaults = { ...defaultFormValues };
            for (const field of MANDATORY_PROFILE_FIELDS) {
                if (userProfile[field]) {
                    (defaults as any)[field] = userProfile[field];
                }
            }
            form.reset(defaults);
        }
    }, [userProfile, form, open]);

    const onSubmit = async (data: ProfileFormValues) => {
        if (!userProfile?.uid) return;
        setIsSubmitting(true);
        try {
            const userDocRef = doc(db, 'users', userProfile.uid);
            
            const updatePayload: DocumentData = { ...data };
            if (data.email !== userProfile.email) updatePayload.emailVerified = false;
            if (data.phone !== userProfile.phone) updatePayload.phoneVerified = false;

            await updateDoc(userDocRef, updatePayload);
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

    const handleLogout = () => {
        toast({ title: "Logout Disabled", description: "This is a mock account and cannot be logged out." });
        router.push('/auth/login');
    };
    
    if (isLoading) {
        return <ProfileSkeleton />;
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
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
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                        Your profile must be 100% complete. Verified fields are locked in a real app.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-6">
                        {MANDATORY_PROFILE_FIELDS.map((fieldName) => {
                            const isEmail = fieldName === 'email';
                            const isPhone = fieldName === 'phone';
                            
                            const isLocked = false; 

                            if (['gender', 'occupation', 'favoriteFormat', 'favoriteTeam'].includes(fieldName)) {
                                 const options = fieldName === 'gender' ? ['Male', 'Female', 'Other', 'Prefer not to say']
                                               : fieldName === 'occupation' ? occupations
                                               : fieldName === 'favoriteFormat' ? cricketFormats
                                               : cricketTeams;
                                return (
                                    <FormField
                                        key={fieldName}
                                        control={form.control}
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
                                );
                            }
                            return (
                                <FormField
                                    key={fieldName}
                                    control={form.control}
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
                            <Button type="submit" disabled={isSubmitting || !form.formState.isDirty}>

                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
