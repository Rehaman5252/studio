
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PercentCircle } from 'lucide-react';

const MANDATORY_PROFILE_FIELDS = [
    'name', 'email', 'phone', 'dob', 'gender', 'occupation', 'upi', 
    'favoriteFormat', 'favoriteTeam', 'favoriteCricketer'
];

export default function ProfileCompletion({ userProfile }: { userProfile: any }) {
    if (!userProfile) {
        return null;
    }
    
    // Improved logic to check for meaningful content
    const completedFields = MANDATORY_PROFILE_FIELDS.filter(field => {
        const value = userProfile?.[field];
        if (typeof value === 'string') return value.trim().length > 0;
        return !!value;
    });

    const completionPercentage = Math.round((completedFields.length / MANDATORY_PROFILE_FIELDS.length) * 100);

    // Hide component when profile is 100% complete
    if (completionPercentage === 100) {
        return null;
    }

    return (
        <Card className="bg-card shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <PercentCircle className="text-primary"/> Profile Completion
                </CardTitle>
                <CardDescription>
                    Complete your profile to unlock all features and rewards.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
                <Progress value={completionPercentage} className="h-3" />
                <p className="text-sm text-center text-muted-foreground">
                    {completionPercentage}% complete ({completedFields.length}/{MANDATORY_PROFILE_FIELDS.length} fields)
                </p>
            </CardContent>
        </Card>
    );
};
