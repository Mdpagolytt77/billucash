import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface FeaturedOffer {
  id: string;
  name: string;
  description: string | null;
  coins: number;
  image_url: string | null;
  color: string | null;
  link_url: string | null;
  is_active: boolean | null;
  sort_order: number | null;
}

interface FeaturedOffersSectionProps {
  onOfferClick?: () => void;
}

const FeaturedOffersSection = ({ onOfferClick }: FeaturedOffersSectionProps) => {
  const [offers, setOffers] = useState<FeaturedOffer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOffers = async () => {
      try {
        const { data, error } = await supabase
          .from('featured_offers')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (error) throw error;
        setOffers(data || []);
      } catch (error) {
        console.error('Error loading featured offers:', error);
      } finally {
        setLoading(false);
      }
    };

    loadOffers();
  }, []);

  if (loading) {
    return (
      <section className="py-6 px-4">
        <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="min-w-[160px] bg-muted rounded-xl overflow-hidden flex-shrink-0 animate-pulse"
            >
              <div className="h-24 bg-muted-foreground/20" />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-muted-foreground/20 rounded w-3/4" />
                <div className="h-3 bg-muted-foreground/20 rounded w-1/2" />
                <div className="h-4 bg-muted-foreground/20 rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (offers.length === 0) {
    return null;
  }

  return (
    <section className="py-6 px-4">
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {offers.map((offer) => (
          <div
            key={offer.id}
            onClick={onOfferClick}
            className="min-w-[160px] bg-muted rounded-xl overflow-hidden flex-shrink-0 group cursor-pointer transition-transform hover:-translate-y-1"
          >
            <div className={`h-24 bg-gradient-to-br ${offer.color || 'from-primary to-primary/80'} flex items-center justify-center overflow-hidden`}>
              {offer.image_url ? (
                <img 
                  src={offer.image_url}
                  alt={offer.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : (
                <div className="text-white/50 text-4xl">🎮</div>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-semibold text-sm truncate">{offer.name}</h3>
              <p className="text-xs text-muted-foreground truncate">{offer.description || 'Complete this offer'}</p>
              <p className="text-primary font-bold mt-1">${(offer.coins / 100).toFixed(2)}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default FeaturedOffersSection;
