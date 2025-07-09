'use client';

import React, { memo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { calculateAge, maskPhone } from '@/lib/utils';
import { PhoneVerificationDialog } from './PhoneVerificationDialog';

function ProfileHeader({ userProfile }: { userProfile: any }) {
    const age = calculateAge(userProfile?.dob);
    const isPhoneSet = !!userProfile?.phone;
    const isPhoneVerified = !!userProfile?.phoneVerified;

    return (
        <Card className="bg-card shadow-lg">
            <CardContent className="p-4 flex flex-col sm:flex-row items-center text-center sm:text-left gap-4">
                <Avatar className="w-20 h-20 border-4 border-background shadow-lg">
                    <AvatarImage src={userProfile?.photoURL || `https://placehold.co/100x100.png`} alt="User Avatar" data-ai-hint="avatar person" />
                    <AvatarFallback>{userProfile?.name?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                    <h2 className="text-2xl font-bold text-foreground">{userProfile?.name || 'New User'}</h2>
                    <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                        <p className="text-muted-foreground text-sm">{maskPhone(userProfile?.phone)}</p>
                        {isPhoneSet && (
                            isPhoneVerified ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" title="Verified" />
                            ) : (
                                <PhoneVerificationDialog phone={userProfile.phone}>
                                    <Button variant="link" className="p-0 h-auto text-yellow-500 text-sm hover:no-underline">
                                        <AlertCircle className="h-4 w-4 mr-1" />
                                        Verify
                                    </Button>
                                </PhoneVerificationDialog>
                            )
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                         <p className="text-muted-foreground text-sm">{userProfile?.email || 'No email set'}</p>
                         {userProfile?.email ? (userProfile.emailVerified ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <AlertCircle className="h-4 w-4 text-yellow-500" />) : null}
                    </div>
                    <div className="text-muted-foreground text-xs flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                        {age && <span>{age} yrs</span>}
                        {userProfile?.gender && <span>&middot; {userProfile.gender}</span>}
                        {userProfile?.occupation && <span>&middot; {userProfile.occupation}</span>}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default memo(ProfileHeader);
