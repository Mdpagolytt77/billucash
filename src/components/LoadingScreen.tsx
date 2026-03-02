import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface LoadingScreenProps {
  isLoading?: boolean;
}

const LoadingScreen = ({ isLoading = true }: LoadingScreenProps) => {
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
        {/* Logo */}
        <div className="mb-6 min-h-[64px] flex items-center justify-center">
          {settingsLoaded ? (
            logoType === 'image' && logoImageUrl ? (
              <img src={logoImageUrl} alt="Logo" className="max-h-16 object-contain mx-auto" />
            ) : logoText ? (
              <span className="logo-3d text-3xl font-display font-black">{logoText}</span>
            ) : null
          ) : null}
        </div>
        
        {/* Three Bouncing Dots */}
        <div className="flex items-center justify-center gap-2">
          <div 
            className="w-3 h-3 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: '0ms', animationDuration: '0.6s' }}
          />
          <div 
            className="w-3 h-3 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: '150ms', animationDuration: '0.6s' }}
          />
          <div 
            className="w-3 h-3 rounded-full bg-primary animate-bounce"
            style={{ animationDelay: '300ms', animationDuration: '0.6s' }}
          />
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;