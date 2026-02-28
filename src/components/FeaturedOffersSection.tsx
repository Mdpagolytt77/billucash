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
      <div className="flex items-end justify-center gap-4 md:gap-6">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className={`rounded-2xl animate-pulse ${
              i === 1 ? 'w-[140px] md:w-[154px] h-[182px] md:h-[196px]' : 'w-[112px] md:w-[126px] h-[154px] md:h-[168px]'
            }`}
            style={{ background: '#111C2D', border: '1px solid rgba(29,191,115,0.2)' }}
          />
        ))}
      </div>
    );
  }

  if (offers.length === 0) return null;

  const displayOffers = offers.slice(0, 3);

  return (
    <div className="flex items-end justify-center gap-4 md:gap-6">
      {displayOffers.map((offer, index) => {
        const isCenter = index === 1 || displayOffers.length === 1;

        return (
          <div
            key={offer.id}
            onClick={onOfferClick}
            className={`flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 group flex flex-col ${
              isCenter 
                ? 'w-[140px] md:w-[154px] h-[182px] md:h-[196px]' 
                : 'w-[112px] md:w-[126px] h-[154px] md:h-[168px]'
            }`}
            style={{
              background: '#111C2D',
              border: '1px solid rgba(29,191,115,0.2)',
              boxShadow: '0 15px 40px rgba(0,0,0,0.6)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(29,191,115,0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(0,0,0,0.6)';
            }}
          >
            {/* Image */}
            <div className={`relative overflow-hidden flex-shrink-0 ${isCenter ? 'h-[112px] md:h-[126px]' : 'h-[91px] md:h-[105px]'}`}>
              {offer.image_url ? (
                <img
                  src={offer.image_url}
                  alt={offer.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              ) : (
                <div className={`w-full h-full bg-gradient-to-br ${offer.color || 'from-primary/80 to-secondary/60'} flex items-center justify-center`}>
                  <span className={`${isCenter ? 'text-5xl' : 'text-4xl'}`}>🎮</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-[#111C2D] via-transparent to-transparent" />
            </div>

            {/* Info */}
            <div className="p-3 flex-1 flex flex-col justify-between">
              <div>
                <h3 className={`${isCenter ? 'text-sm' : 'text-xs'} font-bold truncate text-foreground`}>{offer.name}</h3>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                  {offer.description || 'Complete this offer'}
                </p>
              </div>
              <div className="flex items-center justify-between mt-2">
                <p className={`font-bold ${isCenter ? 'text-sm' : 'text-xs'}`} style={{ color: '#1DBF73' }}>
                  ${(offer.coins / 100).toFixed(2)}
                </p>
                <div className="flex items-center gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-2.5 h-2.5" style={{ fill: '#FFD54F', color: '#FFD54F' }} />
                  ))}
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
