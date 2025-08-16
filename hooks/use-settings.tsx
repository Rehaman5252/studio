
'use client';

import { useState, useEffect, createContext, useContext, ReactNode, useCallback } from 'react';

export interface Settings {
  notifications: boolean;
  sound: boolean;
  vibration: boolean;
  autoSkipAd: boolean;
}

const defaultSettings: Settings = {
  notifications: true,
  sound: true,
  vibration: true,
  autoSkipAd: false, // Default to disabled
};

// Define the type for the setSetting function separately to avoid JSX parsing issues with generics.
type SetSettingType = <K extends keyof Settings>(key: K, value: Settings[K]) => void;

interface SettingsContextType {
  settings: Settings;
  setSetting: SetSettingType;
  resetSettings: () => void;
  isLoading: boolean;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // This effect runs only on the client
    try {
      const storedSettings = localStorage.getItem('app-settings');
      if (storedSettings) {
        setSettings({ ...defaultSettings, ...JSON.parse(storedSettings) });
      }
    } catch (error) {
      console.error("Failed to load settings from localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const setSetting: SetSettingType = useCallback((key, value) => {
    setSettings(prevSettings => {
      const newSettings = { ...prevSettings, [key]: value };
      try {
        localStorage.setItem('app-settings', JSON.stringify(newSettings));
      } catch (error)      {
        console.error("Failed to save settings to localStorage", error);
      }
      return newSettings;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(defaultSettings);
    try {
      localStorage.setItem('app-settings', JSON.stringify(defaultSettings));
    } catch (error) {
      console.error("Failed to reset settings in localStorage", error);
    }
  }, []);
  
  const value = { settings, setSetting, resetSettings, isLoading };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
