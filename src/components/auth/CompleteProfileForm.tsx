
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type DocumentData } from 'firebase/firestore';
import { Loader2, X, CheckCircle2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { PhoneVerificationDialog } from '../profile/PhoneVerificationDialog';

const profileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email(),
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

const occupations = ['Student', 'Employee', 'Business', 'Others'];
const cricketFormats = ['T20', 'ODI', 'Test', 'IPL', 'WPL', 'Mixed'];
const cricketTeams = [
    'India', 'Australia', 'England', 'South Africa', 'New Zealand', 'Pakistan', 'Sri Lanka', 'West Indies',
    'Chennai Super Kings', 'Mumbai Indians', 'Kolkata Knight Riders', 'Royal Challengers Bengaluru', 
    'Sunrisers Hyderabad', 'Punjab Kings', 'Delhi Capitals', 'Rajasthan Royals', 'Lucknow Super Giants', 'Gujarat Titans'
];


export default function CompleteProfileForm() {
    const router = useRouter();
    const { user, userData, isUserDataLoading, updateUserData } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [phoneVerifiedInForm, setPhoneVerifiedInForm] = useState(userData?.phoneVerified || false);
    
    const isProfileComplete = userData?.profileCompleted || false;

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: '',
            email: '',
            phone: '',
            dob: '',
            upi: '',
            gender: undefined,
            occupation: undefined,
            favoriteFormat: undefined,
            favoriteTeam: undefined,
            favoriteCricketer: '',
        },
    });
    
    const watchedPhone = form.watch('phone');
    const needsVerification = watchedPhone !== userData?.phone || !userData?.phoneVerified;

    useEffect(() => {
        if (userData) {
            form.reset({
                name: userData.name || '',
                email: userData.email || '',
                phone: userData.phone || '',
                dob: userData.dob || '',
                gender: userData.gender,
                occupation: userData.occupation,
                upi: userData.upi || '',
                favoriteFormat: userData.favoriteFormat,
                favoriteTeam: userData.favoriteTeam,
                favoriteCricketer: userData.favoriteCricketer || '',
            });
            setPhoneVerifiedInForm(userData.phoneVerified);
        }
    }, [userData, form]);
    
    const onSubmit = async (data: ProfileFormValues) => {
        if (!user) {
            toast({ title: "Not Authenticated", description: "You must be signed in to save your profile.", variant: "destructive" });
            return;
        }

        if (watchedPhone && needsVerification && !phoneVerifiedInForm) {
            toast({ title: "Verification Required", description: "Please verify your new phone number before saving.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);

        try {
            const { email, ...payload } = data;

            const finalPayload: DocumentData = {
                ...payload,
                profileCompleted: true,
                phoneVerified: phoneVerifiedInForm,
            };

            updateUserData(finalPayload);
    
            toast({ title: 'Profile Saved!', description: 'Your profile has been updated successfully.'});
            router.push('/profile');
    
        } catch (error: any) {
            console.error("Profile update error:", error);
            toast({ title: "Error Saving Profile", description: "Could not save your profile.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isUserDataLoading) {
        return (
            <div className="flex flex-col items-center justify-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground">Loading profile form...</p>
            </div>
        )
    }

    const isSaveDisabled = isSubmitting || (watchedPhone && needsVerification && !phoneVerifiedInForm);

    return (
        <Card className="w-full max-w-lg relative">
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-muted-foreground hover:bg-muted"
                onClick={() => router.push('/profile')}
                aria-label="Close"
            >
                <X className="h-5 w-5" />
            </Button>
            <CardHeader>
                <CardTitle>{isProfileComplete ? 'Edit Profile' : 'Complete Your Profile'}</CardTitle>
                <CardDescription>
                    {isProfileComplete 
                        ? 'Update your profile information below.'
                        : 'Please fill in the details below to continue. This is required for payouts and a personalized experience.'
                    }
                </CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto pr-6">
                        <FormField
                            control={form.control} name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Full Name</FormLabel>
                                    <FormControl><Input placeholder="Sachin Tendulkar" {...field} disabled={isSubmitting} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control} name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl><Input placeholder="sachin@tendulkar.com" {...field} disabled={true} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control} name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <div className="flex items-center gap-2">
                                        <FormControl>
                                            <Input 
                                                type="tel" 
                                                placeholder="9876543210" 
                                                {...field} 
                                                disabled={isSubmitting} 
                                                onChange={(e) => {
                                                    field.onChange(e);
                                                    if (e.target.value !== userData?.phone) {
                                                        setPhoneVerifiedInForm(false);
                                                    } else {
                                                        setPhoneVerifiedInForm(userData?.phoneVerified);
                                                    }
                                                }}
                                            />
                                        </FormControl>
                                        {watchedPhone && (
                                            (phoneVerifiedInForm && !needsVerification) ? (
                                                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                                            ) : (
                                                <PhoneVerificationDialog phone={watchedPhone} onVerified={() => setPhoneVerifiedInForm(true)}>
                                                    <Button type="button" variant="secondary" disabled={form.formState.errors.phone?.message ? true : false}>
                                                        {phoneVerifiedInForm ? 'Verified' : 'Verify'}
                                                    </Button>
                                                </PhoneVerificationDialog>
                                            )
                                        )}
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control} name="dob"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Date of Birth</FormLabel>
                                        <FormControl><Input type="date" {...field} disabled={isSubmitting} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control} name="gender"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Gender</FormLabel>
                                        <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                                            <FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl>
                                            <SelectContent>
                                                {['Male', 'Female', 'Other', 'Prefer not to say'].map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                         <FormField
                            control={form.control} name="occupation"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Occupation</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select occupation" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {occupations.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control} name="upi"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>UPI ID for Payouts</FormLabel>
                                    <FormControl><Input placeholder="yourname@bank" {...field} disabled={isSubmitting || !!userData?.upi} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control} name="favoriteFormat"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Favorite Cricket Format</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select format" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {cricketFormats.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control} name="favoriteTeam"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Favorite Team</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value} disabled={isSubmitting}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Select team" /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            {cricketTeams.map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control} name="favoriteCricketer"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Favorite Cricketer</FormLabel>
                                    <FormControl><Input placeholder="Virat Kohli" {...field} disabled={isSubmitting} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter>
                         <Button type="submit" className="w-full" disabled={isSaveDisabled}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Profile
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}

    

    