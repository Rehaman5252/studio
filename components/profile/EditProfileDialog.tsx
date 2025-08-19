
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthProvider';
import { useForm, Controller } from 'react-hook-form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

const profileSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  gender: z.string().min(1, "Please select a gender"),
  occupation: z.string().min(1, "Please select an occupation"),
  favoriteFormat: z.string().min(1, "Please select a format"),
  favoriteTeam: z.string().min(1, "Please enter your favorite team"),
  favoriteCricketer: z.string().min(1, "Please enter your favorite cricketer"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const occupations = ["Student", "Employee", "Business", "Professional", "Homemaker", "Other"];
const cricketFormats = ["Test", "ODI", "T20", "IPL", "WPL", "Mixed"];

interface EditProfileDialogProps {
  userProfile: any;
}

export function EditProfileDialog({ userProfile }: EditProfileDialogProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const { updateUserData } = useAuth();
  
  const defaultDob = userProfile.dob instanceof Timestamp 
    ? new Date(userProfile.dob.seconds * 1000).toISOString().split('T')[0]
    : '';

  const { control, handleSubmit, formState: { isSubmitting, errors } } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: userProfile.name || '',
      dob: defaultDob,
      gender: userProfile.gender || '',
      occupation: userProfile.occupation || '',
      favoriteFormat: userProfile.favoriteFormat || '',
      favoriteTeam: userProfile.favoriteTeam || '',
      favoriteCricketer: userProfile.favoriteCricketer || '',
    },
  });

  const onSubmit = async (data: ProfileFormValues) => {
    try {
      await updateUserData({
          ...data,
          profileCompleted: true,
      });
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
        <Button variant="ghost" size="icon">
          <Edit className="h-5 w-5" />
          <span className="sr-only">Edit Profile</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Your Profile</DialogTitle>
          <DialogDescription>
            Keep your information up to date.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Full Name</Label>
            <Controller name="name" control={control} render={({ field }) => <Input id="name" {...field} />} />
            {errors.name && <p className="text-destructive text-sm mt-1">{errors.name.message}</p>}
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
            <Controller name="favoriteTeam" control={control} render={({ field }) => <Input id="favoriteTeam" {...field} />} />
            {errors.favoriteTeam && <p className="text-destructive text-sm mt-1">{errors.favoriteTeam.message}</p>}
          </div>
           <div>
            <Label htmlFor="favoriteCricketer">Favorite Cricketer</Label>
            <Controller name="favoriteCricketer" control={control} render={({ field }) => <Input id="favoriteCricketer" {...field} />} />
            {errors.favoriteCricketer && <p className="text-destructive text-sm mt-1">{errors.favoriteCricketer.message}</p>}
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
