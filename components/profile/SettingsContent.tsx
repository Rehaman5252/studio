
'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useSettings } from '@/hooks/use-settings';
import { Bell, Volume2, Waves, SkipForward, Moon, Sun } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useTheme } from 'next-themes';

const SettingsItem = ({ icon, title, description, checked, onCheckedChange, disabled = false }: { icon: React.ReactNode, title: string, description: string, checked: boolean, onCheckedChange: (checked: boolean) => void, disabled?: boolean }) => (
    <div className="flex items-center justify-between space-x-2 rounded-lg p-4">
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
        disabled={disabled}
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
  const { theme, setTheme } = useTheme();

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
        <CardContent className="space-y-4 divide-y divide-border">
            <SettingsItem 
                icon={theme === 'dark' ? <Moon className="text-primary"/> : <Sun className="text-primary"/>}
                title="Dark Mode"
                description="Toggle between light and dark themes."
                checked={theme === 'dark'}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
            <SettingsItem 
                icon={<Bell className="text-primary"/>}
                title="Notifications"
                description="Receive alerts for upcoming quizzes."
                checked={settings.notifications}
                onCheckedChange={(value) => setSetting('notifications', value)}
            />
            <SettingsItem 
                icon={<Volume2 className="text-primary"/>}
                title="Sound Effects"
                description="Enable or disable in-game sounds."
                checked={settings.sound}
                onCheckedChange={(value) => setSetting('sound', value)}
            />
            <SettingsItem 
                icon={<Waves className="text-primary"/>}
                title="Vibration"
                description="Enable or disable haptic feedback."
                checked={settings.vibration}
                onCheckedChange={(value) => setSetting('vibration', value)}
            />
             <SettingsItem 
                icon={<SkipForward className="text-primary"/>}
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
