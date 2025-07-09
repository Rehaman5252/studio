'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DialogTrigger } from '@/components/ui/dialog';
import { Edit, CheckCircle2, AlertCircle } from 'lucide-react';
import { calculateAge, maskPhone } from '@/lib/utils';

function ProfileHeader({ userProfile }: { userProfile: any }) {
    const age = calculateAge(userProfile?.dob);

    return (
        <Card className="bg-card shadow-lg">
            <CardContent className="p-4 flex items-center gap-4 relative">
                <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
                    <AvatarImage src={userProfile?.photoURL || `https://placehold.co/100x100.png`} alt="User Avatar" data-ai-hint="avatar person" />
                    <AvatarFallback>{userProfile?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                    <h2 className="text-2xl font-bold text-foreground">{userProfile?.name || 'New User'}</h2>
                    <div className="flex items-center gap-1.5">
                        <p className="text-muted-foreground text-sm">{maskPhone(userProfile?.phone)}</p>
                        {userProfile?.phone ? (userProfile.phoneVerified ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-yellow-500" />) : null}
                    </div>
                    <div className="flex items-center gap-1.5">
                         <p className="text-muted-foreground text-sm">{userProfile?.email || 'No email set'}</p>
                         {userProfile?.email ? (userProfile.emailVerified ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-yellow-500" />) : null}
                    </div>
                    <div className="text-muted-foreground text-xs flex items-center gap-2 flex-wrap">
                        {age && <span>{age} yrs</span>}
                        {userProfile?.gender && <span>&middot; {userProfile.gender}</span>}
                        {userProfile?.occupation && <span>&middot; {userProfile.occupation}</span>}
                    </div>
                </div>
                <DialogTrigger asChild>
                    <Button variant="outline" size="icon" className="absolute top-4 right-4 rounded-full h-8 w-8" aria-label="Edit Profile">
                        <Edit className="h-4 w-4" />
                    </Button>
                </DialogTrigger>
            </CardContent>
        </Card>
    );
};

export default memo(ProfileHeader);
