
'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Moon, Bell, Music, Vibrate, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useSettings } from '@/hooks/use-settings.tsx';

function SettingsPage() {
  const { settings, setSetting, resetSettings } = useSettings();
  const { toast } = useToast();

  const handleReset = () => {
    resetSettings();
    toast({
      title: "Settings Reset",
      description: "All settings have been restored to their default values.",
    });
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <header className="p-4 bg-card/80 backdrop-blur-lg sticky top-0 z-10 border-b">
        <h1 className="text-2xl font-bold text-center text-foreground">⚙️ App Settings</h1>
      </header>

      <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-20">
        <Card className="bg-card shadow-lg">
          <CardHeader>
            <CardTitle>Theme</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="dark-mode" className="flex items-center gap-2 text-base">
                <Moon className="h-5 w-5" />
                <span>Dark Mode</span>
              </Label>
              <Switch id="dark-mode" checked={true} disabled />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Light mode is coming soon!
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-lg">
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="notifications" className="flex items-center gap-2 text-base">
                <Bell className="h-5 w-5" />
                <span>Quiz Reminders & Alerts</span>
              </Label>
              <Switch 
                id="notifications" 
                checked={settings.notifications}
                onCheckedChange={(checked) => setSetting('notifications', checked)}
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card shadow-lg">
          <CardHeader>
            <CardTitle>Sound & Haptics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="sound" className="flex items-center gap-2 text-base">
                <Music className="h-5 w-5" />
                <span>In-App Sounds</span>
              </Label>
              <Switch 
                id="sound" 
                checked={settings.sound}
                onCheckedChange={(checked) => setSetting('sound', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="vibration" className="flex items-center gap-2 text-base">
                <Vibrate className="h-5 w-5" />
                <span>Vibration Feedback</span>
              </Label>
              <Switch 
                id="vibration" 
                checked={settings.vibration}
                onCheckedChange={(checked) => setSetting('vibration', checked)}
              />
            </div>
          </CardContent>
        </Card>

        <Button variant="destructive" className="w-full" onClick={handleReset}>
          Reset All Settings to Default
        </Button>
      </main>
    </div>
  );
}

export default SettingsPage;
