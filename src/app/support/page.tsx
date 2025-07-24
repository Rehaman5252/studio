
'use client';

import React from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Settings, MessageSquare } from 'lucide-react';

function SupportPage() {

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
            <a href="mailto:support@indcric.app" className="text-lg font-semibold text-primary">support@indcric.app</a>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-lg">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare />
                    WhatsApp Support
                </CardTitle>
                <CardDescription>
                Chat with us directly on WhatsApp for quick assistance.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <a href="https://wa.me/917842722245" target="_blank" rel="noopener noreferrer" className="text-lg font-semibold text-primary block">+91 7842722245</a>
                <Button asChild className="w-full">
                  <a href="https://wa.me/917842722245" target="_blank" rel="noopener noreferrer">
                    <MessageSquare className="mr-2" /> Start Chat
                  </a>
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

export default SupportPage;
