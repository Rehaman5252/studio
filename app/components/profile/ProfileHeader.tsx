
'use client';

import React, { memo, useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle, Edit, Loader2 } from 'lucide-react';
import { calculateAge, maskPhone } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { sendEmailVerification, RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';
import { getAuth } from '@/lib/firebase';
import { normalizeTimestamp } from '@/lib/dates';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// --- Start of inlined PhoneVerificationDialog ---

declare global {
  interface Window {
    recaptchaVerifier: RecaptchaVerifier;
    confirmationResult: ConfirmationResult;
  }
}

interface PhoneVerificationDialogProps {
  phone: string;
  children: React.ReactNode;
}

function PhoneVerificationDialog({ phone, children }: PhoneVerificationDialogProps) {
  const [open, setOpen] = useState(false);
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const { toast } = useToast();
  const { updateUserData } = useAuth();
  
  const setupRecaptcha = () => {
    const auth = getAuth();
    if (typeof window !== 'undefined' && auth && !window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => {},
      });
    }
  };

  const handleSendOtp = async () => {
    setIsLoading(true);
    const auth = getAuth();
    try {
      if(!auth) throw new Error("Auth service is not available.");
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const confirmationResult = await signInWithPhoneNumber(auth, `+${phone}`, appVerifier);
      window.confirmationResult = confirmationResult;
      setIsOtpSent(true);
      toast({ title: 'OTP Sent', description: 'Check your phone for the verification code.' });
    } catch (error: any) {
      console.error('SMS not sent error', error);
      toast({
        title: 'Failed to Send OTP',
        description: 'Could not send verification code. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length !== 6) {
      toast({ title: 'Invalid OTP', description: 'Please enter a 6-digit OTP.', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const result = await window.confirmationResult.confirm(otp);
      if (result.user) {
        await updateUserData({ phoneVerified: true });
        toast({ title: 'Success!', description: 'Your phone number has been verified.' });
        setOpen(false);
      }
    } catch (error) {
      console.error('OTP verification error', error);
      toast({ title: 'Verification Failed', description: 'The OTP you entered is incorrect.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verify Your Phone Number</DialogTitle>
          <DialogDescription>
            {isOtpSent
              ? `We've sent a 6-digit code to +${phone}. Please enter it below.`
              : 'We will send a one-time password (OTP) to your number to verify it.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {!isOtpSent ? (
            <div className="text-center">
              <p className="font-semibold text-lg">Your number: +{phone}</p>
              <div id="recaptcha-container" className="my-2"></div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="otp">Enter OTP</Label>
              <Input id="otp" type="tel" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" disabled={isLoading} />
            </div>
          )}
        </div>
        <DialogFooter>
          <DialogClose asChild><Button variant="outline" disabled={isLoading}>Cancel</Button></DialogClose>
          {isOtpSent ? (
            <Button onClick={handleVerifyOtp} disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Verify OTP</Button>
          ) : (
            <Button onClick={handleSendOtp} disabled={isLoading}>{isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Send OTP</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- End of inlined PhoneVerificationDialog ---

// --- Start of inlined EditProfileDialog ---

const profileSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").refine(val => new Date(val) < new Date(), "Date of birth must be in the past."),
  gender: z.string().min(1, "Please select a gender"),
  occupation: z.string().min(1, "Please select an occupation"),
  upi: z.string().min(3, "Please enter a valid UPI ID").regex(/^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/, "Please enter a valid UPI ID format (e.g., yourname@bank)"),
  favoriteFormat: z.string().min(1, "Please select a format"),
  favoriteTeam: z.string().min(1, "Please select your favorite team"),
  favoriteCricketer: z.string().min(1, "Please enter your favorite cricketer"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const occupations = ["Student", "Employee", "Business", "Professional", "Homemaker", "Other"];
const cricketFormats = ["Test", "ODI", "T20", "IPL", "WPL", "Mixed"];
const cricketTeams = [
    "Chennai Super Kings", "Delhi Capitals", "Gujarat Titans", "Kolkata Knight Riders", 
    "Lucknow Super Giants", "Mumbai Indians", "Punjab Kings", "Rajasthan Royals", 
    "Royal Challengers Bengaluru", "Sunrisers Hyderabad",
    "Team India", "Team Australia", "Team England", "Team South Africa", "Team New Zealand",
    "Team Pakistan", "Team Sri Lanka", "Team West Indies", "Team Bangladesh", "Other"
];

function toInputDate(value: any): string {
  const date = normalizeTimestamp(value);
  if (!date) return "";
  return date.toISOString().slice(0, 10);
}

interface EditProfileDialogProps {
  userProfile: any;
  children: React.ReactNode;
}

function EditProfileDialog({ userProfile, children }: EditProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { updateUserData } = useAuth();
  
  const defaultDob = toInputDate(userProfile.dob);

  const { control, handleSubmit, formState: { isSubmitting, errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: userProfile.name || '',
      dob: defaultDob,
      gender: userProfile.gender || '',
      occupation: userProfile.occupation || '',
      upi: userProfile.upi || '',
      favoriteFormat: userProfile.favoriteFormat || '',
      favoriteTeam: userProfile.favoriteTeam || '',
      favoriteCricketer: userProfile.favoriteCricketer || '',
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      const payload = {
        ...data,
        dob: data.dob ? new Date(data.dob) : null,
      };
      await updateUserData(payload);
      toast({ title: 'Success!', description: 'Your profile has been updated.' });
      setOpen(false);
    } catch (error) {
      console.error('Profile update error', error);
      toast({
        title: 'Update Failed',
        description: 'Could not save your changes. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Your Profile</DialogTitle>
          <DialogDescription>Keep your information up to date to participate in quizzes.</DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-4 -mr-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="edit-profile-form">
              <FormField control={control} name="name" render={({ field }) => ( <FormItem> <Label>Full Name</Label> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
              <div><Label>Email Address</Label><Input value={userProfile?.email || ''} disabled /></div>
              <div><Label>Phone Number</Label><Input value={userProfile?.phone || ''} disabled /></div>
              <FormField control={control} name="upi" render={({ field }) => ( <FormItem> <Label>UPI ID (for rewards)</Label> <FormControl><Input {...field} placeholder="yourname@bank" /></FormControl> <FormMessage /> </FormItem> )} />
              <FormField control={control} name="dob" render={({ field }) => ( <FormItem> <Label>Date of Birth</Label> <FormControl><Input type="date" {...field} /></FormControl> <FormMessage /> </FormItem> )} />
              <FormField control={control} name="gender" render={({ field }) => ( <FormItem> <Label>Gender</Label> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl><SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl> <SelectContent> <SelectItem value="Male">Male</SelectItem> <SelectItem value="Female">Female</SelectItem> <SelectItem value="Other">Other</SelectItem> </SelectContent> </Select> <FormMessage /> </FormItem> )} />
              <FormField control={control} name="occupation" render={({ field }) => ( <FormItem> <Label>Occupation</Label> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl><SelectTrigger><SelectValue placeholder="Select occupation" /></SelectTrigger></FormControl> <SelectContent> {occupations.map(occ => <SelectItem key={occ} value={occ}>{occ}</SelectItem>)} </SelectContent> </Select> <FormMessage /> </FormItem> )} />
              
              <h3 className="text-lg font-semibold pt-4 border-t">Cricket Preferences</h3>
              <FormField control={control} name="favoriteFormat" render={({ field }) => ( <FormItem> <Label>Favorite Format</Label> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl><SelectTrigger><SelectValue placeholder="Select format" /></SelectTrigger></FormControl> <SelectContent> {cricketFormats.map(format => <SelectItem key={format} value={format}>{format}</SelectItem>)} </SelectContent> </Select> <FormMessage /> </FormItem> )} />
              <FormField control={control} name="favoriteTeam" render={({ field }) => ( <FormItem> <Label>Favorite Team</Label> <Select onValueChange={field.onChange} defaultValue={field.value}> <FormControl><SelectTrigger><SelectValue placeholder="Select your favorite team" /></SelectTrigger></FormControl> <SelectContent> {cricketTeams.map(team => <SelectItem key={team} value={team}>{team}</SelectItem>)} </SelectContent> </Select> <FormMessage /> </FormItem> )} />
              <FormField control={control} name="favoriteCricketer" render={({ field }) => ( <FormItem> <Label>Favorite Cricketer</Label> <FormControl><Input {...field} /></FormControl> <FormMessage /> </FormItem> )} />
            </form>
        </div>
        <DialogFooter className="pt-4 border-t">
            <DialogClose asChild><Button type="button" variant="outline" disabled={isSubmitting}>Cancel</Button></DialogClose>
            <Button type="submit" form="edit-profile-form" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// --- End of inlined EditProfileDialog ---


function ProfileHeaderComponent({ userProfile }: { userProfile: any }) {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    
    const dobDate = normalizeTimestamp(userProfile?.dob);
    const age = dobDate ? calculateAge(dobDate.toISOString().split('T')[0]) : null;
    
    const isPhoneVerified = !!profile?.phoneVerified;
    const isEmailVerified = user?.emailVerified || false;

    const handleResendVerification = async () => {
        const auth = getAuth();
        if (!user || !auth) {
            toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
            return;
        }
        try {
            await sendEmailVerification(user);
            toast({ title: 'Verification Email Sent', description: 'Please check your inbox to verify your email address.' });
        } catch (error: any) {
            console.error("Error resending verification email:", error);
            let message = "Could not send verification email.";
            if (error.code === 'auth/too-many-requests') {
                message = "You've requested this too many times. Please wait before trying again.";
            }
            toast({ title: 'Error', description: message, variant: 'destructive' });
        }
    };

    if (!user) return <div>Loading...</div>;

    return (
        <Card className="bg-card shadow-lg relative">
             {user && profile && (
                <div className="absolute top-2 right-2 z-10">
                    <EditProfileDialog userProfile={profile}>
                        <Button variant="outline" size="icon" className="bg-card border-primary text-primary hover:bg-primary/10 hover:text-primary h-8 w-8">
                            <Edit className="h-4 w-4" />
                        </Button>
                    </EditProfileDialog>
                </div>
            )}
            <CardContent className="p-4 flex flex-col sm:flex-row items-center text-center sm:text-left gap-4">
                <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
                    <AvatarImage src={userProfile?.photoURL || `https://placehold.co/100x100.png`} alt="User Avatar" data-ai-hint="avatar person" />
                    <AvatarFallback>{userProfile?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                    <h2 className="text-2xl font-bold text-foreground">{userProfile?.name || 'New User'}</h2>
                    <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                        <p className="text-muted-foreground text-sm">{maskPhone(userProfile?.phone)}</p>
                         {userProfile.phone ? (
                            isPhoneVerified ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" title="Verified" />
                            ) : (
                                <PhoneVerificationDialog phone={userProfile.phone}>
                                    <Button variant="link" className="p-0 h-auto text-yellow-500 text-sm hover:no-underline">
                                        <AlertCircle className="h-4 w-4 mr-1" />
                                        Verify Now
                                    </Button>
                                </PhoneVerificationDialog>
                            )
                        ) : null}
                    </div>
                    <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                         <p className="text-muted-foreground text-sm">{userProfile?.email || 'No email set'}</p>
                         {userProfile?.email && (
                            isEmailVerified ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" title="Verified"/>
                            ) : (
                                <Button variant="link" className="p-0 h-auto text-yellow-500 text-sm hover:no-underline" onClick={handleResendVerification}>
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    Resend Link
                                </Button>
                            )
                         )}
                    </div>
                    <div className="text-muted-foreground text-xs flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                        {age ? <span>{age} yrs</span> : null}
                        {userProfile?.gender && <span>&middot; {userProfile.gender}</span>}
                        {userProfile?.occupation && <span>&middot; {userProfile.occupation}</span>}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

const ProfileHeader = memo(ProfileHeaderComponent);
export default ProfileHeader;
