
'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PercentCircle, CheckCircle } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';
import { Button } from '../ui/button';

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

export default function ProfileCompletion({ userProfile }: { userProfile: any }) {
    const { completionPercentage, completedCount } = useMemo(() => {
        if (!userProfile) return { completionPercentage: 0, completedCount: 0 };
        
        const completed = MANDATORY_PROFILE_FIELDS.filter(field => isFieldComplete(field, userProfile?.[field]));
        const percentage = Math.round((completed.length / MANDATORY_PROFILE_FIELDS.length) * 100);
        
        return { completionPercentage: percentage, completedCount: completed.length };
    }, [userProfile]);

    // Hide component when profile is 100% complete
    if (completionPercentage === 100) {
        return null;
    }

    return (
        <Card className="bg-card shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <PercentCircle className="text-accent"/> Profile Completion
                </CardTitle>
                <CardDescription>
                    Complete your profile to unlock all features and rewards.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                <Progress value={completionPercentage} className="h-3" />
                <p className="text-sm text-center text-muted-foreground">
                    {completionPercentage}% complete ({completedCount}/{MANDATORY_PROFILE_FIELDS.length} fields)
                </p>
            </CardContent>
        </Card>
    );
};
