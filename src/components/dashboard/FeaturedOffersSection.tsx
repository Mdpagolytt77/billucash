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

      if (!error && data) setOffers(data);
      setLoading(false);
    };

    loadOffers();

    const channel = supabase
      .channel('featured-offers-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'featured_offers' }, () => { loadOffers(); })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleOfferClick = (offer: FeaturedOffer) => {
    if (offer.link_url) {
      window.open(offer.link_url, '_blank');
    } else {
      onOfferClick({ name: offer.name, color: offer.color || '#1a1a2e', iframeUrl: '' });
    }
  };

  const fallbackOffers: FeaturedOffer[] = [
    { id: '1', name: 'JustPlay', description: 'Cashout every 3 hours', coins: 240, color: '#1a1a2e', image_url: null, link_url: null },
    { id: '2', name: 'Radientwall', description: 'Radientwall', coins: 110, color: '#2d2d44', image_url: null, link_url: null },
    { id: '3', name: 'AARP Rewards', description: 'Offery', coins: 50, color: '#1e3a5f', image_url: null, link_url: null },
    { id: '4', name: 'Cash Alarm', description: 'Play & Earn', coins: 320, color: '#3d2d4a', image_url: null, link_url: null },
    { id: '5', name: 'Wild Fish', description: 'Install the app', coins: 180, color: '#0d4a4a', image_url: null, link_url: null },
  ];

  const displayOffers = offers.length > 0 ? offers : fallbackOffers;

  if (loading) {
    return (
      <section className="mb-5">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Flame className="w-5 h-5 text-primary" />
            <h3 className="font-display font-bold text-base text-foreground">Hot Offers</h3>
          </div>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-[140px] h-[200px] rounded-2xl bg-card animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-5">
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-400" />
          <h3 className="font-display font-bold text-base text-foreground">Hot Offers</h3>
        </div>
        <button className="text-xs font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-0.5">
          View All <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      
      {/* Horizontal scroll cards */}
      <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
        {displayOffers.map((offer) => (
          <div
            key={offer.id}
            onClick={() => handleOfferClick(offer)}
            className="flex-shrink-0 cursor-pointer group overflow-hidden transition-all duration-200 active:scale-[0.97]"
            style={{ 
              width: '140px',
              borderRadius: '16px',
              background: 'hsl(var(--card))',
              border: '1px solid hsl(var(--border) / 0.5)',
            }}
          >
            {/* Image area */}
            <div className="relative h-[120px] overflow-hidden rounded-t-[16px]">
              {offer.image_url ? (
                <img src={offer.image_url} alt={offer.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${offer.color || '#1a1a2e'}, ${offer.color || '#1a1a2e'}88)` }}>
                  <span className="text-4xl">🎮</span>
                </div>
              )}
            </div>
            
            {/* Info */}
            <div className="p-2.5">
              <h4 className="text-xs font-bold text-foreground truncate">{offer.name}</h4>
              <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                {offer.description || 'Complete this offer'}
              </p>
              <div className="flex items-center justify-between mt-2">
                <span className="font-bold text-sm text-primary">
                  ${(offer.coins / 100).toFixed(2)}
                </span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-md bg-primary/15 text-primary border border-primary/20">
                  APP
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturedOffersSection;
