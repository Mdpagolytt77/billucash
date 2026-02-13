import { createContext, useContext, useState, useEffect, ReactNode, forwardRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BackgroundSettings {
  type: 'default' | 'color' | 'gradient' | 'image';
  color: string;
  gradient: string;
  imageUrl: string;
  overlay: number;
}

export interface PageBackgrounds {
  homepage: BackgroundSettings;
  dashboard: BackgroundSettings;
  admin: BackgroundSettings;
}

interface HomepageImages {
  heroIllustration: string;
  statsIllustration: string;
  howItWorksIllustration: string;
  signupIllustration: string;
}

interface SiteSettings {
  logoType: 'text' | 'image';
  logoText: string;
  logoImageUrl: string | null;
  coinIconUrl: string | null;
  backgrounds: PageBackgrounds;
  homepageImages: HomepageImages;
  isLoading: boolean;
  refreshSettings: () => Promise<void>;
}

const defaultBackground: BackgroundSettings = {
  type: 'default',
  color: '#0a0a0a',
  gradient: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
  imageUrl: '',
  overlay: 75,
};

const defaultBackgrounds: PageBackgrounds = {
  homepage: { ...defaultBackground },
  dashboard: { ...defaultBackground },
  admin: { ...defaultBackground },
};

const defaultHomepageImages: HomepageImages = {
  heroIllustration: '',
  statsIllustration: '',
  howItWorksIllustration: '',
  signupIllustration: '',
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
  const [logoText, setLogoText] = useState('WALLSCASH');
  const [logoImageUrl, setLogoImageUrl] = useState<string | null>(null);
  const [coinIconUrl, setCoinIconUrl] = useState<string | null>(null);
  const [backgrounds, setBackgrounds] = useState<PageBackgrounds>(defaultBackgrounds);
  const [homepageImages, setHomepageImages] = useState<HomepageImages>(defaultHomepageImages);
  const [isLoading, setIsLoading] = useState(true);

  const parseBackgrounds = (bgSettings: any): PageBackgrounds => {
    // Support new per-page format: { homepage: {...}, dashboard: {...}, admin: {...} }
    if (bgSettings && bgSettings.homepage) {
      return {
        homepage: { ...defaultBackground, ...bgSettings.homepage },
        dashboard: { ...defaultBackground, ...bgSettings.dashboard },
        admin: { ...defaultBackground, ...bgSettings.admin },
      };
    }
    // Legacy single background format: { type, color, gradient, imageUrl, overlay }
    if (bgSettings && bgSettings.type) {
      const legacy = { ...defaultBackground, ...bgSettings };
      return { homepage: legacy, dashboard: legacy, admin: legacy };
    }
    return defaultBackgrounds;
  };

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
        setCoinIconUrl(settings.coin_icon_url || null);
        if (settings.background_settings && typeof settings.background_settings === 'object') {
          setBackgrounds(parseBackgrounds(settings.background_settings));
        }
        if (settings.homepage_images && typeof settings.homepage_images === 'object') {
          setHomepageImages(prev => ({ ...prev, ...(settings.homepage_images as unknown as HomepageImages) }));
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
          setCoinIconUrl(newData.coin_icon_url || null);
          if (newData.background_settings && typeof newData.background_settings === 'object') {
            setBackgrounds(parseBackgrounds(newData.background_settings));
          }
          if (newData.homepage_images && typeof newData.homepage_images === 'object') {
            setHomepageImages(prev => ({ ...prev, ...newData.homepage_images }));
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
      coinIconUrl,
      backgrounds,
      homepageImages,
      isLoading,
      refreshSettings: loadSettings,
    }}>
      {children}
    </SiteSettingsContext.Provider>
  );
};

// Default coin icon URL
export const DEFAULT_COIN_ICON = 'https://cdn-icons-png.flaticon.com/512/2173/2173478.png';

// Helper component for rendering coin icon
export const CoinIcon = ({ className = 'w-4 h-4' }: { className?: string }) => {
  const { coinIconUrl } = useSiteSettings();
  return (
    <img 
      src={coinIconUrl || DEFAULT_COIN_ICON} 
      alt="Coin" 
      className={`object-contain ${className}`} 
    />
  );
};

// Helper component for rendering logo
export const SiteLogo = forwardRef<HTMLSpanElement, { className?: string; size?: 'sm' | 'md' | 'lg' }>(
  ({ className = '', size = 'md' }, ref) => {
    const { logoType, logoText, logoImageUrl } = useSiteSettings();
    
    const sizeClasses = {
      sm: 'text-sm max-h-6',
      md: 'text-lg max-h-8',
      lg: 'text-4xl max-h-16',
    };

    if (logoType === 'image' && logoImageUrl) {
      return <img src={logoImageUrl} alt="Logo" className={`object-contain ${sizeClasses[size]} ${className}`} />;
    }
    
    return <span ref={ref} className={`logo-3d ${sizeClasses[size]} ${className}`}>{logoText}</span>;
  }
);

SiteLogo.displayName = 'SiteLogo';

// Helper function for background style (returns CSS properties)
export const getBackgroundStyle = (background: BackgroundSettings, fallbackImageUrl?: string) => {
  const overlayOpacity = background.overlay / 100;
  
  if (background.type === 'default' && fallbackImageUrl) {
    return {
      background: `linear-gradient(rgba(0,0,0,${overlayOpacity}), rgba(0,0,0,${overlayOpacity})), url(${fallbackImageUrl}) no-repeat center center fixed`,
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
  
  return { backgroundColor: '#0a0a0a' };
};
