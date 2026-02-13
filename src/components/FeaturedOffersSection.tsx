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

  if (loading) {
    return (
      <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="w-40 flex-shrink-0 bg-muted/50 rounded-2xl overflow-hidden animate-pulse border border-border/30">
            <div className="h-36 bg-muted-foreground/10" />
            <div className="p-3 space-y-2">
              <div className="h-4 bg-muted-foreground/10 rounded w-3/4" />
              <div className="h-3 bg-muted-foreground/10 rounded w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (offers.length === 0) return null;

  return (
    <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
      {offers.map((offer) => (
        <div
          key={offer.id}
          onClick={onOfferClick}
          className="w-40 md:w-44 flex-shrink-0 bg-muted/60 backdrop-blur-md rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 border border-border/40 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-1 group"
        >
          <div className="relative h-36 md:h-40 overflow-hidden">
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
                <span className="text-4xl">🎮</span>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
          </div>
          
          <div className="p-3">
            <h3 className="text-sm font-semibold truncate text-foreground">{offer.name}</h3>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {offer.description || 'Complete this offer'}
            </p>
            <div className="flex items-center justify-between mt-2">
              <p className="text-primary font-bold text-base">
                ${(offer.coins / 100).toFixed(2)}
              </p>
              <div className="flex items-center gap-0.5">
                <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                <span className="text-xs text-muted-foreground">5.0</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default FeaturedOffersSection;
