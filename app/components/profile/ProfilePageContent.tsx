
'use client';
import React, { memo } from 'react';
import { useAuth } from "@/context/AuthProvider";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Award, Edit, LogOut, Settings, Scale, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import SupportCard from './SupportCard';
import DailyStreakCard from './DailyStreakCard';
import ProfileStats from './ProfileStats';
import ReferralCard from './ReferralCard';

function ProfilePageContent() {
  const { logout, user, profile } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.replace('/auth/login');
  };

  if (!user || !profile) {
    return null;
  }
  
  return (
    <div className="space-y-4">
      {/* This component is now redundant. The content has been moved to app/profile/page.tsx */}
    </div>
  );
}

export default memo(ProfilePageContent);
