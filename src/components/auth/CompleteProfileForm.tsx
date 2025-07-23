
'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Skeleton } from '../ui/skeleton';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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

const ProfileFormSkeleton = () => (
    <Card className="w-full max-w-lg">
        <CardHeader>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-full max-w-sm mt-2" />
        </CardHeader>
        <CardContent className="space-y-4 pr-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
        </CardContent>
        <CardFooter>
            <Skeleton className="h-10 w-full" />
        </CardFooter>
    </Card>
)

export default function CompleteProfileForm({ onSaveSuccess }: { onSaveSuccess: () => void }) {
    const router = useRouter();
    const { user, updateUserData, loading } = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [profile, setProfile] = useState<any>(null);
    const [isFetchingProfile, setIsFetchingProfile] = useState(true);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: '', email: '', phone: '', dob: '', gender: undefined, occupation: undefined,
            upi: '', favoriteFormat: undefined, favoriteTeam: '', favoriteCricketer: '',
        },
    });
    
    useEffect(() => {
      async function fetchProfile() {
        if (!user || !db) {
          setIsFetchingProfile(false);
          return;
        }
        try {
          const docRef = doc(db, 'users', user.uid);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data();
            setProfile(data);
            form.reset({
                name: data.name || user.displayName || '',
                email: data.email || user.email || '',
                phone: data.phone || '',
                dob: data.dob?.toDate ? data.dob.toDate().toISOString().split('T')[0] : data.dob || '',
                gender: data.gender || undefined,
                occupation: data.occupation || undefined,
                upi: data.upi || '',
                favoriteFormat: data.favoriteFormat || undefined,
                favoriteTeam: data.favoriteTeam || '',
                favoriteCricketer: data.favoriteCricketer || '',
            });
          }
        } catch (error) {
          console.error("Error fetching profile for form:", error);
        } finally {
          setIsFetchingProfile(false);
        }
      }
      if (!loading) {
        fetchProfile();
      }
    }, [user, loading, form]);


    const onSubmit = async (data: ProfileFormValues) => {
        if (!user || !updateUserData) {
            toast({ title: "Authentication Error", description: "User not logged in.", variant: "destructive" });
            return;
        }

        setIsSubmitting(true);
        try {
            await updateUserData({ ...data, profileCompleted: true });
            toast({ 
                title: "Profile Saved!", 
                description: "Your information has been updated successfully."
            });
            onSaveSuccess();
        } catch (error: any) {
            console.error("🔥 Save Failed:", error);
            toast({
                title: "Save Failed",
                description: error.message || "Could not save profile. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading || isFetchingProfile) {
        return <ProfileFormSkeleton />;
    }
    
    const isProfileComplete = profile?.profileCompleted || false;

    return (
        <Card className="w-full max-w-lg relative">
            <Button
                variant="ghost"
                size="icon"
                className="absolute top-4 right-4 text-muted-foreground hover:bg-muted"
                onClick={() => router.push('/home')}
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
                                    <FormControl>
                                        <Input 
                                            type="tel" 
                                            placeholder="9876543210" 
                                            {...field} 
                                            disabled={isSubmitting} 
                                        />
                                    </FormControl>
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
                                    <FormControl><Input placeholder="yourname@bank" {...field} disabled={isSubmitting || !!profile?.upi} /></FormControl>
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
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                             ) : (
                                'Save Profile'
                            )}
                        </Button>
                    </CardFooter>
                </form>
            </Form>
        </Card>
    );
}
