import { useState, useEffect } from 'react';
import { Sparkles, Play } from 'lucide-react';
import { CoinIcon } from '@/contexts/SiteSettingsContext';
import { supabase } from '@/integrations/supabase/client';

interface FeaturedOffer {
  id: string;
  name: string;
  description: string | null;
  coins: number;
  image_url: string | null;
  color: string | null;
  link_url: string | null;
}

interface FeaturedOffersSectionProps {
  onOfferClick: (offer: { name: string; color: string; iframeUrl: string }) => void;
}

const FeaturedOffersSection = ({ onOfferClick }: FeaturedOffersSectionProps) => {
  const [offers, setOffers] = useState<FeaturedOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOffers = async () => {
      const { data, error } = await supabase
        .from('featured_offers')
        .select('id, name, description, coins, image_url, color, link_url')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (!error && data) {
        setOffers(data);
      }
      setLoading(false);
    };

    loadOffers();

    const channel = supabase
      .channel('featured-offers-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'featured_offers',
        },
        () => {
          loadOffers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleOfferClick = (offer: FeaturedOffer) => {
    if (offer.link_url) {
      window.open(offer.link_url, '_blank');
    } else {
      onOfferClick({ 
        name: offer.name, 
        color: offer.color || '#1a1a2e', 
        iframeUrl: '' 
      });
    }
  };

  const fallbackOffers: FeaturedOffer[] = [
    { id: '1', name: 'Gamers Universe', description: 'Register and collect...', coins: 384441, color: '#1a1a2e', image_url: null, link_url: null },
    { id: '2', name: 'Wizards Bag', description: 'Reach 5000m han...', coins: 142300, color: '#2d2d44', image_url: null, link_url: null },
    { id: '3', name: 'Spaceship Rush', description: '1.Click on the Link...', coins: 109707, color: '#1e3a5f', image_url: null, link_url: null },
    { id: '4', name: 'Hopping Pumpkin', description: '1.Click the link belo...', coins: 102393, color: '#3d2d4a', image_url: null, link_url: null },
    { id: '5', name: 'Wild Fish', description: 'Install the app and...', coins: 98882, color: '#0d4a4a', image_url: null, link_url: null },
  ];

  const displayOffers = offers.length > 0 ? offers : fallbackOffers;

  if (loading) {
    return (
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-3 px-1">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-display font-bold text-lg">Featured Partners</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="w-full h-28 rounded-2xl bg-muted" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4 px-1">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <h3 className="font-display font-bold text-lg bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Featured Partners</h3>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        {displayOffers.map((offer) => (
          <div
            key={offer.id}
            onClick={() => handleOfferClick(offer)}
            className="relative cursor-pointer group overflow-hidden border border-primary/10 hover:border-primary/30 transition-all duration-300 ease-out hover:scale-[1.03] hover:shadow-lg hover:shadow-green-500/10"
            style={{ 
              height: '190px',
              borderRadius: '20px',
              background: offer.image_url 
                ? undefined 
                : `linear-gradient(135deg, ${offer.color || '#1a1a2e'}, ${offer.color || '#1a1a2e'}88)`,
            }}
          >
            {/* Background image */}
            {offer.image_url && (
              <img 
                src={offer.image_url} 
                alt={offer.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
            
            {/* Content */}
            <div className="relative z-10 h-full flex flex-col justify-between p-6">
              {/* Logo/Name at top */}
              <span className="text-sm font-bold text-white/90 drop-shadow-md">{offer.name}</span>
              
              <div>
                <p className="text-lg sm:text-xl font-extrabold text-white drop-shadow-lg leading-tight">
                  EARN UP TO {offer.coins.toLocaleString()}
                  <span className="ml-1 inline-flex"><CoinIcon className="w-4 h-4 inline" /></span>
                </p>
                <p className="text-[11px] text-white/70 font-semibold tracking-widest mt-1 uppercase">
                  {offer.description || 'SIMPLE, FAST, REAL'}
                </p>
              </div>
            </div>

            {/* Play button */}
            <div className="absolute right-4 bottom-4 z-10 w-[50px] h-[50px] rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-500/40 group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 text-white fill-white ml-0.5" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturedOffersSection;
