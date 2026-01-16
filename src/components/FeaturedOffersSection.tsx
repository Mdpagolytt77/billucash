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

  // Get first 3 offers for display
  const displayOffers = offers.slice(0, 3);

  if (loading) {
    return (
      <section className="py-8 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent rounded-3xl" />
        <div className="flex justify-center items-end gap-3 md:gap-6 relative z-10">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`bg-muted/50 backdrop-blur-sm rounded-2xl overflow-hidden animate-pulse border border-border/30 ${
                i === 1 ? 'w-40 md:w-48' : 'w-32 md:w-40'
              }`}
            >
              <div className={`${i === 1 ? 'h-32 md:h-40' : 'h-24 md:h-32'} bg-muted-foreground/10`} />
              <div className="p-3 space-y-2">
                <div className="h-4 bg-muted-foreground/10 rounded w-3/4" />
                <div className="h-3 bg-muted-foreground/10 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (displayOffers.length === 0) {
    return null;
  }

  // Reorder: if 3 offers, put middle one in center (index 1)
  const orderedOffers = displayOffers.length === 3 
    ? [displayOffers[0], displayOffers[1], displayOffers[2]]
    : displayOffers;

  return (
    <section className="py-8 px-4 relative">
      {/* Subtle background glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-primary/8 via-primary/3 to-transparent rounded-3xl blur-xl" />
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-32 bg-gradient-to-r from-transparent via-primary/10 to-transparent blur-2xl" />
      
      <div className="flex justify-center items-end gap-3 md:gap-5 relative z-10">
        {orderedOffers.map((offer, index) => {
          const isCenter = orderedOffers.length === 3 && index === 1;
          
          return (
            <div
              key={offer.id}
              onClick={onOfferClick}
              className={`bg-muted/60 backdrop-blur-md rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 border border-border/40 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 group ${
                isCenter 
                  ? 'w-40 md:w-52 transform hover:-translate-y-2 z-20' 
                  : 'w-32 md:w-40 opacity-90 hover:opacity-100 hover:-translate-y-1'
              }`}
            >
              <div className={`relative overflow-hidden ${isCenter ? 'h-36 md:h-44' : 'h-28 md:h-32'}`}>
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
                {/* Subtle overlay gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
              </div>
              
              <div className={`p-3 ${isCenter ? 'p-4' : 'p-3'}`}>
                <h3 className={`font-semibold truncate text-foreground ${isCenter ? 'text-base' : 'text-sm'}`}>
                  {offer.name}
                </h3>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {offer.description || 'Complete this offer'}
                </p>
                <div className="flex items-center justify-between mt-2">
                  <p className={`text-primary font-bold ${isCenter ? 'text-lg' : 'text-base'}`}>
                    ${(offer.coins / 100).toFixed(2)}
                  </p>
                  <div className="flex items-center gap-0.5">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    <span className="text-xs text-muted-foreground">5.0</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default FeaturedOffersSection;
