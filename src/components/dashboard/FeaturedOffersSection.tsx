import { useState, useEffect } from 'react';
import { Flame, ChevronRight } from 'lucide-react';
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
          <Flame className="w-5 h-5 text-orange-500" />
          <h3 className="font-display font-bold text-lg">Featured Offers</h3>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex-shrink-0 w-32 animate-pulse">
              <div className="w-full aspect-[3/4] rounded-2xl bg-muted mb-2" />
              <div className="h-3 bg-muted rounded w-3/4 mb-1" />
              <div className="h-2 bg-muted rounded w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      <div className="flex items-center justify-between mb-4 px-1">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <h3 className="font-display font-bold text-lg bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Featured Offers</h3>
        </div>
        <button className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-medium transition-colors">
          View All <ChevronRight className="w-4 h-4" />
        </button>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-3 scrollbar-hide">
        {displayOffers.map((offer) => (
          <div
            key={offer.id}
            onClick={() => handleOfferClick(offer)}
            className="flex-shrink-0 w-32 cursor-pointer group"
          >
            {/* Card Image - 3D Effect */}
            <div 
              className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden mb-2 transform group-hover:scale-105 group-hover:-translate-y-1 transition-all duration-300 shadow-xl group-hover:shadow-2xl group-hover:shadow-primary/20"
              style={{ 
                background: `linear-gradient(145deg, ${offer.color || '#1a1a2e'}ee, ${offer.color || '#1a1a2e'}99, ${offer.color || '#1a1a2e'}66)`,
                boxShadow: `0 10px 30px -10px ${offer.color || '#1a1a2e'}66, 0 5px 15px -5px rgba(0,0,0,0.4)`
              }}
            >
              {offer.image_url ? (
                <img 
                  src={offer.image_url} 
                  alt={offer.name}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <>
                  {/* Decorative elements */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20 shadow-lg">
                      <span className="text-3xl">🎮</span>
                    </div>
                  </div>
                </>
              )}
              
              {/* Top badge */}
              <div className="absolute top-2 right-2 w-6 h-6 rounded-lg bg-black/40 backdrop-blur-sm flex items-center justify-center border border-white/10">
                <span className="text-xs">📱</span>
              </div>
              
              {/* Bottom gradient overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/80 to-transparent" />
            </div>
            
            {/* Info */}
            <h4 className="text-sm font-bold text-foreground truncate group-hover:text-primary transition-colors">{offer.name}</h4>
            <p className="text-[10px] text-muted-foreground truncate mb-1.5">{offer.description}</p>
            
            {/* Coins - 3D Badge */}
            <div className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-gradient-to-r from-primary/20 to-secondary/20 border border-primary/30 shadow-md">
              <CoinIcon className="w-3.5 h-3.5" />
              <span className="text-xs font-bold text-primary">
                {offer.coins.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturedOffersSection;
