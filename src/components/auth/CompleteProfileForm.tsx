
'use client';
import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { useAuth } from '@/context/AuthProvider';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

const profileSchema = z.object({
  name: z.string().min(3, { message: 'Name must be at least 3 characters.' }),
  phone: z.string().min(10, "A valid phone number is required.").regex(/^\d{10,15}$/, "Invalid phone number"),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Please select a valid date."),
  gender: z.enum(['male', 'female', 'other'], { required_error: "Please select a gender." }),
  occupation: z.string().min(2, { message: "Occupation is required." }),
  upi: z.string().min(3, "Please enter a valid UPI ID."),
  favoriteFormat: z.string().min(1, "Please select your favorite format."),
  favoriteTeam: z.string().min(2, "Please enter your favorite team."),
  favoriteCricketer: z.string().min(2, "Please enter your favorite cricketer."),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function CompleteProfileForm() {
  const router = useRouter();
  const { toast } = useToast();
  const { profile, updateUserData, user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || user?.displayName || '',
      phone: profile?.phone || '',
      dob: profile?.dob ? new Date(profile.dob.seconds * 1000).toISOString().split('T')[0] : '',
      gender: profile?.gender || undefined,
      occupation: profile?.occupation || '',
      upi: profile?.upi || '',
      favoriteFormat: profile?.favoriteFormat || '',
      favoriteTeam: profile?.favoriteTeam || '',
      favoriteCricketer: profile?.favoriteCricketer || '',
    }
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setIsLoading(true);
    try {
      await updateUserData({ ...data, profileCompleted: true });
      toast({
        title: "Profile Updated!",
        description: "Your profile is now complete. Let the games begin!",
      });
      router.push('/home');
    } catch (error) {
      console.error("Profile update error:", error);
      toast({
        title: "Update Failed",
        description: "Could not save your profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-2xl shadow-black/20">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Complete Your Profile</CardTitle>
        <CardDescription className="text-center">A complete profile is needed to play quizzes and win rewards.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="space-y-1.5">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" {...register('name')} disabled={isLoading} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" type="tel" {...register('phone')} disabled={isLoading} />
            {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="dob">Date of Birth</Label>
            <Input id="dob" type="date" {...register('dob')} disabled={isLoading} />
            {errors.dob && <p className="text-sm text-destructive">{errors.dob.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Gender</Label>
            <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex items-center space-x-4 pt-2">
                    <div className="flex items-center space-x-2"><RadioGroupItem value="male" id="male" /><Label htmlFor="male">Male</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="female" id="female" /><Label htmlFor="female">Female</Label></div>
                    <div className="flex items-center space-x-2"><RadioGroupItem value="other" id="other" /><Label htmlFor="other">Other</Label></div>
                </RadioGroup>
                )}
            />
            {errors.gender && <p className="text-sm text-destructive">{errors.gender.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="occupation">Occupation</Label>
            <Input id="occupation" {...register('occupation')} disabled={isLoading} />
            {errors.occupation && <p className="text-sm text-destructive">{errors.occupation.message}</p>}
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="upi">UPI ID</Label>
            <Input id="upi" placeholder="yourname@bank" {...register('upi')} disabled={isLoading} />
            {errors.upi && <p className="text-sm text-destructive">{errors.upi.message}</p>}
          </div>
          
          <div className="space-y-1.5 md:col-span-2">
            <Label>Favorite Cricket Format</Label>
            <Controller
                name="favoriteFormat"
                control={control}
                render={({ field }) => (
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                        <SelectTrigger><SelectValue placeholder="Select a format" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Test">Test</SelectItem>
                            <SelectItem value="ODI">ODI</SelectItem>
                            <SelectItem value="T20">T20</SelectItem>
                            <SelectItem value="IPL">IPL</SelectItem>
                            <SelectItem value="WPL">WPL</SelectItem>
                        </SelectContent>
                    </Select>
                )}
            />
            {errors.favoriteFormat && <p className="text-sm text-destructive">{errors.favoriteFormat.message}</p>}
          </div>
          
          <div className="space-y-1.5">
            <Label htmlFor="favoriteTeam">Favorite Team</Label>
            <Input id="favoriteTeam" {...register('favoriteTeam')} disabled={isLoading} />
            {errors.favoriteTeam && <p className="text-sm text-destructive">{errors.favoriteTeam.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="favoriteCricketer">Favorite Cricketer</Label>
            <Input id="favoriteCricketer" {...register('favoriteCricketer')} disabled={isLoading} />
            {errors.favoriteCricketer && <p className="text-sm text-destructive">{errors.favoriteCricketer.message}</p>}
          </div>

          <div className="md:col-span-2">
            <Button type="submit" className="w-full mt-2" size="lg" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save and Continue
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
