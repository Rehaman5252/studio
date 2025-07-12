
'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Settings, Send, Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthProvider';
import { useRouter } from 'next/navigation';

function SupportPageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    router.replace('/auth/login');
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b">
        <h1 className="text-2xl font-bold text-center text-foreground">🆘 Help & Support</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        <Card className="bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail />
              Contact Support
            </CardTitle>
            <CardDescription>
              For urgent issues, please email us directly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <a href="mailto:support@indcric.com" className="text-lg font-semibold text-primary">support@indcric.com</a>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-lg">
          <CardHeader>
            <CardTitle>Send a Message</CardTitle>
            <CardDescription>
              Have feedback or a question? Send us a message below.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea placeholder="Type your message here..." rows={5} />
            <Button className="w-full">
              <Send className="mr-2" />
              Send Message
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-lg">
            <CardHeader>
                <CardTitle>Customize Your Experience</CardTitle>
                <CardDescription>
                    Adjust theme, sound, and notification preferences.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild className="w-full" variant="secondary">
                    <Link href="/settings">
                        <Settings className="mr-2" />
                        Go to Settings
                    </Link>
                </Button>
            </CardContent>
        </Card>
      </main>
    </div>
  );
}

export default function SupportPage() {
    return <SupportPageContent />;
}
