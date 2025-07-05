
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Moon, Bell, Music, Vibrate, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-orange-600 via-red-700 to-neutral-900">
      <header className="p-4 bg-background/70 backdrop-blur-lg sticky top-0 z-10 border-b">
        <h1 className="text-2xl font-bold text-center text-foreground">⚙️ App Settings</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        <Card className="bg-background/70 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle>Theme</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="flex items-center gap-2 text-base">
                <Moon className="h-5 w-5" />
                <span>Dark Mode</span>
              </Label>
              <Switch id="dark-mode" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/70 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications" className="flex items-center gap-2 text-base">
                <Bell className="h-5 w-5" />
                <span>Quiz Reminders & Alerts</span>
              </Label>
              <Switch id="notifications" defaultChecked />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-background/70 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle>Sound & Haptics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="sound" className="flex items-center gap-2 text-base">
                <Music className="h-5 w-5" />
                <span>In-App Sounds</span>
              </Label>
              <Switch id="sound" defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="vibration" className="flex items-center gap-2 text-base">
                <Vibrate className="h-5 w-5" />
                <span>Vibration Feedback</span>
              </Label>
              <Switch id="vibration" defaultChecked />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-background/70 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle>Hint Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="hint-ad" className="flex items-center gap-2 text-base">
                <RefreshCw className="h-5 w-5" />
                <span>Auto-play Hint Ad</span>
              </Label>
              <Switch id="hint-ad" defaultChecked />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              If off, you'll need to tap to play the ad for a hint.
            </p>
          </CardContent>
        </Card>

        <Button variant="destructive" className="w-full">
          Reset All Settings to Default
        </Button>
      </main>
    </div>
  );
}
