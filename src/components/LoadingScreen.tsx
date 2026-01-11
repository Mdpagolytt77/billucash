import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LoadingScreenProps {
  isLoading: boolean;
}

// This component fetches logo settings independently to avoid circular dependency
// and to show the correct logo even before main settings context loads
const LoadingScreen = ({ isLoading }: LoadingScreenProps) => {
  const [logoType, setLogoType] = useState<'text' | 'image'>('text');
  const [logoText, setLogoText] = useState('');
  const [logoImageUrl, setLogoImageUrl] = useState<string | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    const loadLogoSettings = async () => {
      try {
        const { data, error } = await supabase.rpc('get_public_site_settings');
        
        if (!error && data && data.length > 0) {
          const settings = data[0];
          if (settings.logo_type) setLogoType(settings.logo_type as 'text' | 'image');
          if (settings.logo_text) setLogoText(settings.logo_text);
          if (settings.logo_image_url) setLogoImageUrl(settings.logo_image_url);
        }
      } catch (err) {
        console.error('LoadingScreen: Failed to load logo settings:', err);
      } finally {
        setSettingsLoaded(true);
      }
    };

    loadLogoSettings();
  }, []);
  
  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-background flex justify-center items-center z-[9999] flex-col">
      <div className="text-center">
        <div className="mb-3 min-h-[64px] flex items-center justify-center">
          {settingsLoaded ? (
            logoType === 'image' && logoImageUrl ? (
              <img src={logoImageUrl} alt="Logo" className="max-h-16 object-contain mx-auto" />
            ) : logoText ? (
              <span className="logo-3d text-2xl font-display font-black">{logoText}</span>
            ) : null
          ) : null}
        </div>
        <div className="w-8 h-8 border-2 border-muted border-t-primary rounded-full animate-spin-slow mx-auto mb-2" />
        <div className="text-muted-foreground text-[10px]">
          Loading...
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
