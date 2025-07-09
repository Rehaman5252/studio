'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { PercentCircle } from 'lucide-react';

const MANDATORY_PROFILE_FIELDS = [
    'name', 'email', 'phone', 'dob', 'gender', 'occupation', 'upi', 
    'favoriteFormat', 'favoriteTeam', 'favoriteCricketer'
];

function ProfileCompletion({ userProfile }: { userProfile: any }) {
    const completedFields = MANDATORY_PROFILE_FIELDS.filter(field => !!userProfile?.[field]);
    const completionPercentage = Math.round((completedFields.length / MANDATORY_PROFILE_FIELDS.length) * 100);

    if (completionPercentage === 100) {
        return null;
    }

    return (
        <Card className="bg-card shadow-lg">
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <PercentCircle /> Profile Completion
                </CardTitle>
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

export default memo(ProfileCompletion);
