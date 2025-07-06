
import { Suspense } from 'react';
import VerifyEmailContent from '@/components/auth/VerifyEmailContent';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { MailCheck } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';


function VerifyEmailLoading() {
    return (
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <div className="mx-auto bg-primary/20 p-4 rounded-full w-fit mb-4">
                    <MailCheck className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-3xl font-extrabold">Almost There!</CardTitle>
                <CardDescription className="text-lg text-muted-foreground">Verify Your Email</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Skeleton className="h-5 w-3/4 mx-auto" />
                <Skeleton className="h-5 w-full mx-auto" />
                <Skeleton className="h-12 w-32 mx-auto mt-4" />
            </CardContent>
        </Card>
    );
}

export default function VerifyEmailPage() {
    return (
        <Suspense fallback={<VerifyEmailLoading />}>
            <VerifyEmailContent />
        </Suspense>
    );
}
