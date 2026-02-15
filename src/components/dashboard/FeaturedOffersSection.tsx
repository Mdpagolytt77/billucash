import { useState, useEffect } from 'react';
import { Sparkles, Play, ChevronRight } from 'lucide-react';
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
          <Sparkles className="w-5 h-5 text-[#00C6FF]" />
          <h3 className="font-display font-bold text-lg text-white">Featured Partners</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="w-full h-28 rounded-[18px] bg-[#111827]" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8">
      {/* Section Container */}
      <div 
        className="p-5"
        style={{
          borderRadius: '22px',
          background: '#0F172A',
          border: '1px solid rgba(0,170,255,0.25)',
          boxShadow: '0 0 25px rgba(0,170,255,0.2)',
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #00C6FF, #0072FF)' }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h3 className="font-display font-bold text-lg text-white">Featured Partners</h3>
          </div>
          <button 
            className="flex items-center gap-1 text-sm font-semibold transition-all duration-300 px-4 py-1.5 hover:text-white"
            style={{
              color: '#00C6FF',
              border: '1px solid #00C6FF',
              borderRadius: '20px',
              background: 'transparent',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = '#00C6FF'; e.currentTarget.style.color = 'white'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#00C6FF'; }}
          >
            View All <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        {/* Horizontal scroll for game cards */}
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {displayOffers.map((offer) => (
            <div
              key={offer.id}
              onClick={() => handleOfferClick(offer)}
              className="flex-shrink-0 cursor-pointer group overflow-hidden transition-all duration-300 ease-out hover:scale-[1.04] hover:-translate-y-1"
              style={{ 
                width: '150px',
                height: '190px',
                borderRadius: '18px',
                background: '#111827',
                border: '1px solid rgba(0,170,255,0.2)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 0 20px rgba(0,170,255,0.4)';
                e.currentTarget.style.borderColor = '#00C6FF';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.borderColor = 'rgba(0,170,255,0.2)';
              }}
            >
              {/* Image area */}
              <div className="relative h-[110px] overflow-hidden" style={{ borderRadius: '18px 18px 0 0' }}>
                {offer.image_url ? (
                  <img src={offer.image_url} alt={offer.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${offer.color || '#1a1a2e'}, ${offer.color || '#1a1a2e'}88)` }}>
                    <span className="text-3xl">🎮</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-transparent to-transparent" />
                
                {/* Reward Badge */}
                <div 
                  className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold text-white"
                  style={{ background: '#00C6FF' }}
                >
                  <CoinIcon className="w-3 h-3 inline mr-0.5" />
                  {offer.coins.toLocaleString()}
                </div>
              </div>
              
              {/* Info */}
              <div className="p-3">
                <h4 className="text-xs font-semibold text-white truncate">{offer.name}</h4>
                <p className="text-[10px] text-[#A1A1AA] truncate mt-0.5">
                  {offer.description || 'Complete this offer'}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <p className="font-bold text-sm" style={{ color: '#00C6FF' }}>
                    ${(offer.coins / 100).toFixed(2)}
                  </p>
                  <div 
                    className="w-6 h-6 rounded-full flex items-center justify-center"
                    style={{ background: 'rgba(0,170,255,0.15)' }}
                  >
                    <Play className="w-3 h-3 text-[#00C6FF] fill-[#00C6FF]" />
                  </div>
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
