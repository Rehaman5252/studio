
'use client';
import CompleteProfileForm from "@/components/auth/CompleteProfileForm";

export default function CompleteProfilePage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-secondary p-4">
            <div className="w-full max-w-lg">
                <CompleteProfileForm />
            </div>
        </div>
    )
}
