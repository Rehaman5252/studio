
'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/hooks/use-settings';
import { Bell, Volume2, Waves, SkipForward } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

const SettingsItem = ({ icon, title, description, checked, onCheckedChange }: { icon: React.ReactNode, title: string, description: string, checked: boolean, onCheckedChange: (checked: boolean) => void }) => (
    <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
      <div className="flex items-start space-x-4">
        <div className="text-primary mt-1">{icon}</div>
        <div className="flex flex-col">
            <Label htmlFor={`setting-${title}`} className="font-medium">
            {title}
            </Label>
            <span className="text-xs text-muted-foreground">{description}</span>
        </div>
      </div>
      <Switch
        id={`setting-${title}`}
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={title}
      />
    </div>
  );
  
const SettingsSkeleton = () => (
    <div className="space-y-4">
        <Skeleton className="h-[74px] w-full" />
        <Skeleton className="h-[74px] w-full" />
        <Skeleton className="h-[74px] w-full" />
        <Skeleton className="h-[74px] w-full" />
    </div>
);


const SettingsContentComponent = () => {
  const { settings, setSetting, resetSettings, isLoading } = useSettings();

  if (isLoading) {
    return <SettingsSkeleton />;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
          <CardDescription>Manage your in-app experience.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <SettingsItem 
                icon={<Bell />}
                title="Notifications"
                description="Receive alerts for upcoming quizzes."
                checked={settings.notifications}
                onCheckedChange={(value) => setSetting('notifications', value)}
            />
            <SettingsItem 
                icon={<Volume2 />}
                title="Sound Effects"
                description="Enable or disable in-game sounds."
                checked={settings.sound}
                onCheckedChange={(value) => setSetting('sound', value)}
            />
            <SettingsItem 
                icon={<Waves />}
                title="Vibration"
                description="Enable or disable haptic feedback."
                checked={settings.vibration}
                onCheckedChange={(value) => setSetting('vibration', value)}
            />
             <SettingsItem 
                icon={<SkipForward />}
                title="Auto-Skip Ads"
                description="Automatically skip ads when possible."
                checked={settings.autoSkipAd}
                onCheckedChange={(value) => setSetting('autoSkipAd', value)}
            />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Reset Settings</CardTitle>
          <CardDescription>
            This will restore all settings to their default values.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" onClick={resetSettings}>
            Reset to Defaults
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

const SettingsContent = memo(SettingsContentComponent);
export default SettingsContent;
