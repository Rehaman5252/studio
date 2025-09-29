
'use client';

import { useAuth } from '@/context/AuthProvider';
import { isProfileConsideredComplete } from '@/lib/profile-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PercentCircle } from 'lucide-react';
import { EditProfileDialog } from './EditProfileDialog';

export default function ProfileCompletion() {
    const { profile } = useAuth();
    
    if (!profile || isProfileConsideredComplete(profile)) {
        return null;
    }

    return (
        <Card className="bg-accent/10 border-accent/30">
            <CardHeader className='pb-2'>
                <CardTitle className="text-base flex items-center gap-2 text-accent">
                    <PercentCircle/> Complete Your Profile
                </CardTitle>
                <CardDescription className='text-accent/80'>
                    You're almost there! Finish your profile to start playing.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                 <div className="pt-2">
                    <EditProfileDialog userProfile={profile}>
                        <Button variant="default" size="sm">
                            Update Profile
                        </Button>
                    </EditProfileDialog>
                </div>
            </CardContent>
        </Card>
    );
};
