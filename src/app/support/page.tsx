
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mail, Settings, Send, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function SupportPage() {
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!message.trim()) {
        toast({
            title: "Empty Message",
            description: "Please type a message before sending.",
            variant: "destructive"
        });
        return;
    }
    
    setIsSending(true);

    // Simulate sending the message to a backend.
    // In a real app, this would be an API call.
    console.log("--- Support Message Sent ---");
    console.log(message);
    console.log("----------------------------");

    setTimeout(() => {
        toast({
            title: "Message Sent!",
            description: "Thank you for your feedback. Our team will review it shortly.",
        });
        setMessage(''); // Clear the textarea
        setIsSending(false);
    }, 1000);
  };

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

        <form onSubmit={handleSubmit}>
            <Card className="bg-card shadow-lg">
            <CardHeader>
                <CardTitle>Send a Message</CardTitle>
                <CardDescription>
                Have feedback or a question? Your message will be logged for our team to review.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Textarea 
                    placeholder="Type your message here..." 
                    rows={5} 
                    required 
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    disabled={isSending}
                />
                <Button type="submit" className="w-full" disabled={isSending}>
                  {isSending ? (
                      <><Loader2 className="mr-2 animate-spin" /> Sending...</>
                  ) : (
                      <><Send className="mr-2" /> Send Message</>
                  )}
                </Button>
            </CardContent>
            </Card>
        </form>

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
