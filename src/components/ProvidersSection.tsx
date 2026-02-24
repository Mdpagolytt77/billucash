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

  if (providerLogos.length === 0) {
    return (
      <section className="py-12 px-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">
            <span className="text-foreground">Our </span>
            <span className="text-gradient">Providers</span>
          </h2>
          <p className="text-muted-foreground text-sm">
            We work with the best providers to ensure you have the best experience
          </p>
        </div>
        
        <div 
          className="rounded-2xl p-6 max-w-3xl mx-auto"
          style={{ background: '#0E1625', border: '1px solid rgba(29,191,115,0.1)' }}
        >
          <div className="flex flex-wrap justify-center items-center gap-8">
            {['PremReach', 'SUSHI ADS', 'AdWebMedia', 'PubScale'].map((provider, index) => (
              <div
                key={index}
                className="text-lg md:text-xl font-bold opacity-50 hover:opacity-100 transition-all cursor-pointer"
                style={{ color: '#9AA6B2' }}
              >
                {provider}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  const duplicatedLogos = [...providerLogos, ...providerLogos];

  return (
    <section className="py-12 px-4">
      <div className="text-center mb-6">
        <h2 className="text-2xl md:text-3xl font-display font-bold mb-3">
          <span className="text-foreground">Our </span>
          <span className="text-gradient">Providers</span>
        </h2>
        <p className="text-muted-foreground text-sm">
          We work with the best providers to ensure you have the best experience
        </p>
      </div>
      
      <div 
        className="rounded-2xl p-6 max-w-3xl mx-auto overflow-hidden"
        style={{ background: '#0E1625', border: '1px solid rgba(29,191,115,0.1)' }}
      >
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
              className="h-10 md:h-12 object-contain opacity-70 hover:opacity-100 transition-opacity"
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProvidersSection;
