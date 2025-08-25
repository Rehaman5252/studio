
'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PercentCircle } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { EditProfileDialog } from './EditProfileDialog';
import { Button } from '../ui/button';
import { useAuth } from '@/context/AuthProvider';

const MANDATORY_PROFILE_FIELDS = [
    'name', 'email', 'phone', 'dob', 'gender', 'occupation', 'upi', 
    'favoriteFormat', 'favoriteTeam', 'favoriteCricketer'
] as const;

type ProfileField = typeof MANDATORY_PROFILE_FIELDS[number];

const isFieldComplete = (fieldName: ProfileField, value: any): boolean => {
    if (value === undefined || value === null) return false;
    
    switch(fieldName) {
        case 'name':
        case 'occupation':
        case 'favoriteCricketer':
            return typeof value === 'string' && value.trim().length >= 3;
        case 'email':
            return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
        case 'phone':
             return typeof value === 'string' && /^\d{10,}$/.test(value.trim()); // 10 or more digits
        case 'upi':
            return typeof value === 'string' && /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/.test(value.trim());
        case 'dob':
            return value instanceof Timestamp && !isNaN(value.toDate().getTime());
        case 'gender':
        case 'favoriteFormat':
        case 'favoriteTeam':
             return typeof value === 'string' && value.trim().length > 0;
        default:
            return !!value;
    }
}

export default function ProfileCompletion() {
    const { profile } = useAuth();

    const { completionPercentage, completedCount } = useMemo(() => {
        if (!profile) return { completionPercentage: 0, completedCount: 0 };
        
        const completed = MANDATORY_PROFILE_FIELDS.filter(field => isFieldComplete(field, profile?.[field]));
        const percentage = Math.round((completed.length / MANDATORY_PROFILE_FIELDS.length) * 100);
        
        return { completionPercentage: percentage, completedCount: completed.length };
    }, [profile]);

    if (!profile || completionPercentage === 100) {
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
                <div className='flex items-center gap-4'>
                    <Progress value={completionPercentage} className="h-2 flex-1" />
                    <span className="text-sm font-semibold text-amber-500">{completionPercentage}%</span>
                </div>
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
