
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
        router.replace('/home');
      } catch (error) {
        console.error("Failed to update tour status:", error);
        router.replace('/home');
      }
    } else {
        router.replace('/home');
    }
  };

  const needsTour = profile && !profile.guidedTourCompleted;

  if (profile === null) {
      return <div>Loading...</div>
  }

  return (
      <div className="p-4">
          <GuidedTour run={needsTour} onFinish={handleTourFinish} />
      </div>
  );
}
