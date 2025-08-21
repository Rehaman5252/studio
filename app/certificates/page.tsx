'use client';

import CertificatesContent from '@/components/certificates/CertificatesContent';
import LoginPrompt from '@/components/auth/LoginPrompt';
import { useAuth } from '@/context/AuthProvider';
import { Award } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import PageWrapper from '@/components/PageWrapper';

const CertificatesSkeleton = () => (
    <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
    </div>
);

export default function CertificatesPage() {
  const { user, loading } = useAuth();
  
  return (
    <PageWrapper title="My Certificates">
        {loading ? <CertificatesSkeleton /> : user ? <CertificatesContent /> : (
            <div className="pt-8">
                <LoginPrompt 
                    icon={Award}
                    title="View Your Achievements"
                    description="Sign in to view and download your perfect score certificates."
                />
            </div>
        )}
    </PageWrapper>
  );
}
