
'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PercentCircle } from 'lucide-react';
import { EditProfileDialog } from './EditProfileDialog';
import { Button } from '../ui/button';
import { useAuth } from '@/context/AuthProvider';
import { isProfileConsideredComplete } from '@/lib/profile-utils';

export default function ProfileCompletion() {
    const { profile, isProfileComplete } = useAuth();

    if (!profile || isProfileComplete) {
        return null;
    }

    return (
        <Card className="bg-amber-500/10 border-amber-500/30">
            <CardHeader className='pb-2'>
                <CardTitle className="text-base flex items-center gap-2 text-amber-500">
                    <PercentCircle/> Complete Your Profile
                </CardTitle>
                <CardDescription className='text-amber-500/80'>
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
