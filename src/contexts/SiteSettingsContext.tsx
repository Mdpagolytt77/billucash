import { createContext, useContext, useState, useEffect, ReactNode, forwardRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface BackgroundSettings {
  type: 'default' | 'color' | 'gradient' | 'image';
  color: string;
  gradient: string;
  imageUrl: string;
  overlay: number;
}

interface SiteSettings {
  logoType: 'text' | 'image';
  logoText: string;
  logoImageUrl: string | null;
  background: BackgroundSettings;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultBackground: BackgroundSettings = {
  type: 'default',
  color: '#0f1220',
  gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  imageUrl: '',
  overlay: 85,
};

const SiteSettingsContext = createContext<SiteSettings | undefined>(undefined);

export const useSiteSettings = () => {
  const context = useContext(SiteSettingsContext);
  if (!context) {
    throw new Error('useSiteSettings must be used within a SiteSettingsProvider');
  }
  return context;
};

export const SiteSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [logoType, setLogoType] = useState<'text' | 'image'>('text');
  const [logoText, setLogoText] = useState('BILLUCASH');
  const [logoImageUrl, setLogoImageUrl] = useState<string | null>(null);
  const [background, setBackground] = useState<BackgroundSettings>(defaultBackground);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase.rpc('get_public_site_settings');

      if (error) {
        console.error('Error loading site settings:', error);
        return;
      }

      if (data && data.length > 0) {
        const settings = data[0];
        if (settings.logo_type) setLogoType(settings.logo_type as 'text' | 'image');
        if (settings.logo_text) setLogoText(settings.logo_text);
        if (settings.logo_image_url) setLogoImageUrl(settings.logo_image_url);
        if (settings.background_settings && typeof settings.background_settings === 'object') {
          setBackground(prev => ({ ...prev, ...(settings.background_settings as unknown as BackgroundSettings) }));
        }
      }
    } catch (err) {
      console.error('Failed to load site settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();

    // Subscribe to real-time changes
    const channel = supabase
      .channel('site-settings-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'site_settings',
          filter: 'id=eq.default'
        },
        (payload) => {
          const newData = payload.new as any;
          if (newData.logo_type) setLogoType(newData.logo_type);
          if (newData.logo_text) setLogoText(newData.logo_text);
          setLogoImageUrl(newData.logo_image_url || null);
          if (newData.background_settings && typeof newData.background_settings === 'object') {
            setBackground(prev => ({ ...prev, ...newData.background_settings }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <SiteSettingsContext.Provider value={{
      logoType,
      logoText,
      logoImageUrl,
      background,
      isLoading,
      refreshSettings: loadSettings,
    }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};



// Helper component for rendering logo
export const SiteLogo = forwardRef<HTMLSpanElement, { className?: string; size?: 'sm' | 'md' | 'lg' }>(
  ({ className = '', size = 'md' }, ref) => {
    const { logoType, logoText, logoImageUrl } = useSiteSettings();
    
    const sizeClasses = {
      sm: 'text-sm max-h-6',
      md: 'text-lg max-h-8',
      lg: 'text-2xl max-h-12',
    };

    if (logoType === 'image' && logoImageUrl) {
      return <img src={logoImageUrl} alt="Logo" className={`object-contain ${sizeClasses[size]} ${className}`} />;
    }
    
    return <span ref={ref} className={`logo-3d ${sizeClasses[size]} ${className}`}>{logoText}</span>;
  }
);

SiteLogo.displayName = 'SiteLogo';

// Helper function for background style (returns CSS properties)
export const getBackgroundStyle = (background: BackgroundSettings, heroBgUrl?: string) => {
  const overlayOpacity = background.overlay / 100;
  
  if (background.type === 'default' && heroBgUrl) {
    return {
      background: `linear-gradient(rgba(0,0,0,${overlayOpacity}), rgba(0,0,0,${overlayOpacity})), url(${heroBgUrl}) no-repeat center center fixed`,
      backgroundSize: 'cover' as const,
    };
  }
  
  if (background.type === 'color') {
    return { backgroundColor: background.color };
  }
  
  if (background.type === 'gradient') {
    return { background: background.gradient };
  }
  
  if (background.type === 'image' && background.imageUrl) {
    return {
      background: `linear-gradient(rgba(0,0,0,${overlayOpacity}), rgba(0,0,0,${overlayOpacity})), url(${background.imageUrl}) no-repeat center center fixed`,
      backgroundSize: 'cover' as const,
    };
  }
  
  return { backgroundColor: '#0f1220' };
};
