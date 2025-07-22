
'use client';

import React, { memo } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { calculateAge, maskPhone } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { sendEmailVerification } from 'firebase/auth';
import { getFirebaseAuth } from '@/lib/firebaseClient';

function ProfileHeader({ userProfile }: { userProfile: any }) {
    const { user } = useAuth(); // Get the auth user object
    const { toast } = useToast();
    const age = calculateAge(userProfile?.dob);
    
    const isPhoneVerified = !!userProfile?.phoneVerified;
    const isEmailVerified = user?.emailVerified || false;

    const handleResendVerification = async () => {
        const auth = getFirebaseAuth();
        if (!user || !auth) {
            toast({ title: 'Error', description: 'You must be logged in.', variant: 'destructive' });
            return;
        }
        try {
            await sendEmailVerification(user);
            toast({ title: 'Verification Email Sent', description: 'Please check your inbox to verify your email address.' });
        } catch (error: any) {
            console.error("Error resending verification email:", error);
            let message = "Could not send verification email.";
            if (error.code === 'auth/too-many-requests') {
                message = "You've requested this too many times. Please wait before trying again.";
            }
            toast({ title: 'Error', description: message, variant: 'destructive' });
        }
    };

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
                        {isPhoneVerified && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" title="Verified" />
                        )}
                    </div>
                    <div className="flex items-center gap-1.5 justify-center sm:justify-start">
                         <p className="text-muted-foreground text-sm">{userProfile?.email || 'No email set'}</p>
                         {userProfile?.email && (
                            isEmailVerified ? (
                                <CheckCircle2 className="h-4 w-4 text-green-500" title="Verified"/>
                            ) : (
                                <Button variant="link" className="p-0 h-auto text-yellow-500 text-sm hover:no-underline" onClick={handleResendVerification}>
                                    <AlertCircle className="h-4 w-4 mr-1" />
                                    Resend Link
                                </Button>
                            )
                         )}
                    </div>
                    <div className="text-muted-foreground text-xs flex items-center gap-2 flex-wrap justify-center sm:justify-start">
                        {age ? <span>{age} yrs</span> : null}
                        {userProfile?.gender && <span>&middot; {userProfile.gender}</span>}
                        {userProfile?.occupation && <span>&middot; {userProfile.occupation}</span>}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default memo(ProfileHeader);
