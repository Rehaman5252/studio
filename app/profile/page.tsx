
"use client";
import React from "react";
import { useAuth } from "@/context/AuthProvider";
import { User as UserIcon, Settings, Scale, LogOut, ChevronRight, Edit, Award } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import PageWrapper from "@/components/PageWrapper";
import ProfileSkeleton from "@/components/profile/ProfileSkeleton";
import LoginPrompt from "@/components/auth/LoginPrompt";
import SupportCard from "@/components/profile/SupportCard";
import AdaptiveDynamicPage from "@/components/common/AdaptiveDynamicPage";
import { pagesConfig } from "@/app/config/pagesConfig";
import { useRouter } from "next/navigation";

const LoggedOutProfileView = () => {
    const { logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.replace('/auth/login');
    };
    
    return (
        <div className="space-y-4">
            <LoginPrompt
                icon={UserIcon}
                title="Step into the Player's Pavilion"
                description="Sign in to view your profile, track stats, and manage your account."
            />
            <section className="space-y-3 pt-4">
                <Button asChild size="lg" className="w-full justify-between text-base py-6" variant="secondary">
                    <Link href="/settings">
                        <div className="flex items-center">
                            <Settings className="mr-4 text-primary" /> App Settings
                        </div>
                        <ChevronRight/>
                    </Link>
                </Button>
                <Button asChild size="lg" className="w-full justify-between text-base py-6" variant="secondary">
                    <Link href="/policies">
                        <div className="flex items-center">
                            <Scale className="mr-4 text-primary" /> Legal & Policies
                        </div>
                        <ChevronRight/>
                    </Link>
                </Button>
            </section>
            <SupportCard />
             <section className="pt-4">
                <Button variant="destructive" size="lg" className="w-full" onClick={handleLogout}>
                    <LogOut className="mr-2 h-5 w-5" /> Logout
                </Button>
            </section>
        </div>
    );
}

const LoggedInProfileView = () => {
    const profilePageConfig = pagesConfig.find(p => p.path === '/profile');
    const { logout } = useAuth();
    const router = useRouter();

    const handleLogout = async () => {
        await logout();
        router.replace('/auth/login');
    };

    if (!profilePageConfig) {
        return <div>Error: Profile page configuration not found.</div>;
    }

    return (
        <div className="space-y-4">
            <AdaptiveDynamicPage cards={profilePageConfig.cards} defaultHeights={profilePageConfig.defaultHeights} />
             <section className="space-y-3 pt-4">
                <Button asChild size="lg" className="w-full justify-between text-base py-6" variant="secondary">
                    <Link href="/certificates">
                        <div className="flex items-center">
                            <Award className="mr-4 text-primary" /> View Certificates
                        </div>
                        <ChevronRight/>
                    </Link>
                </Button>
                <Button asChild size="lg" className="w-full justify-between text-base py-6" variant="secondary">
                    <Link href="/contribute">
                        <div className="flex items-center">
                             <Edit className="mr-4 text-primary" /> Contribute
                        </div>
                        <ChevronRight/>
                    </Link>
                </Button>
                <Button asChild size="lg" className="w-full justify-between text-base py-6" variant="secondary">
                    <Link href="/settings">
                        <div className="flex items-center">
                            <Settings className="mr-4 text-primary" /> App Settings
                        </div>
                        <ChevronRight/>
                    </Link>
                </Button>
                <Button asChild size="lg" className="w-full justify-between text-base py-6" variant="secondary">
                    <Link href="/policies">
                        <div className="flex items-center">
                            <Scale className="mr-4 text-primary" /> Legal & Policies
                        </div>
                        <ChevronRight/>
                    </Link>
                </Button>
            </section>
            <SupportCard />
            <section className="pt-4">
                <Button variant="destructive" size="lg" className="w-full" onClick={handleLogout}>
                    <LogOut className="mr-2 h-5 w-5" /> Logout
                </Button>
            </section>
        </div>
    );
};


export default function ProfilePage() {
    const { user, loading } = useAuth();
    
    const renderContent = () => {
        if (loading) {
            return <ProfileSkeleton />;
        }
        return user ? <LoggedInProfileView /> : <LoggedOutProfileView />;
    }

    return (
        <PageWrapper title="Player's Pavilion">
            {renderContent()}
        </PageWrapper>
    );
}
