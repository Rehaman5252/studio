
'use client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from 'next/link';
import { LucideIcon } from "lucide-react";
import { usePathname } from "next/navigation";

interface LoginPromptProps {
    icon: LucideIcon;
    title: string;
    description: string;
}

export default function LoginPrompt({ icon: Icon, title, description }: LoginPromptProps) {
    const pathname = usePathname();

    return (
        <Card className="bg-card/80 animate-fade-in-up w-full max-w-md mx-auto">
            <CardHeader className="text-center">
                <div className="mx-auto bg-primary/20 p-4 rounded-full w-fit mb-4">
                    <Icon className="h-12 w-12 text-primary" />
                </div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                <Button asChild>
                    <Link href={`/auth/login?from=${pathname}`}>
                        Sign In / Sign Up
                    </Link>
                </Button>
            </CardContent>
        </Card>
    )
}
