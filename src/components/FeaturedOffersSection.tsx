import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Star } from 'lucide-react';

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
          .order('sort_order', { ascending: true })
          .limit(3);

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
      <div className="flex items-end justify-center gap-3 md:gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`bg-muted/50 rounded-2xl overflow-hidden animate-pulse border border-border/30 ${
              i === 1 ? 'w-36 md:w-44 h-52 md:h-60' : 'w-28 md:w-36 h-44 md:h-52'
            }`}
          />
        ))}
      </div>
    );
  }

  if (offers.length === 0) return null;

  // Pad to 3 if less
  const displayOffers = offers.slice(0, 3);

  return (
    <div className="flex items-end justify-center gap-3 md:gap-5">
      {displayOffers.map((offer, index) => {
        const isCenter = index === 1 || displayOffers.length === 1;
        const cardWidth = isCenter ? 'w-36 md:w-44' : 'w-28 md:w-36';
        const cardHeight = isCenter ? 'h-52 md:h-60' : 'h-44 md:h-52';
        const imageHeight = isCenter ? 'h-32 md:h-38' : 'h-24 md:h-32';

        return (
          <div
            key={offer.id}
            onClick={onOfferClick}
            className={`${cardWidth} ${cardHeight} flex-shrink-0 bg-muted/60 backdrop-blur-md rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 border border-border/40 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1 group flex flex-col`}
          >
            <div className={`relative ${imageHeight} overflow-hidden flex-shrink-0`}>
              {offer.image_url ? (
                <img
                  src={offer.image_url}
                  alt={offer.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${offer.color || 'from-primary/80 to-primary/40'} flex items-center justify-center`}>
                  <span className={`${isCenter ? 'text-5xl' : 'text-3xl'}`}>🎮</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
            </div>

            <div className="p-2 flex-1 flex flex-col justify-between">
              <div>
                <h3 className={`${isCenter ? 'text-sm' : 'text-xs'} font-semibold truncate text-foreground`}>{offer.name}</h3>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {offer.description || 'Complete this offer'}
                </p>
              </div>
              <div className="flex items-center justify-between mt-1.5">
                <p className={`text-primary font-bold ${isCenter ? 'text-sm' : 'text-xs'}`}>
                  ${(offer.coins / 100).toFixed(2)}
                </p>
                <div className="flex items-center gap-0.5">
                  <Star className="w-2.5 h-2.5 fill-yellow-500 text-yellow-500" />
                  <span className="text-[9px] text-muted-foreground">5.0</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default FeaturedOffersSection;
