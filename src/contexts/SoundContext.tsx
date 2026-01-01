import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface SoundSettings {
  enabled: boolean;
  loginSound: boolean;
  signupSound: boolean;
  balanceSound: boolean;
  volume: number;
}

interface SoundContextType {
  settings: SoundSettings;
  isLoading: boolean;
  playLoginSound: () => void;
  playSignupSound: () => void;
  playBalanceSound: () => void;
  refreshSettings: () => Promise<void>;
}

const defaultSettings: SoundSettings = {
  enabled: true,
  loginSound: true,
  signupSound: true,
  balanceSound: true,
  volume: 70,
};

// Audio URLs (royalty-free notification sounds)
const SOUND_URLS = {
  login: 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3',
  signup: 'https://assets.mixkit.co/active_storage/sfx/2867/2867-preview.mp3',
  balance: 'https://assets.mixkit.co/active_storage/sfx/2003/2003-preview.mp3', // Coin drop sound
};

const SoundContext = createContext<SoundContextType | undefined>(undefined);

export const useSoundContext = () => {
  const context = useContext(SoundContext);
  if (!context) {
    throw new Error('useSoundContext must be used within a SoundProvider');
  }
  return context;
};

export const SoundProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<SoundSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pre-loaded audio refs
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({
    login: null,
    signup: null,
    balance: null,
  });

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase.rpc('get_public_site_settings');

      if (error) {
        console.error('Error loading sound settings:', error);
        return;
      }

      if (data && data.length > 0 && data[0].sound_settings && typeof data[0].sound_settings === 'object') {
        const soundData = data[0].sound_settings as Record<string, unknown>;
        setSettings(prev => ({
          ...prev,
          enabled: soundData.enabled !== undefined ? Boolean(soundData.enabled) : prev.enabled,
          loginSound: soundData.loginSound !== undefined ? Boolean(soundData.loginSound) : (soundData.clickSound !== undefined ? Boolean(soundData.clickSound) : prev.loginSound),
          signupSound: soundData.signupSound !== undefined ? Boolean(soundData.signupSound) : (soundData.notificationSound !== undefined ? Boolean(soundData.notificationSound) : prev.signupSound),
          balanceSound: soundData.balanceSound !== undefined ? Boolean(soundData.balanceSound) : (soundData.successSound !== undefined ? Boolean(soundData.successSound) : prev.balanceSound),
          volume: typeof soundData.volume === 'number' ? soundData.volume : prev.volume,
        }));
      }
    } catch (err) {
      console.error('Failed to load sound settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Preload audio files
  useEffect(() => {
    Object.entries(SOUND_URLS).forEach(([key, url]) => {
      const audio = new Audio(url);
      audio.preload = 'auto';
      audioRefs.current[key] = audio;
    });

    return () => {
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
    };
  }, []);

  useEffect(() => {
    loadSettings();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('sound-settings-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'site_settings',
          filter: 'id=eq.default'
        },
        (payload) => {
          const newData = payload.new as Record<string, unknown>;
          if (newData.sound_settings && typeof newData.sound_settings === 'object') {
            const soundData = newData.sound_settings as Record<string, unknown>;
            setSettings(prev => ({
              ...prev,
              enabled: soundData.enabled !== undefined ? Boolean(soundData.enabled) : prev.enabled,
              loginSound: soundData.loginSound !== undefined ? Boolean(soundData.loginSound) : prev.loginSound,
              signupSound: soundData.signupSound !== undefined ? Boolean(soundData.signupSound) : prev.signupSound,
              balanceSound: soundData.balanceSound !== undefined ? Boolean(soundData.balanceSound) : prev.balanceSound,
              volume: typeof soundData.volume === 'number' ? soundData.volume : prev.volume,
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const playSound = useCallback((type: 'login' | 'signup' | 'balance') => {
    if (!settings.enabled) return;
    
    const shouldPlay = {
      login: settings.loginSound,
      signup: settings.signupSound,
      balance: settings.balanceSound,
    }[type];

    if (!shouldPlay) return;

    const audio = audioRefs.current[type];
    if (audio) {
      audio.volume = settings.volume / 100;
      audio.currentTime = 0;
      audio.play().catch(err => console.log('Audio play prevented:', err));
    }
  }, [settings]);

  const playLoginSound = useCallback(() => playSound('login'), [playSound]);
  const playSignupSound = useCallback(() => playSound('signup'), [playSound]);
  const playBalanceSound = useCallback(() => playSound('balance'), [playSound]);

  return (
    <SoundContext.Provider value={{
      settings,
      isLoading,
      playLoginSound,
      playSignupSound,
      playBalanceSound,
      refreshSettings: loadSettings,
    }}>
      {children}
    </SoundContext.Provider>
  );
};
