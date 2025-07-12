
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, setDoc, serverTimestamp, type DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/hooks/use-toast';

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

const defaultFormValues = {
  name: '', phone: '', dob: '', gender: undefined, 
  occupation: undefined, upi: '', favoriteFormat: undefined, 
  favoriteTeam: '', favoriteCricketer: '',
};

const occupations = ['Student', 'Employee', 'Business', 'Others'];
const cricketFormats = ['T20', 'ODI', 'Test', 'IPL', 'WPL', 'Mixed'];
const cricketTeams = [
    'India', 'Australia', 'England', 'South Africa', 'New Zealand', 'Pakistan', 'Sri Lanka', 'West Indies',
    'Chennai Super Kings', 'Mumbai Indians', 'Kolkata Knight Riders', 'Royal Challengers Bengaluru', 
    'Sunrisers Hyderabad', 'Punjab Kings', 'Delhi Capitals', 'Rajasthan Royals', 'Lucknow Super Giants', 'Gujarat Titans'
];


export default function CompleteProfileForm() {
    const router = useRouter();
    const { user, userData, isProfileComplete, isUserDataLoading } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: defaultFormValues as any,
    });

    useEffect(() => {
        if (userData) {
            const defaults = { ...defaultFormValues };
            for (const key in defaultFormValues) {
                if (userData[key]) {
                    (defaults as any)[key] = userData[key];
                }
            }
             // Handle case where favoriteTeam might not be in the list
            if (userData.favoriteTeam && !cricketTeams.includes(userData.favoriteTeam)) {
                (defaults as any).favoriteTeam = ''; // Or handle as needed
            }

            form.reset(defaults);
        }
    }, [userData, form]);
    
    const onSubmit = async (data: ProfileFormValues) => {
        setIsSubmitting(true);

        if (!user || !user.uid) {
            toast({ title: "Authentication Error", description: "You must be signed in to save your profile.", variant: "destructive" });
            setIsSubmitting(false);
            return;
        }

        if (!db) {
            toast({ title: "Database Error", description: "Cannot connect to the database.", variant: "destructive" });
            setIsSubmitting(false);
            return;
        }

        try {
            const userDocRef = doc(db, 'users', user.uid);
            
            const updatePayload: DocumentData = { 
                ...data,
                email: user.email,
                photoURL: user.photoURL,
                updatedAt: serverTimestamp(),
                profileCompleted: true,
            };
    
            if (data.phone !== userData?.phone) {
                updatePayload.phoneVerified = false;
            }
            
            await setDoc(userDocRef, updatePayload, { merge: true });
    
            toast({ title: 'Profile Saved!', description: 'Your profile has been updated successfully.'});
            router.push('/home');
    
        } catch (error: any) {
            console.error("Firestore error:", error);
            toast({ title: "Error Saving Profile", description: `Could not save your profile. Reason: ${error.message}`, variant: "destructive" });
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

    return (
        <Card className="w-full max-w-lg">
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
