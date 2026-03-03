import { useState, useEffect } from 'react';
import { Flame, ChevronRight, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FeaturedOffer {
  id: string;
  name: string;
  description: string | null;
  coins: number;
  image_url: string | null;
  color: string | null;
  link_url: string | null;
  row_number: number;
}

interface FeaturedOffersSectionProps {
  onOfferClick: (offer: { name: string; color: string; iframeUrl: string }) => void;
}

const OfferCard = ({ offer, onClick }: { offer: FeaturedOffer; onClick: () => void }) => {
  const payout = (offer.coins / 100).toFixed(2);

  return (
    <div
      onClick={onClick}
      className="snake-glow-card flex-shrink-0 cursor-pointer group overflow-visible transition-all duration-300 hover:-translate-y-1.5"
      style={{ width: '108px' }}
    >
      <div className="relative z-10 rounded-2xl overflow-hidden h-full" style={{ background: '#111C2D', border: '1px solid rgba(29,191,115,0.08)' }}>
        {/* Image area */}
        <div className="relative h-[72px] overflow-hidden">
          {offer.image_url ? (
            <img
              src={offer.image_url}
              alt={offer.name}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background: `linear-gradient(135deg, ${offer.color || '#1DBF73'}22, ${offer.color || '#1DBF73'}08)`,
              }}
            >
              <span className="text-2xl">🎮</span>
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#111C2D] via-transparent to-transparent" />
          
          {/* Payout badge */}
          <div
            className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[8px] font-bold text-white backdrop-blur-sm"
            style={{ background: 'rgba(29,191,115,0.85)' }}
          >
            ${payout}
          </div>
        </div>

        {/* Info */}
        <div className="p-2 pt-1.5">
          <h4 className="text-[10px] font-bold text-white truncate leading-tight">{offer.name}</h4>
          <p className="text-[8px] truncate mt-0.5 leading-tight" style={{ color: '#6B8299' }}>
            {offer.description || 'Complete this offer'}
          </p>
          <div className="flex items-center justify-between mt-1.5">
            <div className="flex items-center gap-0.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#1DBF73' }} />
              <span className="text-[7px] font-medium" style={{ color: '#1DBF73' }}>Active</span>
            </div>
            <ExternalLink className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: '#6B8299' }} />
          </div>
        </div>
      </div>
    </div>
  );
};

const FeaturedOffersSection = ({ onOfferClick }: FeaturedOffersSectionProps) => {
  const [offers, setOffers] = useState<FeaturedOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOffers = async () => {
      const { data, error } = await supabase
        .from('featured_offers')
        .select('id, name, description, coins, image_url, color, link_url, row_number')
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
    { id: '1', name: 'JustPlay', description: 'Cashout every 3 hours', coins: 240, color: '#1DBF73', image_url: null, link_url: null, row_number: 1 },
    { id: '2', name: 'Radientwall', description: 'Radientwall', coins: 110, color: '#6C4BFF', image_url: null, link_url: null, row_number: 1 },
    { id: '3', name: 'AARP Rewards', description: 'Offery', coins: 50, color: '#FF6B35', image_url: null, link_url: null, row_number: 1 },
    { id: '4', name: 'Cash Alarm', description: 'Play & Earn', coins: 320, color: '#1DBF73', image_url: null, link_url: null, row_number: 2 },
    { id: '5', name: 'Wild Fish', description: 'Install the app', coins: 180, color: '#00B4D8', image_url: null, link_url: null, row_number: 2 },
  ];

  const allOffers = offers.length > 0 ? offers : fallbackOffers;
  const row1Offers = allOffers.filter(o => o.row_number === 1);
  const row2Offers = allOffers.filter(o => o.row_number === 2);

  if (loading) {
    return (
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Flame className="w-5 h-5 fire-icon" />
          <h3 className="font-bold text-lg text-rainbow">Hot Offers</h3>
        </div>
        <div className="flex gap-3 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex-shrink-0 w-[108px] h-[140px] rounded-2xl animate-pulse" style={{ background: '#111C2D' }} />
          ))}
        </div>
      </section>
    );
  }

  const renderRow = (rowOffers: FeaturedOffer[], label: string) => {
    if (rowOffers.length === 0) return null;
    return (
      <div
        className="rounded-2xl p-3 mb-3"
        style={{ background: '#0C1520', border: '1px solid #15202E' }}
      >
        <div className="flex items-center gap-1.5 mb-2">
          <div className="w-1 h-3 rounded-full" style={{ background: '#1DBF73' }} />
          <span className="text-[10px] font-semibold tracking-wide uppercase" style={{ color: '#4A6A82' }}>{label}</span>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
          {rowOffers.map((offer) => (
            <OfferCard key={offer.id} offer={offer} onClick={() => handleOfferClick(offer)} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 fire-icon" />
          <h3 className="font-bold text-lg text-rainbow">Hot Offers</h3>
          {allOffers.length > 0 && (
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
              style={{ background: 'rgba(29,191,115,0.15)', color: '#1DBF73' }}
            >
              {allOffers.length}
            </span>
          )}
        </div>
        <button className="text-xs font-medium flex items-center gap-0.5 transition-colors hover:opacity-80" style={{ color: '#4A6A82' }}>
          View All <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {renderRow(row1Offers, 'Featured')}
      {renderRow(row2Offers, 'Trending')}
    </section>
  );
};

export default FeaturedOffersSection;
