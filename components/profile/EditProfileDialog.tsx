
'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context/AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

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
  if (!value) return "";
  let date: Date;
  if (value instanceof Timestamp) {
    date = value.toDate();
  } else {
    date = new Date(value);
  }
  if (isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
}


interface EditProfileDialogProps {
  userProfile: any;
  children: React.ReactNode;
}

export function EditProfileDialog({ userProfile, children }: EditProfileDialogProps) {
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
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Edit Your Profile</DialogTitle>
          <DialogDescription>
            Keep your information up to date to participate in quizzes.
          </DialogDescription>
        </DialogHeader>
        <div className="flex-grow overflow-y-auto pr-4 -mr-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" id="edit-profile-form">
            <div>
                <Label htmlFor="name">Full Name</Label>
                <Controller name="name" control={control} render={({ field }) => <Input id="name" {...field} />} />
                {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
            </div>
            <div>
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" value={userProfile?.email || ''} disabled />
            </div>
            <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" value={userProfile?.phone || ''} disabled />
            </div>
             <div>
                <Label htmlFor="upi">UPI ID (for rewards)</Label>
                <Controller name="upi" control={control} render={({ field }) => <Input id="upi" {...field} placeholder="yourname@bank" />} />
                {errors.upi && <p className="text-destructive text-sm mt-1">{errors.upi.message}</p>}
            </div>
            <div>
                <Label htmlFor="dob">Date of Birth</Label>
                <Controller name="dob" control={control} render={({ field }) => <Input id="dob" type="date" {...field} />} />
                {errors.dob && <p className="text-destructive text-sm mt-1">{errors.dob.message}</p>}
            </div>
            <div>
                <Label htmlFor="gender">Gender</Label>
                <Controller name="gender" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Male">Male</SelectItem>
                            <SelectItem value="Female">Female</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                )} />
                {errors.gender && <p className="text-destructive text-sm mt-1">{errors.gender.message}</p>}
            </div>
            <div>
                <Label htmlFor="occupation">Occupation</Label>
                <Controller name="occupation" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select occupation" /></SelectTrigger>
                    <SelectContent>
                        {occupations.map(occ => <SelectItem key={occ} value={occ}>{occ}</SelectItem>)}
                    </SelectContent>
                    </Select>
                )} />
                {errors.occupation && <p className="text-destructive text-sm mt-1">{errors.occupation.message}</p>}
            </div>
            
            <h3 className="text-lg font-semibold pt-4 border-t">Cricket Preferences</h3>

            <div>
                <Label htmlFor="favoriteFormat">Favorite Format</Label>
                <Controller name="favoriteFormat" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select format" /></SelectTrigger>
                    <SelectContent>
                        {cricketFormats.map(format => <SelectItem key={format} value={format}>{format}</SelectItem>)}
                    </SelectContent>
                    </Select>
                )} />
                {errors.favoriteFormat && <p className="text-destructive text-sm mt-1">{errors.favoriteFormat.message}</p>}
            </div>

            <div>
                <Label htmlFor="favoriteTeam">Favorite Team</Label>
                <Controller name="favoriteTeam" control={control} render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger><SelectValue placeholder="Select your favorite team" /></SelectTrigger>
                    <SelectContent>
                        {cricketTeams.map(team => <SelectItem key={team} value={team}>{team}</SelectItem>)}
                    </SelectContent>
                    </Select>
                )} />
                {errors.favoriteTeam && <p className="text-destructive text-sm mt-1">{errors.favoriteTeam.message}</p>}
            </div>
            <div>
                <Label htmlFor="favoriteCricketer">Favorite Cricketer</Label>
                <Controller name="favoriteCricketer" control={control} render={({ field }) => <Input id="favoriteCricketer" {...field} />} />
                {errors.favoriteCricketer && <p className="text-destructive text-sm mt-1">{errors.favoriteCricketer.message}</p>}
            </div>
            </form>
        </div>
        <DialogFooter className="pt-4 border-t">
            <DialogClose asChild>
                <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
                </Button>
            </DialogClose>
            <Button type="submit" form="edit-profile-form" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
