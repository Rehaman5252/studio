'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, setDoc, serverTimestamp, type DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

const profileSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
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
    'name', 'phone', 'dob', 'gender', 'occupation', 'upi', 
    'favoriteFormat', 'favoriteTeam', 'favoriteCricketer'
];

const defaultFormValues = {
  name: '', phone: '', dob: '', gender: undefined, 
  occupation: undefined, upi: '', favoriteFormat: undefined, 
  favoriteTeam: undefined, favoriteCricketer: '',
};

const occupations = ['Student', 'Employee', 'Business', 'Others'];
const cricketFormats = ['T20', 'ODI', 'Test', 'IPL', 'WPL', 'Mixed'];
const cricketTeams = [
    'India', 'Australia', 'England', 'South Africa', 'New Zealand', 'Pakistan', 'Sri Lanka', 'West Indies',
    'Chennai Super Kings', 'Mumbai Indians', 'Kolkata Knight Riders', 'Royal Challengers Bengaluru', 
    'Sunrisers Hyderabad', 'Punjab Kings', 'Delhi Capitals', 'Rajasthan Royals', 'Lucknow Super Giants', 'Gujarat Titans'
];


export default function CompleteProfileForm({ userProfile }: { userProfile: any }) {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: defaultFormValues as any,
    });

    useEffect(() => {
        if (userProfile) {
            const defaults = { ...defaultFormValues };
            for (const field of MANDATORY_PROFILE_FIELDS) {
                if (userProfile[field]) {
                    (defaults as any)[field] = userProfile[field];
                }
            }
            form.reset(defaults);
        }
    }, [userProfile, form]);
    
    const isEditing = userProfile && MANDATORY_PROFILE_FIELDS.every(field => !!userProfile[field]);

    const onSubmit = async (data: ProfileFormValues) => {
        if (!userProfile?.uid || !db) return;
        setIsSubmitting(true);
        try {
            const userDocRef = doc(db, 'users', userProfile.uid);
            
            const updatePayload: DocumentData = { ...data };
            // If the phone number is being changed or set for the first time, mark it as unverified.
            if (data.phone !== userProfile.phone) {
                updatePayload.phoneVerified = false;
            }
            updatePayload.updatedAt = serverTimestamp();

            // Use setDoc with merge for a robust save operation.
            // This will create or update the document without overwriting existing fields unintentionally.
            await setDoc(userDocRef, updatePayload, { merge: true });

            toast({
                title: "Profile Saved",
                description: "Your information has been saved successfully.",
            });
            router.push('/home'); // Redirect to home after saving
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

    return (
        <Card className="w-full max-w-lg">
            <CardHeader>
                <CardTitle>{isEditing ? 'Edit Profile' : 'Complete Your Profile'}</CardTitle>
                <CardDescription>
                    {isEditing 
                        ? 'Update your profile information below.'
                        : 'Please fill in the details below to continue. This is required for payouts and a personalized experience.'
                    }
                </CardDescription>
            </CardHeader>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
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
                            control={form.control} name="phone"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Phone Number</FormLabel>
                                    <FormControl><Input type="tel" placeholder="9876543210" {...field} disabled={isSubmitting} /></FormControl>
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
                                    <FormControl><Input placeholder="yourname@bank" {...field} disabled={isSubmitting} /></FormControl>
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
                         <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Profile
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}
