import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ProviderLogo {
  id: string;
  name: string;
  url: string;
}

const ProvidersSection = () => {
  const [providerLogos, setProviderLogos] = useState<ProviderLogo[]>([]);

  useEffect(() => {
    const fetchProviderLogos = async () => {
      try {
        const { data, error } = await supabase.rpc('get_public_site_settings');
        if (!error && data && data.length > 0) {
          const settings = data[0];
          if (settings.provider_logos && Array.isArray(settings.provider_logos)) {
            setProviderLogos(settings.provider_logos as unknown as ProviderLogo[]);
          }
        }
      } catch (err) {
        console.error('Failed to load provider logos:', err);
      }
    };

    fetchProviderLogos();
  }, []);

  // If no logos uploaded, show placeholder text
  if (providerLogos.length === 0) {
    return (
      <section className="py-10 px-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-display font-bold text-primary mb-2">
            Providers
          </h2>
          <p className="text-muted-foreground text-sm">
            We work with the best providers to ensure you have the best experience
          </p>
        </div>
        
        <div className="bg-muted rounded-2xl p-6 max-w-3xl mx-auto">
          <div className="flex flex-wrap justify-center items-center gap-8">
            {['PremReach', 'SUSHI ADS', 'AdWebMedia', 'PubScale'].map((provider, index) => (
              <div
                key={index}
                className="text-lg md:text-xl font-bold text-muted-foreground opacity-70 hover:opacity-100 hover:text-foreground transition-all cursor-pointer"
              >
                {provider}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Duplicate logos for infinite scroll effect
  const duplicatedLogos = [...providerLogos, ...providerLogos];

  return (
    <section className="py-10 px-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-primary mb-2">
          Providers
        </h2>
        <p className="text-muted-foreground text-sm">
          We work with the best providers to ensure you have the best experience
        </p>
      </div>
      
      <div className="bg-muted rounded-2xl p-6 max-w-3xl mx-auto overflow-hidden">
        <div 
          className="flex items-center gap-12 animate-scroll-left"
          style={{ 
            width: 'max-content',
            animationDuration: `${providerLogos.length * 3}s`
          }}
        >
          {duplicatedLogos.map((logo, index) => (
            <img
              key={`${logo.id}-${index}`}
              src={logo.url}
              alt={logo.name}
              className="h-10 md:h-12 object-contain opacity-80 hover:opacity-100 transition-opacity"
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProvidersSection;