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
      onOfferClick({ name: offer.name, color: offer.color || '#122333', iframeUrl: '' });
    }
  };

  const fallbackOffers: FeaturedOffer[] = [
    { id: '1', name: 'JustPlay', description: 'Cashout every 3 hours', coins: 240, color: '#122333', image_url: null, link_url: null },
    { id: '2', name: 'Radientwall', description: 'Radientwall', coins: 110, color: '#122333', image_url: null, link_url: null },
    { id: '3', name: 'AARP Rewards', description: 'Offery', coins: 50, color: '#122333', image_url: null, link_url: null },
    { id: '4', name: 'Cash Alarm', description: 'Play & Earn', coins: 320, color: '#122333', image_url: null, link_url: null },
    { id: '5', name: 'Wild Fish', description: 'Install the app', coins: 180, color: '#122333', image_url: null, link_url: null },
  ];

  const displayOffers = offers.length > 0 ? offers : fallbackOffers;

  if (loading) {
    return (
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5" style={{ color: '#1DBF73' }} />
          <h3 className="font-bold text-xl text-white">Hot Offers</h3>
        </div>
        <div className="flex gap-5 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-[180px] h-[210px] rounded-2xl animate-pulse" style={{ background: '#122333' }} />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5" style={{ color: '#1DBF73' }} />
          <h3 className="font-bold text-lg text-white">Hot Offers</h3>
        </div>
        <button className="text-xs font-medium flex items-center gap-0.5 transition-colors" style={{ color: '#9DB2C7' }}>
          View All <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      
      {/* Wrap in a box container */}
      <div 
        className="rounded-2xl p-4"
        style={{ background: '#0E1A27', border: '1px solid #162638' }}
      >
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2 -mx-1 px-1">
          {displayOffers.map((offer) => (
            <div
              key={offer.id}
              onClick={() => handleOfferClick(offer)}
              className="flex-shrink-0 cursor-pointer group overflow-hidden transition-all duration-300"
              style={{ 
                width: '150px',
                borderRadius: '16px',
                background: '#122333',
                border: '1px solid rgba(29,191,115,0.15)',
                boxShadow: '0 10px 25px rgba(0,0,0,0.4)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.4), 0 0 20px rgba(29,191,115,0.4)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.4)';
              }}
            >
              {/* Image area */}
              <div className="relative h-[90px] overflow-hidden rounded-t-[16px]">
                {offer.image_url ? (
                  <img src={offer.image_url} alt={offer.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${offer.color || '#122333'}, ${offer.color || '#122333'}88)` }}>
                    <div className="w-20 h-20 rounded-xl bg-white/10 flex items-center justify-center">
                      <span className="text-3xl">🎮</span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Info */}
              <div className="p-3">
                <h4 className="text-xs font-bold text-white truncate">{offer.name}</h4>
                <p className="text-[10px] truncate mt-0.5" style={{ color: '#9DB2C7' }}>
                  {offer.description || 'Complete this offer'}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-semibold text-sm" style={{ color: '#1DBF73' }}>
                    ${(offer.coins / 100).toFixed(2)}
                  </span>
                  <span 
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-md text-white"
                    style={{ background: '#6C4BFF' }}
                  >
                    APP
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedOffersSection;
