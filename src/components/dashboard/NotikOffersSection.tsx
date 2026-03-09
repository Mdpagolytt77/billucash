import { useState, useEffect } from 'react';
import { ExternalLink, Coins, Smartphone } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface NotikOffer {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  click_url: string | null;
  payout: number;
  coins: number;
  country: string | null;
  platform: string | null;
  category: string | null;
}

const NotikOffersSection = () => {
  const { user } = useAuth();
  const [offers, setOffers] = useState<NotikOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOffers();
  }, []);

  const loadOffers = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notik_offers')
      .select('*')
      .eq('is_active', true)
      .order('coins', { ascending: false })
      .limit(50);

    if (!error && data) {
      setOffers(data as unknown as NotikOffer[]);
    }
    setLoading(false);
  };

  const handleOfferClick = (offer: NotikOffer) => {
    if (offer.click_url && user?.id) {
      const url = offer.click_url
        .replace(/\[user_id\]/gi, user.id)
        .replace(/{user_id}/gi, user.id)
        .replace(/\{uid\}/gi, user.id);
      window.open(url, '_blank');
    }
  };

  if (loading) {
    return (
      <section className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Coins className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg text-foreground">Notik Offers</h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: '#111111' }} />
          ))}
        </div>
      </section>
    );
  }

  if (offers.length === 0) return null;

  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Coins className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-lg text-foreground">Notik Offers</h3>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: '#1DBF7333', color: '#1DBF73' }}>
            {offers.length}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {offers.map((offer) => (
          <div
            key={offer.id}
            onClick={() => handleOfferClick(offer)}
            className="cursor-pointer group rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.03]"
            style={{ background: '#111111', border: '1px solid #1a1a1a' }}
          >
            {offer.image_url ? (
              <div className="w-full h-20 overflow-hidden">
                <img
                  src={offer.image_url}
                  alt={offer.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
              </div>
            ) : (
              <div className="w-full h-20 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1F1C2C, #928DAB)' }}>
                <span className="text-2xl font-black text-white/50">{offer.name.charAt(0)}</span>
              </div>
            )}

            <div className="p-2.5">
              <h4 className="text-[11px] font-bold text-white truncate mb-1">{offer.name}</h4>
              
              {offer.description && (
                <p className="text-[9px] text-muted-foreground line-clamp-2 mb-1.5">{offer.description}</p>
              )}

              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md" style={{ background: '#1DBF7333', color: '#1DBF73' }}>
                  +{offer.coins} coins
                </span>
                <div className="flex gap-1 items-center">
                  {offer.platform && (
                    <Smartphone className="w-2.5 h-2.5 text-muted-foreground" />
                  )}
                  <ExternalLink className="w-2.5 h-2.5 text-muted-foreground group-hover:text-white/60 transition-colors" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default NotikOffersSection;
