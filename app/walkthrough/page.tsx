
'use client';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthProvider';
import GuidedTour from '@/components/home/GuidedTour';

export default function WalkthroughPage() {
  const { profile, updateUserData } = useAuth();
  const router = useRouter();

  const handleTourFinish = async () => {
    if (profile) {
      try {
        await updateUserData({ guidedTourCompleted: true });
        router.replace('/');
      } catch (error) {
        console.error("Failed to update tour status:", error);
        router.replace('/');
      }
    } else {
        router.replace('/');
    }
  };

  const needsTour = profile && !profile.guidedTourCompleted;

  if (profile === null) {
      // You can show a loading spinner here while the profile is being fetched.
      return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
      <div className="p-4">
          {/* This component will now control the UI for the tour */}
          <GuidedTour run={needsTour} onFinish={handleTourFinish} />
      </div>
  );
}
